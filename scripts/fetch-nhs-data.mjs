/**
 * fetch-nhs-data.mjs
 *
 * Build-time script that fetches GP Practice list size data from NHS England's
 * "Patients Registered at a GP Practice" monthly publication and writes a
 * processed JSON file consumed by the Veris GP list size comparison tool.
 *
 * Run automatically during `npm run build` via netlify.toml.
 * Always exits 0 — a fetch failure is non-fatal; the tool falls back to
 * sample data.
 *
 * Data source:
 *   https://digital.nhs.uk/data-and-information/publications/statistical/
 *   patients-registered-at-a-gp-practice
 *
 * Key files fetched each month:
 *   gp-reg-pat-prac-all.csv  — one row per practice / sex / age band
 *   gp-reg-pat-prac-map.csv  — practice names, postcodes, ICB mappings
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUTPUT_PATH = resolve(ROOT, 'src/data/nhsData.generated.json')
const MONTHS_TO_KEEP = 24

const NHS_BASE = 'https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice'

// Browser-like headers — NHS Digital's CDN blocks non-browser User-Agents
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ─── Helpers ──────────────────────────────────────────────────────────────

function monthSlug(year, month) {
  return `${MONTH_NAMES[month - 1]}-${year}`
}

function monthLabel(year, month) {
  return `${MONTH_SHORT[month - 1]} ${year}`
}

function monthId(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Returns the last MONTHS_TO_KEEP months ending with the month before today */
function targetMonths() {
  const result = []
  const now = new Date()
  // Start from last month — NHS England publishes between the 10th-16th,
  // so by the time this runs (17th) last month's data should be live.
  for (let offset = 1; offset <= MONTHS_TO_KEEP; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    result.unshift({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return result
}

/** Load existing generated data (for incremental updates) */
function loadExisting() {
  if (!existsSync(OUTPUT_PATH)) return null
  try {
    return JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
  } catch {
    return null
  }
}

/** Simple timeout wrapper — AbortSignal.timeout() not reliable in all Node versions */
function fetchWithTimeout(url, options = {}, timeoutMs = 20_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

/** Fetch HTML of the NHS Digital publication page for a given month */
async function fetchPublicationPage(year, month) {
  const url = `${NHS_BASE}/${monthSlug(year, month)}`
  const res = await fetchWithTimeout(url, { headers: FETCH_HEADERS }, 20_000)
  if (!res.ok) {
    console.log(`     ✗  HTTP ${res.status} ${res.statusText} — ${url}`)
    return null
  }
  return res.text()
}

/**
 * Parse the publication page HTML to extract file URLs.
 * NHS Digital hosts files at:
 *   https://files.digital.nhs.uk/[2-hex]/[6-hex]/filename.csv|zip
 */
function extractFileUrl(html, filename) {
  const pattern = new RegExp(
    `https://files\\.digital\\.nhs\\.uk/[A-F0-9]{2}/[A-F0-9]{6}/${filename}\\.(csv|zip)`,
    'i',
  )
  const match = html.match(pattern)
  return match ? match[0] : null
}

/** Fetch a URL and return either a CSV string or the first CSV inside a ZIP */
async function fetchCSVText(url) {
  const res = await fetchWithTimeout(url, { headers: FETCH_HEADERS }, 120_000)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`)

  const buf = Buffer.from(await res.arrayBuffer())

  if (url.toLowerCase().endsWith('.zip')) {
    const zip = new AdmZip(buf)
    const entries = zip.getEntries()
    // Prefer the named all-patients file; fall back to any CSV
    const target =
      entries.find(e => /gp-reg-pat-prac-all/i.test(e.name) && e.name.endsWith('.csv')) ||
      entries.find(e => e.name.endsWith('.csv'))
    if (!target) throw new Error('No CSV entry found in ZIP')
    return target.getData().toString('utf8')
  }

  return buf.toString('utf8')
}

/**
 * Parse CSV text and return { totals, postcodeLookup } where:
 *   totals        — { [orgCode]: totalPatients }
 *   orgTypes      — { [orgCode]: orgType } (to filter for GPs)
 */
function parseAllPatientsCSV(csvText) {
  const lines = csvText.split(/\r?\n/)
  if (lines.length < 2) return {}

  // Normalise headers
  const raw = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toUpperCase())
  const col = name => raw.findIndex(h => h === name || h.includes(name))

  const iCode     = col('ORG_CODE')
  const iType     = col('ORG_TYPE')
  const iSex      = col('SEX')
  const iAge      = col('AGE')
  const iPatients = col('NUMBER_OF_PATIENTS')

  if (iCode < 0 || iPatients < 0) {
    console.warn('    ⚠  Unexpected CSV format — missing ORG_CODE or NUMBER_OF_PATIENTS')
    return {}
  }

  // Group rows by practice code
  const rows = {} // { [code]: Row[] }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',')

    const code = cols[iCode]?.trim().replace(/^"|"$/g, '')
    if (!code) continue

    // Keep GP practices only
    if (iType >= 0) {
      const type = cols[iType]?.trim().toUpperCase()
      if (!type.startsWith('GP')) continue
    }

    const sex = iSex >= 0 ? cols[iSex]?.trim().toUpperCase() : 'ALL'
    const age = iAge >= 0 ? cols[iAge]?.trim().toUpperCase() : 'ALL'
    const patients = parseInt(cols[iPatients]?.trim() || '0', 10)
    if (isNaN(patients)) continue

    if (!rows[code]) rows[code] = []
    rows[code].push({ sex, age, patients })
  }

  // Aggregate to a single total per practice using priority logic:
  //   1. SEX=ALL, AGE=ALL  (summary row — most reliable)
  //   2. SEX=MALE+FEMALE, AGE=ALL
  //   3. Sum all MALE rows + all FEMALE rows by individual age
  const totals = {}
  for (const [code, practiceRows] of Object.entries(rows)) {
    const allAll = practiceRows.find(r => r.sex === 'ALL' && r.age === 'ALL')
    if (allAll) { totals[code] = allAll.patients; continue }

    const maleAll   = practiceRows.find(r => r.sex === 'MALE'   && r.age === 'ALL')
    const femaleAll = practiceRows.find(r => r.sex === 'FEMALE' && r.age === 'ALL')
    if (maleAll && femaleAll) { totals[code] = maleAll.patients + femaleAll.patients; continue }

    // Fall back: sum age-banded rows (MALE + FEMALE to avoid double-counting ALL rows)
    const aged = practiceRows.filter(
      r => (r.sex === 'MALE' || r.sex === 'FEMALE') && r.age !== 'ALL'
    )
    if (aged.length > 0) {
      totals[code] = aged.reduce((s, r) => s + r.patients, 0)
      continue
    }

    // Last resort: sum everything
    totals[code] = practiceRows.reduce((s, r) => s + r.patients, 0)
  }

  return totals
}

/**
 * Parse the mapping CSV to extract practice name, postcode and ICB name.
 * The mapping file has varied column names across publications — we search
 * for columns by partial name match.
 */
function parseMappingCSV(csvText) {
  const lines = csvText.split(/\r?\n/)
  if (lines.length < 2) return {}

  const raw = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toUpperCase())
  const col = (...candidates) => raw.findIndex(h => candidates.some(c => h.includes(c)))

  const iCode     = col('ORG_CODE', 'CODE')
  const iName     = col('NAME', 'ORG_NAME')
  const iPost     = col('POSTCODE', 'POST')
  // ICB / commissioner name — column label has varied over the years
  const iIcb      = col('ICB_NAME', 'COMMISSIONER_ORG_NAME', 'COMM_NAME', 'ICB')

  if (iCode < 0 || iName < 0) {
    console.warn('    ⚠  Mapping CSV: cannot find CODE or NAME columns')
    return {}
  }

  const lookup = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',')
    const code = cols[iCode]?.trim().replace(/^"|"$/g, '')
    if (!code) continue
    lookup[code] = {
      name:     cols[iName]?.trim().replace(/^"|"$/g, '') || code,
      postcode: iPost >= 0 ? cols[iPost]?.trim().replace(/^"|"$/g, '') : '',
      icb:      iIcb  >= 0 ? cols[iIcb ]?.trim().replace(/^"|"$/g, '') : '',
    }
  }
  return lookup
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📋  Veris — NHS GP list size data fetch')
  console.log('━'.repeat(50))

  const targets = targetMonths()
  const existing = loadExisting()

  // Determine which months are already cached
  const cached = new Set(existing?.periods?.map(p => p.id) ?? [])
  const needed = targets.filter(t => !cached.has(monthId(t.year, t.month)))

  console.log(`  Target:  ${targets.length} months  (${monthLabel(targets[0].year, targets[0].month)} → ${monthLabel(targets.at(-1).year, targets.at(-1).month)})`)
  console.log(`  Cached:  ${cached.size} months already stored`)
  console.log(`  To fetch: ${needed.length} months\n`)

  if (needed.length === 0) {
    console.log('✅  All months up to date — no fetch needed\n')
    return
  }

  // We'll build the merged dataset from scratch using cached + newly fetched
  // Existing per-practice monthly data: { [code]: [...listSizes aligned to existing periods] }
  const existingPracticeData = {}
  if (existing?.practices) {
    for (const p of existing.practices) {
      existingPracticeData[p.code] = {
        name: p.name, postcode: p.postcode, icb: p.icb,
        // Map period id → list size for easy merging
        byPeriod: Object.fromEntries((existing.periods ?? []).map((period, i) => [period.id, p.listSizes[i]]))
      }
    }
  }

  // Also track national totals per period
  const nationalByPeriod = {}
  if (existing?.periods) {
    for (let i = 0; i < existing.periods.length; i++) {
      nationalByPeriod[existing.periods[i].id] = existing.nationalAverages?.[i] ?? null
    }
  }

  // Keep a mapping lookup from the latest month we can fetch
  let mappingLookup = {}

  // Fetch each needed month
  let successCount = 0
  for (const { year, month } of needed) {
    const label = monthLabel(year, month)
    const id    = monthId(year, month)
    console.log(`  ↓  ${label}`)

    try {
      // Step 1: get the publication page HTML
      const html = await fetchPublicationPage(year, month)
      if (!html) { console.log(`     ⚠  Publication page not found (data may not be released yet)`); continue }

      // Step 2: extract file URLs
      const allUrl = extractFileUrl(html, 'gp-reg-pat-prac-all')
      const mapUrl = extractFileUrl(html, 'gp-reg-pat-prac-map')

      if (!allUrl) { console.log(`     ⚠  Cannot find gp-reg-pat-prac-all URL on publication page`); continue }

      // Step 3: fetch and parse main data file
      console.log(`     Downloading: ${allUrl}`)
      const allCSV = await fetchCSVText(allUrl)
      const totals = parseAllPatientsCSV(allCSV)

      const practiceCount = Object.keys(totals).length
      if (practiceCount === 0) { console.log(`     ⚠  CSV parsed but found 0 practices — skipping`); continue }

      const nationalAvg = Math.round(
        Object.values(totals).reduce((s, v) => s + v, 0) / practiceCount
      )
      nationalByPeriod[id] = nationalAvg

      // Merge into per-practice store
      for (const [code, size] of Object.entries(totals)) {
        if (!existingPracticeData[code]) {
          existingPracticeData[code] = { name: code, postcode: '', icb: '', byPeriod: {} }
        }
        existingPracticeData[code].byPeriod[id] = size
      }

      // Step 4: fetch mapping file (for practice names / ICB)
      if (mapUrl) {
        console.log(`     Downloading: ${mapUrl}`)
        try {
          const mapCSV = await fetchCSVText(mapUrl)
          mappingLookup = parseMappingCSV(mapCSV)
          // Apply names from this month's mapping to all practices
          for (const [code, meta] of Object.entries(mappingLookup)) {
            if (existingPracticeData[code]) {
              existingPracticeData[code].name     = meta.name     || existingPracticeData[code].name
              existingPracticeData[code].postcode = meta.postcode || existingPracticeData[code].postcode
              existingPracticeData[code].icb      = meta.icb      || existingPracticeData[code].icb
            }
          }
        } catch (err) {
          console.warn(`     ⚠  Mapping fetch failed: ${err.message}`)
        }
      }

      console.log(`     ✓  ${practiceCount.toLocaleString()} practices, national avg: ${nationalAvg.toLocaleString()}`)
      successCount++
    } catch (err) {
      console.warn(`     ✗  Failed: ${err.message}`)
    }
  }

  if (successCount === 0) {
    console.log('\n⚠  No new months fetched. Keeping existing generated data.\n')
    return
  }

  // ─── Assemble final output ───────────────────────────────────────────────
  // Restrict to the target 24-month window
  const allPeriodIds = targets.map(t => monthId(t.year, t.month))

  // Only include practices with data in at least one target period
  const practices = []
  for (const [code, data] of Object.entries(existingPracticeData)) {
    const listSizes = allPeriodIds.map(id => data.byPeriod[id] ?? null)
    if (listSizes.every(v => v === null)) continue
    practices.push({
      code,
      name:     data.name || code,
      postcode: data.postcode || '',
      icb:      data.icb || '',
      pcn:      '',
      listSizes,
    })
  }

  // Sort practices alphabetically for consistent search results
  practices.sort((a, b) => a.name.localeCompare(b.name))

  const periodsOut = targets.map(({ year, month }) => ({
    id:    monthId(year, month),
    label: monthLabel(year, month),
  }))

  const nationalAverages = allPeriodIds.map(id => nationalByPeriod[id] ?? null)

  const output = {
    isGenerated:    true,
    generatedAt:    new Date().toISOString(),
    source:         'NHS England GP Patient Register',
    sourceUrl:      'https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice',
    periods:        periodsOut,
    nationalAverages,
    practices,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅  Written ${OUTPUT_PATH}`)
  console.log(`   Periods:   ${periodsOut.length}`)
  console.log(`   Practices: ${practices.length.toLocaleString()}`)
  console.log(`   Fetched:   ${successCount} new months\n`)
}

main().catch(err => {
  // Non-fatal — log and exit 0 so the build continues with sample data
  console.error('\n✗  fetch-nhs-data failed (non-fatal):', err.message)
  console.error('   The tool will use sample data until the next successful fetch.\n')
  process.exit(0)
})
