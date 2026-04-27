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
import { buildChartData } from '../../services/gpListSizeService'
import styles from './ListSizeChart.module.css'

function fmt(n) {
  return n?.toLocaleString('en-GB') ?? '–'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Registered list sizes over time</h2>
      </div>

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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)', paddingTop: '0.75rem' }}
            />

            {selectedPractices.map((practice, i) => (
              <Line
                key={practice.code}
                type="monotone"
                dataKey={practice.code}
                name={practice.name}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
