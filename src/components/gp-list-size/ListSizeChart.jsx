import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { CHART_COLORS } from '../../data/gpListSizeData'
import { buildChartData, detectMergerMonths } from '../../services/gpListSizeService'
import styles from './ListSizeChart.module.css'

function fmt(n) {
  return n?.toLocaleString('en-GB') ?? '–'
}

function CustomTooltip({ active, payload, label, mergerLabels }) {
  if (!active || !payload?.length) return null
  const isMergerMonth = mergerLabels?.has(label)
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>
        {label}
        {isMergerMonth && <span className={styles.tooltipMergerBadge}> ⚠ possible merger</span>}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className={styles.tooltipRow} style={{ color: entry.color }}>
          <span className={styles.tooltipName}>{entry.name}:</span>
          <span className={styles.tooltipValue}>{fmt(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function ListSizeChart({ selectedPractices, fromIndex, toIndex }) {
  const chartData = buildChartData(selectedPractices, fromIndex, toIndex)

  // Build a set of period labels where any selected practice has a merger,
  // so the tooltip can flag those months regardless of which line is hovered.
  const mergerLabels = new Set()
  for (const practice of selectedPractices) {
    const mergerPeriods = detectMergerMonths(practice)
    for (const periodIdx of mergerPeriods) {
      if (periodIdx > fromIndex && periodIdx <= toIndex) {
        // chart index = periodIdx - fromIndex → look up label from chartData
        const chartIdx = periodIdx - fromIndex
        if (chartData[chartIdx]) mergerLabels.add(chartData[chartIdx].period)
      }
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Registered list sizes over time</h2>
      </div>

      {mergerLabels.size > 0 && (
        <p className={styles.mergerNote}>
          <span className={styles.mergerDot} /> Amber markers indicate a possible merger or structural change.
          These months are excluded from the adjusted % change in the statistics table below.
        </p>
      )}

      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={<CustomTooltip mergerLabels={mergerLabels} />} />
            <Legend
              wrapperStyle={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)', paddingTop: '0.75rem' }}
            />

            {selectedPractices.map((practice, i) => {
              const mergerPeriods = detectMergerMonths(practice)
              const color = CHART_COLORS[i % CHART_COLORS.length]

              return (
                <Line
                  key={practice.code}
                  type="monotone"
                  dataKey={practice.code}
                  name={practice.name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={(dotProps) => {
                    const periodIndex = fromIndex + dotProps.index
                    if (!mergerPeriods.has(periodIndex)) return null
                    return (
                      <circle
                        key={`merger-${practice.code}-${dotProps.index}`}
                        cx={dotProps.cx}
                        cy={dotProps.cy}
                        r={6}
                        fill="#F59E0B"
                        stroke="white"
                        strokeWidth={1.5}
                      />
                    )
                  }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )
            })}

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
