import {
  practices as samplePractices,
  periods as samplePeriods,
  nationalAverages as sampleNatAvgs,
  englandTotals as sampleEnglandTotals,
} from '../data/gpListSizeData'

// ─── Live-data loader ──────────────────────────────────────────────────────
// import.meta.glob is resolved at Vite build time.
// If nhsData.generated.json doesn't exist, the glob returns {} — no error.
const generatedModules = import.meta.glob('../data/nhsData.generated.json', { eager: true })
const generated = generatedModules['../data/nhsData.generated.json'] ?? null

export const isLiveData = generated?.isGenerated === true

const activePractices      = isLiveData ? generated.practices        : samplePractices
const activePeriods        = isLiveData ? generated.periods          : samplePeriods
const activeNatAvgs        = isLiveData ? generated.nationalAverages : sampleNatAvgs
const activeEnglandTotals  = isLiveData ? generated.englandTotals    : sampleEnglandTotals

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

// ─── Merger / anomaly detection ───────────────────────────────────────────
/**
 * Returns a Set of period indices where the monthly list-size change for this
 * practice is likely due to a merger/split rather than organic growth.
 *
 * A month is flagged when its absolute change exceeds BOTH:
 *   • 3× the average absolute monthly change over the preceding 6 months, AND
 *   • a minimum floor of 500 patients (avoids false-positives on tiny practices)
 *
 * The returned indices are global (relative to the full periods array), not
 * relative to any selected timeframe.
 */
export function detectMergerMonths(practice) {
  const sizes = practice.listSizes
  const anomalous = new Set()

  for (let i = 1; i < sizes.length; i++) {
    const prev = sizes[i - 1]
    const curr = sizes[i]
    if (prev == null || curr == null) continue

    const change = Math.abs(curr - prev)

    // Collect absolute monthly changes in the preceding 6 months
    const window = []
    for (let j = Math.max(1, i - 6); j < i; j++) {
      const p = sizes[j - 1]
      const c = sizes[j]
      if (p != null && c != null) window.push(Math.abs(c - p))
    }

    if (window.length === 0) continue

    const avgRecent = window.reduce((s, v) => s + v, 0) / window.length
    const threshold = Math.max(avgRecent * 3, 500)

    if (change > threshold) anomalous.add(i)
  }

  return anomalous
}

// ─── Statistics ───────────────────────────────────────────────────────────
/**
 * Computes per-practice statistics for the selected timeframe.
 *
 * England comparison: uses the change in total England registered population
 * (sum of all practices) rather than average practice size, so that practices
 * can see whether they are growing at a faster or slower rate than the overall
 * patient population — not just the average practice.
 *
 * Merger handling: monthly changes identified as anomalous by detectMergerMonths
 * are excluded from the compounded % change so that merger jumps don't inflate
 * the organic growth figure. The raw list sizes are unaffected (chart still
 * shows the actual spike). hasMerger flags when any adjustment was made.
 */
export function computeStats(selectedPractices, fromIndex, toIndex) {
  // England total population % change over the selected period
  const startEngland = activeEnglandTotals?.[fromIndex]
  const endEngland   = activeEnglandTotals?.[toIndex]
  const englandChangePct =
    startEngland != null && endEngland != null && startEngland !== 0
      ? Number((((endEngland - startEngland) / startEngland) * 100).toFixed(1))
      : null

  return selectedPractices.map(practice => {
    const start = practice.listSizes[fromIndex]
    const end   = practice.listSizes[toIndex]

    // Detect merger months across the full dataset, then filter to selected range
    const allMergerMonths = detectMergerMonths(practice)
    const mergerMonthsInRange = new Set(
      [...allMergerMonths].filter(i => i > fromIndex && i <= toIndex)
    )
    const hasMerger = mergerMonthsInRange.size > 0

    if (start == null || end == null) {
      return { practice, start, end, changePct: null, englandChangePct, vsPp: null, hasMerger, mergerMonthsInRange }
    }

    // Compound the monthly growth rates, skipping anomalous (merger) months.
    // This gives the organic growth rate stripped of one-off structural jumps.
    let compounded = 1.0
    let anyMonth = false
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      if (mergerMonthsInRange.has(i)) continue
      const p = practice.listSizes[i - 1]
      const c = practice.listSizes[i]
      if (p == null || c == null || p === 0) continue
      compounded *= c / p
      anyMonth = true
    }

    const changePct = anyMonth ? Number(((compounded - 1) * 100).toFixed(1)) : null

    const vsPp =
      englandChangePct != null && changePct != null
        ? Number((changePct - englandChangePct).toFixed(1))
        : null

    return { practice, start, end, changePct, englandChangePct, vsPp, hasMerger, mergerMonthsInRange }
  })
}
