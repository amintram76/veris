import { useState, useEffect, useMemo } from 'react'
import {
  getAvailablePeriods,
  isLiveData,
  dataSource,
  dataGeneratedAt,
  computeStats,
} from '../services/gpListSizeService'
import PracticeSelector from '../components/gp-list-size/PracticeSelector'
import TimeframeSelector from '../components/gp-list-size/TimeframeSelector'
import ListSizeChart from '../components/gp-list-size/ListSizeChart'
import StatisticsTable from '../components/gp-list-size/StatisticsTable'
import ExportBar from '../components/gp-list-size/ExportBar'
import styles from './GPListSizePage.module.css'
import contentStyles from './ContentPage.module.css'

const periods = getAvailablePeriods()

const ALL_COLUMNS = {
  icb: true,
  listStart: true,
  listEnd: true,
  changePct: true,
  englandPct: true,
  vsPp: true,
}

export default function GPListSizePage() {
  const [selectedPractices, setSelectedPractices] = useState([])
  const [fromIndex, setFromIndex]   = useState(0)
  const [toIndex, setToIndex]       = useState(periods.length - 1)
  const [visibleColumns, setVisibleColumns]       = useState(ALL_COLUMNS)
  const [printIncludeChart, setPrintIncludeChart] = useState(true)
  const [shouldPrint, setShouldPrint]             = useState(false)

  function handleAdd(practice) {
    setSelectedPractices(prev => [...prev, practice])
  }
  function handleRemove(code) {
    setSelectedPractices(prev => prev.filter(p => p.code !== code))
  }

  const hasData = selectedPractices.length > 0

  // Lift stats computation so ExportBar and StatisticsTable share one result
  const stats = useMemo(
    () => hasData ? computeStats(selectedPractices, fromIndex, toIndex) : [],
    [selectedPractices, fromIndex, toIndex, hasData]
  )

  // Trigger window.print() after React re-renders with current options
  useEffect(() => {
    if (!shouldPrint) return
    const id = setTimeout(() => {
      window.print()
      setShouldPrint(false)
    }, 80)
    return () => clearTimeout(id)
  }, [shouldPrint])

  const refreshedDate = dataGeneratedAt
    ? new Date(dataGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="page-enter">
      {/* ── Print-only header ─────────────────────────────────── */}
      <div className={styles.printHeader} data-print-only>
        <h1 className={styles.printTitle}>GP Practice List Size Comparison</h1>
        {hasData && (
          <p className={styles.printMeta}>
            {periods[fromIndex]?.label} to {periods[toIndex]?.label}
            {' · '}{selectedPractices.length} practice{selectedPractices.length !== 1 ? 's' : ''}
          </p>
        )}
        <p className={styles.printSource}>
          Data: NHS England GP Patient Register
          {refreshedDate && ` · Last refreshed ${refreshedDate}`}
          {' · veris.org.uk'}
        </p>
      </div>

      {/* ── Screen: page hero ─────────────────────────────────── */}
      <section className={contentStyles.pageHero} data-no-print>
        <div className="container--narrow">
          <p className={contentStyles.eyebrow}>Tools</p>
          <h1 className={contentStyles.pageTitle}>GP Practice list size comparison</h1>
          <p className={contentStyles.pageIntro}>
            Compare registered patient list sizes across GP practices over time. Add your own practice and
            any others you wish to benchmark against, adjust the timeframe, and explore how list sizes
            have changed relative to the England national average.
          </p>
        </div>
      </section>

      <section className={styles.toolSection}>
        <div className="container">

          {/* Data provenance banner */}
          <div
            className={`${styles.dataBanner} ${isLiveData ? styles.dataBannerLive : styles.dataBannerSample}`}
            data-no-print
          >
            {isLiveData ? (
              <>
                <span className={styles.dataBannerDot} />
                <span>
                  <strong>Live NHS data</strong> — sourced from the NHS England GP Patient Register.
                  {refreshedDate && <> Last refreshed {refreshedDate}.</>}
                  {' '}<a href="https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice" target="_blank" rel="noopener noreferrer">View source ↗</a>
                </span>
              </>
            ) : (
              <>
                <span className={styles.dataBannerDot} />
                <span>
                  <strong>Sample data</strong> — illustrative data modelled on the NHS England GP Patient Register format.
                  {' '}<a href="https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice" target="_blank" rel="noopener noreferrer">View NHS source ↗</a>
                </span>
              </>
            )}
          </div>

          {/* Practice selector + timeframe */}
          <div className={styles.controls} data-no-print>
            <div className={styles.controlBlock}>
              <label className={styles.controlLabel}>Practices</label>
              <PracticeSelector
                selectedPractices={selectedPractices}
                onAdd={handleAdd}
                onRemove={handleRemove}
              />
              <p className={styles.hint}>
                Search by practice name, ODS code, or ICB. Add up to 8 practices to compare.
              </p>
            </div>

            {hasData && (
              <div className={styles.controlBlock}>
                <label className={styles.controlLabel}>Timeframe</label>
                <TimeframeSelector
                  periods={periods}
                  fromIndex={fromIndex}
                  toIndex={toIndex}
                  onFromChange={setFromIndex}
                  onToChange={setToIndex}
                />
              </div>
            )}
          </div>

          {!hasData && (
            <div className={styles.emptyState} data-no-print>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M24 44C35.046 44 44 35.046 44 24S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 28s1.5-4 8-4 8 4 8 4M19 19h.02M29 19h.02" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>Search for a practice to get started</h2>
              <p className={styles.emptyDesc}>
                Use the search field above to find your own GP practice, then add others to compare.
                Data covers monthly snapshots from April 2019 to the present.
              </p>
            </div>
          )}

          {hasData && (
            <>
              {/* Export / print bar */}
              <ExportBar
                stats={stats}
                periods={periods}
                fromIndex={fromIndex}
                toIndex={toIndex}
                visibleColumns={visibleColumns}
                onColumnsChange={setVisibleColumns}
                printIncludeChart={printIncludeChart}
                onPrintIncludeChartChange={setPrintIncludeChart}
                onPrint={() => setShouldPrint(true)}
              />

              <div className={styles.results}>
                {/* Chart — hidden in print if user unchecked "include chart" */}
                <div className={printIncludeChart ? '' : styles.hideInPrint}>
                  <ListSizeChart
                    selectedPractices={selectedPractices}
                    fromIndex={fromIndex}
                    toIndex={toIndex}
                  />
                </div>

                <StatisticsTable
                  stats={stats}
                  periods={periods}
                  fromIndex={fromIndex}
                  toIndex={toIndex}
                  isLiveData={isLiveData}
                  visibleColumns={visibleColumns}
                />
              </div>
            </>
          )}

        </div>
      </section>
    </div>
  )
}
