import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  isLiveData,
  dataGeneratedAt,
  getPracticeByCode,
} from '../services/gpListSizeService'
import { nearestByCentroid } from '../utils/geoUtils'
import PracticeSelector from '../components/gp-list-size/PracticeSelector'
import MapView from '../components/gp-map/MapView'
import LocationResultsPanel from '../components/gp-map/LocationResultsPanel'
import centroids from '../data/gpBoundaryCentroids.json'
import styles from './GPMapPage.module.css'
import contentStyles from './ContentPage.module.css'

export default function GPMapPage() {
  const [selectedPractices, setSelectedPractices] = useState([])
  const [clickedLocation, setClickedLocation]     = useState(null)
  const [clickResults, setClickResults]           = useState([])
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
    if (selectedPractices.length >= 8) return
    if (selectedPractices.some(p => p.code === practice.code)) return
    setSelectedPractices(prev => [...prev, practice])
  }
  function handleRemove(code) {
    setSelectedPractices(prev => prev.filter(p => p.code !== code))
  }

  // Click-to-search: compute nearest 10 synchronously from centroid index
  function handleMapClick({ lat, lng }) {
    setClickedLocation({ lat, lng })
    // Check the nearest 50 by centroid — all 50 boundaries are tested for containment,
    // but only the matching ones + top 10 by distance are displayed.
    const nearest = nearestByCentroid(lat, lng, centroids, 50)
    const results = nearest
      .map(({ code, distKm }) => {
        const practice = getPracticeByCode(code)
        return practice ? { code, distKm, practice } : null
      })
      .filter(Boolean)
    setClickResults(results)
  }

  function handleClearClick() {
    setClickedLocation(null)
    setClickResults([])
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
            Search by name to overlay boundaries, or click anywhere on the map to find
            the nearest practices and identify which catchment covers that location.
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
              <label className={styles.controlLabel}>Search by practice name, ODS code or ICB</label>
              <PracticeSelector
                selectedPractices={selectedPractices}
                onAdd={handleAdd}
                onRemove={handleRemove}
              />
              <p className={styles.hint}>
                Add up to 8 practices to overlay their boundaries on the map.
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

          {/* Map — always visible */}
          <MapView
            selectedPractices={selectedPractices}
            centroids={centroids}
            clickedLocation={clickedLocation}
            onMapClick={handleMapClick}
          />

          {/* Click-to-search hint (shown when no click yet) */}
          {!clickedLocation && (
            <p className={styles.mapHint}>
              💡 Click anywhere on the map to find the nearest GP practices and check which catchment area covers that point.
            </p>
          )}

          {/* Location search results */}
          {clickedLocation && clickResults.length > 0 && (
            <LocationResultsPanel
              location={clickedLocation}
              results={clickResults}
              selectedPractices={selectedPractices}
              onAdd={handleAdd}
              onClear={handleClearClick}
            />
          )}

        </div>
      </section>
    </div>
  )
}
