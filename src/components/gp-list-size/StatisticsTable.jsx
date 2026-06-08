import { CHART_COLORS } from '../../data/gpListSizeData'
import styles from './StatisticsTable.module.css'

function fmt(n) {
  return n?.toLocaleString('en-GB') ?? '–'
}

function PctCell({ value, adjusted }) {
  if (value == null) return <span className={styles.neutral}>–</span>
  const positive = value > 0
  const negative = value < 0
  return (
    <span className={styles.pctCell}>
      <span className={`${styles.pct} ${positive ? styles.positive : negative ? styles.negative : styles.neutral}`}>
        {positive ? '+' : ''}{value}%
      </span>
      {adjusted && (
        <span className={styles.adjustedBadge} title="Adjusted — one or more anomalous months excluded. See note below.">
          adj.
        </span>
      )}
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

/**
 * @param {Array}  stats           - output of computeStats()
 * @param {Array}  periods         - full periods array
 * @param {number} fromIndex
 * @param {number} toIndex
 * @param {boolean} isLiveData
 * @param {object} visibleColumns  - { icb, listStart, listEnd, changePct, englandPct, vsPp }
 */
export default function StatisticsTable({ stats, periods, fromIndex, toIndex, isLiveData, visibleColumns = {} }) {
  const rows = stats ?? []
  const startLabel = periods[fromIndex]?.label
  const endLabel   = periods[toIndex]?.label

  const col = key => visibleColumns[key] !== false  // default visible

  const englandChangePct = rows[0]?.englandChangePct ?? null
  const anyMerger = rows.some(r => r.hasMerger)

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Key statistics</h2>
      <p className={styles.subtitle}>
        Comparing {startLabel} to {endLabel}.{' '}
        <strong>vs. England</strong> shows how many percentage points above or below the change in England's
        total registered patient population
        {englandChangePct != null && <> ({englandChangePct > 0 ? '+' : ''}{englandChangePct}% over this period)</>} each practice sits.
      </p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thPractice}>Practice</th>
              {col('icb')        && <th className={styles.th}>ICB</th>}
              {col('listStart')  && <th className={styles.thNum}>List size ({startLabel})</th>}
              {col('listEnd')    && <th className={styles.thNum}>List size ({endLabel})</th>}
              {col('changePct')  && <th className={styles.thNum}>% change</th>}
              {col('englandPct') && <th className={styles.thNum}>England pop. % change</th>}
              {col('vsPp')       && <th className={styles.thNum}>vs. England</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ practice, start, end, changePct, englandChangePct: rowEngland, vsPp, hasMerger }, i) => (
              <tr key={practice.code} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.tdPractice}>
                  <span className={styles.colorDot} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span>
                    <span className={styles.practiceName}>{practice.name}</span>
                    <span className={styles.practiceCode}>{practice.code}</span>
                  </span>
                </td>
                {col('icb')        && <td className={styles.td}>{(practice.icb ?? '').replace('NHS ', '').replace(' ICB', '')}</td>}
                {col('listStart')  && <td className={styles.tdNum}>{fmt(start)}</td>}
                {col('listEnd')    && <td className={styles.tdNum}>{fmt(end)}</td>}
                {col('changePct')  && <td className={styles.tdNum}><PctCell value={changePct} adjusted={hasMerger} /></td>}
                {col('englandPct') && <td className={styles.tdNum}><PctCell value={rowEngland} /></td>}
                {col('vsPp')       && <td className={styles.tdNum}><VsPpCell value={vsPp} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {anyMerger && (
        <div className={styles.mergerNote}>
          <span className={styles.mergerNoteIcon}>⚠</span>
          <span>
            <strong>Adjusted figures</strong> — one or more practices show a month where the list-size change
            was more than 3× their recent monthly average, suggesting a merger or structural change.
            That month's change has been excluded from the % change calculation to show organic growth only.
            Amber markers on the chart indicate where these months occur.{' '}
            <a
              href="https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mergerLink}
            >
              About NHS practice registration data ↗
            </a>
          </span>
        </div>
      )}

      {!isLiveData && (
        <p className={styles.source}>
          Illustrative sample data — run <code>node scripts/fetch-nhs-data.mjs</code> to load live NHS England data.
        </p>
      )}
    </div>
  )
}
