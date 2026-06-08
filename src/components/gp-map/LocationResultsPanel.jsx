import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { pointInGeoJSON, formatDistKm } from '../../utils/geoUtils'
import styles from './LocationResultsPanel.module.css'

// ── ResultRow ─────────────────────────────────────────────────────────────
function ResultRow({ result, selectedPractices, onAdd }) {
  const { practice, distKm } = result
  const isSelected = selectedPractices.some(p => p.code === practice.code)
  const icbLabel = (practice.icb ?? '')
    .replace(/^NHS /, '')
    .replace(/ Integrated Care Board$/, '')
    .replace(/ ICB$/, '')

  return (
    <div className={styles.row}>
      <div className={styles.distCol}>
        <span className={styles.dist}>{formatDistKm(distKm)}</span>
      </div>
      <div className={styles.infoCol}>
        <span className={styles.name}>{practice.name}</span>
        <span className={styles.meta}>
          {practice.code}
          {icbLabel ? ` · ${icbLabel}` : ''}
        </span>
      </div>
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
}

// ── LocationResultsPanel ──────────────────────────────────────────────────
// Props:
//   location          { lat, lng }
//   results           [{ code, distKm, practice }] — all 50, sorted nearest-first
//   selectedPractices already-mapped practices
//   onAdd(practice)   add a practice to the map
//   onClear()         dismiss the panel and remove the pin
export default function LocationResultsPanel({
  location,
  results,
  selectedPractices,
  onAdd,
  onClear,
}) {
  // containmentByCode: { [code]: true | false } — populated async as GeoJSON loads
  const [containmentByCode, setContainmentByCode] = useState({})
  const [checkedCount,      setCheckedCount]      = useState(0)

  const locationKey = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`

  useEffect(() => {
    setContainmentByCode({})
    setCheckedCount(0)

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
          setCheckedCount(prev => prev + 1)
        })
    })
  }, [locationKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = checkedCount >= results.length

  // Split into two groups:
  // 1. Any practice (from the full 50) whose catchment contains the point
  // 2. The top 10 nearest that don't contain the point
  const { containing, nearest } = useMemo(() => {
    const containing = results
      .filter(r => containmentByCode[r.code] === true)
      .sort((a, b) => a.distKm - b.distKm)

    const containingCodes = new Set(containing.map(r => r.code))
    const nearest = results
      .filter(r => !containingCodes.has(r.code))
      .slice(0, 10)

    return { containing, nearest }
  }, [results, containmentByCode])

  const containingCount = containing.length

  const subtitleText = allChecked
    ? containingCount === 0
      ? 'No registered catchment covers this point'
      : containingCount === 1
      ? '1 practice catchment covers this point'
      : `${containingCount} practice catchments cover this point`
    : `Checking catchment boundaries… (${checkedCount} of ${results.length})`

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
            <p className={styles.title}>Find practices near this location</p>
            <p className={styles.subtitle}>{subtitleText}</p>
          </div>
        </div>
        <button className={styles.clearBtn} onClick={onClear} aria-label="Clear location search">
          Clear ✕
        </button>
      </div>

      {/* ── Section 1: catchment matches ──────────────────────────── */}
      {containing.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDot} style={{ background: '#16a34a' }} />
            Catchment area covers this point
          </div>
          <div className={styles.rows}>
            {containing.map(result => (
              <div key={result.code} className={`${styles.rowContains}`}>
                <ResultRow
                  result={result}
                  selectedPractices={selectedPractices}
                  onAdd={onAdd}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading state for catchment section (before first results) */}
      {!allChecked && containing.length === 0 && (
        <div className={styles.sectionHeader}>
          <span className={styles.loadingDot} />
          Checking which catchment covers this point…
        </div>
      )}

      {/* ── Section 2: nearest by address ─────────────────────────── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionDot} style={{ background: '#6b7280' }} />
        {containing.length > 0
          ? 'Other nearby practices (by registered address)'
          : '10 nearest practices by registered address'}
      </div>
      <div className={styles.rows}>
        {nearest.map(result => (
          <ResultRow
            key={result.code}
            result={result}
            selectedPractices={selectedPractices}
            onAdd={onAdd}
          />
        ))}
        {nearest.length === 0 && allChecked && (
          <p className={styles.emptyNearby}>
            All nearby practices are already shown above.
          </p>
        )}
      </div>

      {/* Footer note */}
      <p className={styles.footerNote}>
        Catchment check covers the 50 nearest practices by registered address.
        Distances shown are straight-line from the administrative address, not nearest surgery site.
      </p>

      {/* Cross-link */}
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
