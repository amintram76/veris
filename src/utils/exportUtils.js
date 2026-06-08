/**
 * exportUtils.js
 *
 * Utilities for exporting GP list size data.
 */

/**
 * Generates a CSV file from computeStats results and triggers a browser download.
 *
 * @param {Array}  stats      - output of computeStats()
 * @param {Array}  periods    - full periods array from the service
 * @param {number} fromIndex  - selected start period index
 * @param {number} toIndex    - selected end period index
 */
export function downloadCSV(stats, periods, fromIndex, toIndex) {
  const startLabel = periods[fromIndex]?.label ?? ''
  const endLabel   = periods[toIndex]?.label   ?? ''

  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`

  const headers = [
    'Practice name',
    'Practice code',
    'ICB',
    `List size (${startLabel})`,
    `List size (${endLabel})`,
    '% change (organic growth)',
    'England population % change',
    'vs. England (percentage points)',
    'Merger / structural adjustment applied',
  ]

  const rows = stats.map(({ practice, start, end, changePct, englandChangePct, vsPp, hasMerger }) => [
    practice.name,
    practice.code,
    practice.icb ?? '',
    start ?? '',
    end ?? '',
    changePct      != null ? changePct      : '',
    englandChangePct != null ? englandChangePct : '',
    vsPp           != null ? vsPp           : '',
    hasMerger ? 'Yes' : 'No',
  ])

  // BOM (﻿) ensures Excel opens UTF-8 CSV correctly
  const csv = '﻿' + [headers, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `gp-list-size-${startLabel}-to-${endLabel}.csv`
    .replace(/\s+/g, '-')
    .toLowerCase()
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
