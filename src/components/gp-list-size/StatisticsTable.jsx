import { computeStats } from '../../services/gpListSizeService'
import { CHART_COLORS } from '../../data/gpListSizeData'
import styles from './StatisticsTable.module.css'

function fmt(n) {
  return n?.toLocaleString('en-GB') ?? '–'
}

function PctCell({ value }) {
  if (value == null) return <span className={styles.neutral}>–</span>
  const positive = value > 0
  const negative = value < 0
  return (
    <span className={`${styles.pct} ${positive ? styles.positive : negative ? styles.negative : styles.neutral}`}>
      {positive ? '+' : ''}{value}%
    </span>
  )
}

function VsPpCell({ value }) {
  if (value == null) return <span className={styles.neutral}>–</span>
  const positive = value > 0
  const negative = value < 0
  return (
    <span className={`${styles.pct} ${positive ? styles.positive : negative ? styles.negative : styles.neutral}`}>
      {positive ? '+' : ''}{value}pp
    </span>
  )
}

export default function StatisticsTable({ selectedPractices, fromIndex, toIndex, periods, isLiveData }) {
  const rows = computeStats(selectedPractices, fromIndex, toIndex)
  const startLabel = periods[fromIndex]?.label
  const endLabel   = periods[toIndex]?.label

  // natAvgChangePct is the same for every row — pull from the first
  const natAvgChangePct = rows[0]?.natAvgChangePct ?? null

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Key statistics</h2>
      <p className={styles.subtitle}>
        Comparing {startLabel} to {endLabel}.{' '}
        <strong>vs. England</strong> shows how many percentage points above or below the England average growth rate
        {natAvgChangePct != null && <> ({natAvgChangePct > 0 ? '+' : ''}{natAvgChangePct}% over this period)</>} each practice sits.
      </p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thPractice}>Practice</th>
              <th className={styles.th}>ICB</th>
              <th className={styles.thNum}>List size ({startLabel})</th>
              <th className={styles.thNum}>List size ({endLabel})</th>
              <th className={styles.thNum}>% change</th>
              <th className={styles.thNum}>England % change</th>
              <th className={styles.thNum}>vs. England</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ practice, start, end, changePct, natAvgChangePct: rowNat, vsPp }, i) => (
              <tr key={practice.code} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.tdPractice}>
                  <span className={styles.colorDot} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span>
                    <span className={styles.practiceName}>{practice.name}</span>
                    <span className={styles.practiceCode}>{practice.code}</span>
                  </span>
                </td>
                <td className={styles.td}>{(practice.icb ?? '').replace('NHS ', '').replace(' ICB', '')}</td>
                <td className={styles.tdNum}>{fmt(start)}</td>
                <td className={styles.tdNum}>{fmt(end)}</td>
                <td className={styles.tdNum}><PctCell value={changePct} /></td>
                <td className={styles.tdNum}><PctCell value={rowNat} /></td>
                <td className={styles.tdNum}><VsPpCell value={vsPp} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLiveData && (
        <p className={styles.source}>
          Illustrative sample data — run <code>node scripts/fetch-nhs-data.mjs</code> or deploy to Netlify to load live NHS England data.
        </p>
      )}
    </div>
  )
}
