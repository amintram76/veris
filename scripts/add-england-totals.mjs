/**
 * One-off migration: adds englandTotals to nhsData.generated.json
 * by summing stored practice listSizes for each period.
 * Safe to delete after running.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const path = resolve(__dirname, '../src/data/nhsData.generated.json')

const data = JSON.parse(readFileSync(path, 'utf8'))

if (data.englandTotals) {
  console.log('englandTotals already present — nothing to do.')
  process.exit(0)
}

const numPeriods = data.periods.length
const totals = new Array(numPeriods).fill(0)
const counts = new Array(numPeriods).fill(0)

for (const practice of data.practices) {
  for (let i = 0; i < numPeriods; i++) {
    const v = practice.listSizes[i]
    if (v != null) {
      totals[i] += v
      counts[i]++
    }
  }
}

data.englandTotals = totals.map((t, i) => counts[i] > 0 ? t : null)

writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
console.log(`Done. Added englandTotals for ${numPeriods} periods.`)
console.log(`Sample: ${data.periods[0].label} = ${data.englandTotals[0]?.toLocaleString()} registered patients`)
console.log(`        ${data.periods.at(-1).label} = ${data.englandTotals.at(-1)?.toLocaleString()} registered patients`)
