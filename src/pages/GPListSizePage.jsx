import { useState } from 'react'
import {
  getAvailablePeriods,
  isLiveData,
  dataSource,
  dataGeneratedAt,
} from '../services/gpListSizeService'
import PracticeSelector from '../components/gp-list-size/PracticeSelector'
import TimeframeSelector from '../components/gp-list-size/TimeframeSelector'
import ListSizeChart from '../components/gp-list-size/ListSizeChart'
import StatisticsTable from '../components/gp-list-size/StatisticsTable'
import styles from './GPListSizePage.module.css'
import contentStyles from './ContentPage.module.css'

const periods = getAvailablePeriods()

export default function GPListSizePage() {
  const [selectedPractices, setSelectedPractices] = useState([])
  const [fromIndex, setFromIndex] = useState(0)
  const [toIndex, setToIndex] = useState(periods.length - 1)
  function handleAdd(practice) {
    setSelectedPractices(prev => [...prev, practice])
  }

  function handleRemove(code) {
    setSelectedPractices(prev => prev.filter(p => p.code !== code))
  }

  const hasData = selectedPractices.length > 0

  const refreshedDate = dataGeneratedAt
    ? new Date(dataGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="page-enter">
      <section className={contentStyles.pageHero}>
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
          <div className={`${styles.dataBanner} ${isLiveData ? styles.dataBannerLive : styles.dataBannerSample}`}>
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

          <div className={styles.controls}>
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
            <div className={styles.emptyState}>
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
            <div className={styles.results}>
              <ListSizeChart
                selectedPractices={selectedPractices}
                fromIndex={fromIndex}
                toIndex={toIndex}
              />
              <StatisticsTable
                selectedPractices={selectedPractices}
                fromIndex={fromIndex}
                toIndex={toIndex}
                periods={periods}
                isLiveData={isLiveData}
              />
            </div>
          )}

        </div>
      </section>
    </div>
  )
}
