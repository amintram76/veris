/**
 * process-boundaries.mjs
 *
 * One-off (re-runnable) script that processes the 6,200+ individual GP practice
 * boundary GeoJSON files from SCW CSU and prepares them for the Veris map tool.
 *
 * What it does:
 *   1. Reads each [ODS_CODE].geojson from SOURCE_DIR
 *   2. Computes a centroid from the polygon outer ring
 *   3. Minifies the GeoJSON (removes whitespace, rounds coords to 6 dp, strips
 *      rendering-hint properties that Leaflet doesn't need)
 *   4. Writes minified files to public/gp-boundaries/
 *   5. Writes src/data/gpBoundaryCentroids.json — a compact lookup of
 *      { [ODSCode]: [lat, lng] } used to place markers before boundaries load
 *
 * Run once after downloading new boundary data:
 *   node scripts/process-boundaries.mjs
 *
 * Then commit both public/gp-boundaries/ and src/data/gpBoundaryCentroids.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, join, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Configuration ─────────────────────────────────────────────────────────
const SOURCE_DIR   = 'C:\\Users\\amint\\Documents\\NHMP\\GP catchment data'
const DEST_DIR     = resolve(ROOT, 'public/gp-boundaries')
const CENTROID_OUT = resolve(ROOT, 'src/data/gpBoundaryCentroids.json')
const COORD_DP     = 6  // decimal places — ~0.11 m accuracy (down from 10 dp)

// ── Helpers ───────────────────────────────────────────────────────────────

function round(n) {
  const factor = 10 ** COORD_DP
  return Math.round(n * factor) / factor
}

function roundCoords(coords) {
  if (typeof coords[0] === 'number') return [round(coords[0]), round(coords[1])]
  return coords.map(roundCoords)
}

/**
 * Returns [lat, lng] centroid for a GeoJSON geometry.
 * Uses the outer ring of the largest polygon (handles both Polygon & MultiPolygon).
 * Simple vertex-average — accurate enough for map placement.
 * GeoJSON coordinates are [lng, lat]; Leaflet expects [lat, lng].
 */
function computeCentroid(geometry) {
  let ring

  if (geometry.type === 'Polygon') {
    ring = geometry.coordinates[0]
  } else if (geometry.type === 'MultiPolygon') {
    ring = geometry.coordinates
      .map(poly => poly[0])
      .reduce((best, r) => (r.length > best.length ? r : best))
  } else {
    return null
  }

  let sumLng = 0, sumLat = 0
  for (const [lng, lat] of ring) { sumLng += lng; sumLat += lat }
  const n = ring.length
  return [round(sumLat / n), round(sumLng / n)]  // [lat, lng]
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log('\n🗺   Veris — GP boundary data processor')
console.log('━'.repeat(50))
console.log(`  Source: ${SOURCE_DIR}`)
console.log(`  Dest:   ${DEST_DIR}\n`)

if (!existsSync(SOURCE_DIR)) {
  console.error(`✗  Source directory not found: ${SOURCE_DIR}`)
  process.exit(1)
}

if (!existsSync(DEST_DIR)) mkdirSync(DEST_DIR, { recursive: true })

const files = readdirSync(SOURCE_DIR).filter(f => f.toLowerCase().endsWith('.geojson'))
console.log(`  Found ${files.length} GeoJSON files to process...\n`)

const centroids = {}
let success = 0, skipped = 0, failed = 0
let totalOriginal = 0, totalMinified = 0

for (const file of files) {
  const code = basename(file, '.geojson').toUpperCase()
  const srcPath = join(SOURCE_DIR, file)

  try {
    const raw = readFileSync(srcPath, 'utf8')
    totalOriginal += raw.length

    const geojson = JSON.parse(raw)
    const feature = geojson.features?.[0]

    if (!feature?.geometry) {
      console.warn(`  ⚠  ${code}: no geometry — skipped`)
      skipped++
      continue
    }

    // Centroid
    const centroid = computeCentroid(feature.geometry)
    if (centroid) centroids[code] = centroid

    // Minified output — keep only essential properties
    const minified = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: feature.geometry.type,
          coordinates: roundCoords(feature.geometry.coordinates),
        },
        properties: {
          code: feature.properties?.ODSCode ?? code,
          name: feature.properties?.Name    ?? '',
          icb:  feature.properties?.ICBCode ?? '',
        },
      }],
    }

    const out = JSON.stringify(minified)
    totalMinified += out.length
    writeFileSync(join(DEST_DIR, `${code}.geojson`), out)
    success++

    if (success % 500 === 0) process.stdout.write(`  ✓  ${success} / ${files.length}\r`)
  } catch (err) {
    console.warn(`  ✗  ${code}: ${err.message}`)
    failed++
  }
}

// Write centroid index
writeFileSync(CENTROID_OUT, JSON.stringify(centroids))

const pct = v => Math.round(v / totalOriginal * 100)
console.log(`\n✅  Done`)
console.log(`   Processed: ${success.toLocaleString()} files`)
if (skipped) console.log(`   Skipped:   ${skipped} (no geometry)`)
if (failed)  console.log(`   Failed:    ${failed}`)
console.log(`   Size:      ${(totalOriginal / 1024 / 1024).toFixed(1)} MB → ${(totalMinified / 1024 / 1024).toFixed(1)} MB (${pct(totalMinified)}% of original)`)
console.log(`   Centroids: ${Object.keys(centroids).length.toLocaleString()} written to src/data/gpBoundaryCentroids.json\n`)
console.log('  Next steps:')
console.log('    git add public/gp-boundaries src/data/gpBoundaryCentroids.json')
console.log('    git commit -m "Add GP practice boundary data"\n')
