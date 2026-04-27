import {
  practices as samplePractices,
  periods as samplePeriods,
  nationalAverages as sampleNatAvgs,
} from '../data/gpListSizeData'

// ─── Live-data loader ──────────────────────────────────────────────────────
// import.meta.glob is resolved at Vite build time.
// If nhsData.generated.json doesn't exist, the glob returns {} — no error.
const generatedModules = import.meta.glob('../data/nhsData.generated.json', { eager: true })
const generated = generatedModules['../data/nhsData.generated.json'] ?? null

export const isLiveData = generated?.isGenerated === true

const activePractices    = isLiveData ? generated.practices       : samplePractices
const activePeriods      = isLiveData ? generated.periods         : samplePeriods
const activeNatAvgs      = isLiveData ? generated.nationalAverages : sampleNatAvgs
export const dataGeneratedAt = isLiveData ? generated.generatedAt : null
export const dataSource      = isLiveData
  ? `NHS England GP Patient Register — ${generated.periods?.at(-1)?.label ?? ''}`
  : 'Illustrative sample data (run scripts/fetch-nhs-data.mjs for live NHS data)'

// ─── Public API ───────────────────────────────────────────────────────────

export function getAllPractices() {
  return activePractices
}

export function searchPractices(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()
  return activePractices
    .filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.icb ?? '').toLowerCase().includes(q),
    )
    .slice(0, 12)
}

export function getAvailablePeriods() {
  return activePeriods
}

export function getNationalAverages() {
  return activeNatAvgs
}

export function buildChartData(selectedPractices, fromIndex, toIndex) {
  const sliced = activePeriods.slice(fromIndex, toIndex + 1)

  return sliced.map((period, offset) => {
    const periodIndex = fromIndex + offset
    const entry = { period: period.label }
    for (const practice of selectedPractices) {
      entry[practice.code] = practice.listSizes[periodIndex] ?? null
    }
    return entry
  })
}

export function computeStats(selectedPractices, fromIndex, toIndex) {
  const startNatAvg = activeNatAvgs[fromIndex]
  const endNatAvg   = activeNatAvgs[toIndex]

  // National average % change over the selected period
  const natAvgChangePct =
    startNatAvg != null && endNatAvg != null && startNatAvg !== 0
      ? Number((((endNatAvg - startNatAvg) / startNatAvg) * 100).toFixed(1))
      : null

  return selectedPractices.map(practice => {
    const start = practice.listSizes[fromIndex]
    const end   = practice.listSizes[toIndex]

    if (start == null || end == null) {
      return { practice, start, end, changePct: null, natAvgChangePct, vsPp: null }
    }

    const changePct = Number((((end - start) / start) * 100).toFixed(1))

    // Difference in percentage points: how much faster/slower this practice grew vs England
    const vsPp = natAvgChangePct != null
      ? Number((changePct - natAvgChangePct).toFixed(1))
      : null

    return { practice, start, end, changePct, natAvgChangePct, vsPp }
  })
}
