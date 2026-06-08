/**
 * fetch-branch-data.mjs
 *
 * Downloads GP practice branch surgery locations from the NHS ODS and
 * writes src/data/gpBranchLocations.json.
 *
 * Data source:
 *   https://www.odsdatasearchandexport.nhs.uk/api/getReport?report=ebranchs
 *   (NHS ODS ebranchs — no authentication required)
 *
 * Column layout (0-indexed, no header row):
 *   0   Branch ODS code
 *   1   Branch name
 *   4-8 Address lines 1-5
 *   9   Postcode
 *   10  Open date  (YYYYMMDD)
 *   11  Close date (YYYYMMDD — empty = still active)
 *   14  Parent practice ODS code
 *
 * Postcodes geocoded via postcodes.io (free, no key, bulk endpoint).
 *
 * Output format:
 *   { [parentPracticeCode]: [{ code, name, lat, lng }] }
 *
 * Run:  node scripts/fetch-branch-data.mjs
 */

import { writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const OUT_PATH  = resolve(ROOT, 'src/data/gpBranchLocations.json')
const META_PATH = resolve(ROOT, 'src/data/gpDataMeta.json')

const EBRANCHS_URL = 'https://www.odsdatasearchandexport.nhs.uk/api/getReport?report=ebranchs'

// Today in YYYYMMDD format for close-date comparison
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '')

// ── CSV helpers ───────────────────────────────────────────────────────────

function parseLine(line) {
  const fields = []
  let inQuote = false
  let cur = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      fields.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur.trim())
  return fields
}

// ── Geocoding via postcodes.io ────────────────────────────────────────────

function normalisePostcode(raw) {
  // Remove spaces and uppercase → "SW1A1AA"
  return raw.replace(/\s+/g, '').toUpperCase()
}

function formatPostcode(norm) {
  // postcodes.io needs a space before the inward code (last 3 chars)
  return norm.slice(0, -3).trim() + ' ' + norm.slice(-3)
}

async function geocodeBatch(normalised) {
  const formatted = normalised.map(formatPostcode)
  const res = await fetch('https://api.postcodes.io/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes: formatted }),
  })
  if (!res.ok) throw new Error(`postcodes.io HTTP ${res.status}`)
  const { result } = await res.json()
  const map = {}
  for (const item of result) {
    if (item?.result) {
      const key = normalisePostcode(item.query)
      map[key] = { lat: item.result.latitude, lng: item.result.longitude }
    }
  }
  return map
}

async function geocodeAll(postcodes) {
  const unique = [...new Set(postcodes.map(normalisePostcode).filter(Boolean))]
  const coordsByPostcode = {}
  const BATCH = 100
  const total = Math.ceil(unique.length / BATCH)
  console.log(`  Geocoding ${unique.length} unique postcodes in ${total} batches…`)

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH)
    const batchNum = Math.floor(i / BATCH) + 1
    try {
      const result = await geocodeBatch(batch)
      Object.assign(coordsByPostcode, result)
      process.stdout.write(`\r  Batch ${batchNum}/${total} done (${Object.keys(coordsByPostcode).length} geocoded)`)
    } catch (e) {
      console.warn(`\n  Batch ${batchNum} failed: ${e.message}`)
    }
    if (i + BATCH < unique.length) {
      await new Promise(r => setTimeout(r, 120))
    }
  }
  console.log()
  return coordsByPostcode
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching GP branch surgery data from NHS ODS…')
  console.log(`  Today: ${TODAY}`)

  // 1. Download CSV
  console.log(`  GET ${EBRANCHS_URL}`)
  const res = await fetch(EBRANCHS_URL, {
    headers: { 'Accept': 'text/csv,*/*', 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} from NHS ODS`)

  const text  = await res.text()
  const lines = text.split('\n').filter(l => l.trim())
  console.log(`  ${lines.length} total rows in ebranchs`)

  // 2. Parse and filter
  const branches = []
  let skipped = 0

  for (const line of lines) {
    const f = parseLine(line)
    if (f.length < 15) { skipped++; continue }

    const code       = f[0]
    const name       = f[1]
    const postcode   = normalisePostcode(f[9] ?? '')
    const closeDate  = f[11] ?? ''          // empty = still active
    const parentCode = f[14]

    if (!code || !parentCode || !postcode) { skipped++; continue }

    // Skip if close date is set and already in the past
    if (closeDate && closeDate < TODAY) continue

    branches.push({ code, name, postcode, parentCode })
  }

  console.log(`  ${branches.length} active branches parsed (${skipped} rows skipped)`)

  // 3. Geocode
  const postcodes = branches.map(b => b.postcode)
  const coords    = await geocodeAll(postcodes)

  // 4. Group by parent practice
  const byParent = {}
  let geocoded = 0
  let missing  = 0

  for (const { code, name, postcode, parentCode } of branches) {
    const c = coords[postcode]
    if (!c) { missing++; continue }

    if (!byParent[parentCode]) byParent[parentCode] = []
    byParent[parentCode].push({
      code,
      name,
      lat: Math.round(c.lat * 1e6) / 1e6,
      lng: Math.round(c.lng * 1e6) / 1e6,
    })
    geocoded++
  }

  console.log(`  ${geocoded} branches geocoded, ${missing} postcodes not found`)

  const parentCount = Object.keys(byParent).length
  console.log(`  ${parentCount} parent practices have at least one branch`)

  // 5. Write
  writeFileSync(OUT_PATH, JSON.stringify(byParent))
  console.log(`\nWritten → src/data/gpBranchLocations.json`)

  // Update metadata timestamp
  const today = new Date().toISOString().slice(0, 10)
  const meta  = existsSync(META_PATH) ? JSON.parse(readFileSync(META_PATH, 'utf8')) : {}
  meta.branchesGeneratedAt = today
  writeFileSync(META_PATH, JSON.stringify(meta))
  console.log(`Updated gpDataMeta.json — branchesGeneratedAt: ${today}`)
}

main().catch(e => {
  console.error('\nfetch-branch-data failed:', e.message)
  process.exit(1)
})
