import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { pointInGeoJSON, formatDistKm } from '../../utils/geoUtils'
import styles from './LocationResultsPanel.module.css'

// ── LocationResultsPanel ──────────────────────────────────────────────────
// Shown below the map after the user clicks a location.
// Props:
//   location      { lat, lng }
//   results       [{ code, distKm, practice }] — pre-sorted nearest-first
//   selectedPractices  already-mapped practices (for "On map" badge)
//   onAdd(practice)    add a practice to the map
//   onClear()          dismiss the panel and remove the pin
export default function LocationResultsPanel({
  location,
  results,
  selectedPractices,
  onAdd,
  onClear,
}) {
  // containmentByCode: { [code]: true | false }  — populated as GeoJSON loads
  const [containmentByCode, setContainmentByCode] = useState({})
  const [allChecked, setAllChecked] = useState(false)

  // Re-run whenever the clicked location or result set changes
  const locationKey = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`
  useEffect(() => {
    setContainmentByCode({})
    setAllChecked(false)
    let remaining = results.length

    results.forEach(({ code }) => {
      fetch(`/gp-boundaries/${code}.geojson`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          const contains = data ? pointInGeoJSON(location.lat, location.lng, data) : false
          setContainmentByCode(prev => ({ ...prev, [code]: contains }))
        })
        .catch(() => {
          setContainmentByCode(prev => ({ ...prev, [code]: false }))
        })
        .finally(() => {
          remaining -= 1
          if (remaining === 0) setAllChecked(true)
        })
    })
  }, [locationKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sort: containing practice first, then by distance
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const ca = containmentByCode[a.code] === true
      const cb = containmentByCode[b.code] === true
      if (ca && !cb) return -1
      if (cb && !ca) return 1
      return a.distKm - b.distKm
    })
  }, [results, containmentByCode])

  const selectedCodes = new Set(selectedPractices.map(p => p.code))
  const containingCount = Object.values(containmentByCode).filter(Boolean).length

  const listSizesUrl = selectedPractices.length > 0
    ? `/tools/gp-list-sizes?practices=${selectedPractices.map(p => p.code).join(',')}`
    : null

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.pinEmoji}>📍</span>
          <div>
            <p className={styles.title}>Nearest practices to selected location</p>
            <p className={styles.subtitle}>
              {allChecked
                ? containingCount === 1
                  ? '1 practice catchment covers this point'
                  : containingCount > 1
                  ? `${containingCount} practice catchments cover this point`
                  : 'No catchment boundary found for this point'
                : 'Checking catchment boundaries…'}
            </p>
          </div>
        </div>
        <button className={styles.clearBtn} onClick={onClear} aria-label="Clear location search">
          Clear ✕
        </button>
      </div>

      {/* Results rows */}
      <div className={styles.rows}>
        {sortedResults.map(({ code, distKm, practice }) => {
          const containment = containmentByCode[code]
          const isSelected  = selectedCodes.has(code)
          const icbLabel = (practice.icb ?? '')
            .replace(/^NHS /, '')
            .replace(/ Integrated Care Board$/, '')
            .replace(/ ICB$/, '')

          return (
            <div
              key={code}
              className={`${styles.row} ${containment === true ? styles.rowContains : ''}`}
            >
              {/* Distance + containment badge */}
              <div className={styles.distCol}>
                <span className={styles.dist}>{formatDistKm(distKm)}</span>
                {containment === true && (
                  <span className={styles.containsBadge}>✓ Catchment</span>
                )}
                {containment === undefined && (
                  <span className={styles.checking}>…</span>
                )}
              </div>

              {/* Practice name + meta */}
              <div className={styles.infoCol}>
                <span className={styles.name}>{practice.name}</span>
                <span className={styles.meta}>
                  {code}
                  {icbLabel ? ` · ${icbLabel}` : ''}
                </span>
              </div>

              {/* Action */}
              <div className={styles.actionCol}>
                {isSelected ? (
                  <span className={styles.onMap}>On map</span>
                ) : (
                  <button
                    className={styles.addBtn}
                    onClick={() => onAdd(practice)}
                    disabled={selectedPractices.length >= 8}
                    title={selectedPractices.length >= 8 ? 'Maximum 8 practices on map' : undefined}
                  >
                    + Add to map
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer cross-link */}
      {listSizesUrl && (
        <div className={styles.footer}>
          <Link to={listSizesUrl} className={styles.crossLinkBtn}>
            📊 View list size data for selected practices →
          </Link>
        </div>
      )}
    </div>
  )
}
