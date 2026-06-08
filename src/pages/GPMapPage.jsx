import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  isLiveData,
  dataGeneratedAt,
  getPracticeByCode,
} from '../services/gpListSizeService'
import PracticeSelector from '../components/gp-list-size/PracticeSelector'
import MapView from '../components/gp-map/MapView'
import centroids from '../data/gpBoundaryCentroids.json'
import styles from './GPMapPage.module.css'
import contentStyles from './ContentPage.module.css'

export default function GPMapPage() {
  const [selectedPractices, setSelectedPractices] = useState([])
  const [searchParams] = useSearchParams()

  // Pre-populate from ?practices=A81001,A81002 URL param (cross-tool linking)
  useEffect(() => {
    const param = searchParams.get('practices')
    if (!param) return
    const practices = param
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)
      .map(code => getPracticeByCode(code))
      .filter(Boolean)
    if (practices.length > 0) setSelectedPractices(practices)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd(practice) {
    setSelectedPractices(prev => [...prev, practice])
  }
  function handleRemove(code) {
    setSelectedPractices(prev => prev.filter(p => p.code !== code))
  }

  const hasData = selectedPractices.length > 0
  const listSizesUrl = hasData
    ? `/tools/gp-list-sizes?practices=${selectedPractices.map(p => p.code).join(',')}`
    : '/tools/gp-list-sizes'

  const refreshedDate = dataGeneratedAt
    ? new Date(dataGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="page-enter">
      <section className={contentStyles.pageHero} data-no-print>
        <div className="container--narrow">
          <p className={contentStyles.eyebrow}>Tools</p>
          <h1 className={contentStyles.pageTitle}>GP Practice boundary map</h1>
          <p className={contentStyles.pageIntro}>
            Explore registered catchment boundaries for GP practices across England.
            Search for one or more practices to view their boundaries and locations side by side.
          </p>
        </div>
      </section>

      <section className={styles.toolSection}>
        <div className="container">

          {/* Data banner */}
          <div
            className={`${styles.dataBanner} ${isLiveData ? styles.dataBannerLive : styles.dataBannerSample}`}
            data-no-print
          >
            <span className={styles.dataBannerDot} />
            <span>
              <strong>Boundary data</strong> — GP practice catchment boundaries from SCW CSU.
              {isLiveData && refreshedDate && <> Patient register last refreshed {refreshedDate}.</>}
            </span>
          </div>

          {/* Controls */}
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
              <div className={styles.crossLink}>
                <Link to={listSizesUrl} className={styles.crossLinkBtn}>
                  📊 View list size data for these practices →
                </Link>
              </div>
            )}
          </div>

          {/* Empty state */}
          {!hasData && (
            <div className={styles.emptyState} data-no-print>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="24" cy="20" r="8" strokeLinecap="round" />
                  <path d="M24 44C24 44 8 32 8 20a16 16 0 0132 0c0 12-16 24-16 24z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="20" r="3" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>Search for a practice to get started</h2>
              <p className={styles.emptyDesc}>
                Use the search field above to find a GP practice. Its registered catchment boundary
                will appear on the map. Add up to 8 practices to compare them side by side.
              </p>
            </div>
          )}

          {/* Map */}
          {hasData && (
            <MapView
              selectedPractices={selectedPractices}
              centroids={centroids}
            />
          )}

        </div>
      </section>
    </div>
  )
}
