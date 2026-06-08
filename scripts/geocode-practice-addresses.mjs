/**
 * geocode-practice-addresses.mjs
 *
 * Reads all practice postcodes from nhsData.generated.json and geocodes
 * them via postcodes.io to get the actual surgery building location.
 *
 * Writes src/data/gpPracticeAddresses.json: { [ODS_CODE]: [lat, lng] }
 *
 * This replaces the use of polygon vertex-average centroids for:
 *   - the centroid CircleMarker on the map (which was appearing in the
 *     wrong location for practices with large rural catchments)
 *   - the baseline distance when checking whether a branch is closer
 *
 * Run: node scripts/geocode-practice-addresses.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const DATA_PATH = resolve(ROOT, 'src/data/nhsData.generated.json')
const OUT_PATH  = resolve(ROOT, 'src/data/gpPracticeAddresses.json')

function normalisePostcode(raw) {
  return (raw ?? '').replace(/\s+/g, '').toUpperCase()
}

function formatPostcode(norm) {
  // postcodes.io expects a space before the inward code (last 3 chars)
  return norm.slice(0, -3).trim() + ' ' + norm.slice(-3)
}

async function geocodeBatch(normalisedCodes) {
  const formatted = normalisedCodes.map(formatPostcode)
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
      map[key] = [
        Math.round(item.result.latitude  * 1e6) / 1e6,
        Math.round(item.result.longitude * 1e6) / 1e6,
      ]
    }
  }
  return map
}

async function main() {
  console.log('Reading practice data…')
  const { practices } = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
  console.log(`  ${practices.length} practices`)

  // Build deduped postcode → [code] map so we geocode each postcode once
  const postcodeToCode = {}
  for (const p of practices) {
    const pc = normalisePostcode(p.postcode)
    if (!pc) continue
    if (!postcodeToCode[pc]) postcodeToCode[pc] = []
    postcodeToCode[pc].push(p.code)
  }
  const uniquePostcodes = Object.keys(postcodeToCode)
  console.log(`  ${uniquePostcodes.length} unique postcodes to geocode`)

  // Geocode in batches of 100
  const BATCH     = 100
  const totalBatches = Math.ceil(uniquePostcodes.length / BATCH)
  const coordsByPostcode = {}

  console.log(`  Geocoding in ${totalBatches} batches via postcodes.io…`)
  for (let i = 0; i < uniquePostcodes.length; i += BATCH) {
    const batch    = uniquePostcodes.slice(i, i + BATCH)
    const batchNum = Math.floor(i / BATCH) + 1
    try {
      const result = await geocodeBatch(batch)
      Object.assign(coordsByPostcode, result)
      process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} (${Object.keys(coordsByPostcode).length} geocoded)`)
    } catch (e) {
      console.warn(`\n  Batch ${batchNum} failed: ${e.message}`)
    }
    if (i + BATCH < uniquePostcodes.length) {
      await new Promise(r => setTimeout(r, 120)) // stay well under rate limit
    }
  }
  console.log()

  // Map ODS code → [lat, lng]
  const addresses = {}
  let found = 0, missing = 0

  for (const [pc, codes] of Object.entries(postcodeToCode)) {
    const coords = coordsByPostcode[pc]
    if (coords) {
      for (const code of codes) { addresses[code] = coords; found++ }
    } else {
      missing++
    }
  }

  console.log(`  ${found} practices geocoded, ${missing} postcodes not found`)
  writeFileSync(OUT_PATH, JSON.stringify(addresses))
  console.log(`\nWritten → src/data/gpPracticeAddresses.json`)
}

main().catch(e => {
  console.error('\ngeocoding failed:', e.message)
  process.exit(1)
})
