import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { haversineKm, pointInGeoJSON, formatDistKm } from '../../utils/geoUtils'
import branchLocations from '../../data/gpBranchLocations.json'
import styles from './LocationResultsPanel.module.css'

// ── Nearest site ──────────────────────────────────────────────────────────
// For a given practice and click location, return the closest physical site
// (either the admin-address centroid or any branch surgery).
// Returns { distKm, label } where label is null for admin address or the branch name.
function nearestSite(lat, lng, practiceCode, adminDistKm) {
  const branches = branchLocations[practiceCode] ?? []
  let best = { distKm: adminDistKm, label: null }
  for (const b of branches) {
    const d = haversineKm(lat, lng, b.lat, b.lng)
    if (d < best.distKm) {
      best = { distKm: d, label: b.name }
    }
  }
  return best
}

// ── ResultRow ─────────────────────────────────────────────────────────────
function ResultRow({ result, location, selectedPractices, onAdd }) {
  const { practice, distKm } = result
  const site      = nearestSite(location.lat, location.lng, practice.code, distKm)
  const isSelected = selectedPractices.some(p => p.code === practice.code)
  const icbLabel   = (practice.icb ?? '')
    .replace(/^NHS /, '')
    .replace(/ Integrated Care Board$/, '')
    .replace(/ ICB$/, '')

  return (
    <div className={styles.row}>
      <div className={styles.distCol}>
        <span className={styles.dist}>{formatDistKm(site.distKm)}</span>
        {site.label && (
          <span className={styles.siteLabel} title={`Nearest branch: ${site.label}`}>
            branch
          </span>
        )}
      </div>
      <div className={styles.infoCol}>
        <span className={styles.name}>{practice.name}</span>
        <span className={styles.meta}>
          {practice.code}
          {icbLabel ? ` · ${icbLabel}` : ''}
        </span>
        {site.label && (
          <span className={styles.branchName}>📍 {site.label}</span>
        )}
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
//   results           [{ code, distKm, practice }] — 50 nearest by admin address
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
        .finally(() => setCheckedCount(prev => prev + 1))
    })
  }, [locationKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = checkedCount >= results.length

  // Compute nearest-site distances for ALL 50 results (synchronous, in-memory)
  const nearestSiteDistByCode = useMemo(() => {
    const map = {}
    for (const { code, distKm, practice } of results) {
      map[code] = nearestSite(location.lat, location.lng, practice.code, distKm).distKm
    }
    return map
  }, [results, location])

  // Split: catchment matches (any from 50) vs nearest non-matching (top 10 by nearest-site dist)
  const { containing, nearest } = useMemo(() => {
    const containing = results
      .filter(r => containmentByCode[r.code] === true)
      .sort((a, b) => (nearestSiteDistByCode[a.code] ?? a.distKm) - (nearestSiteDistByCode[b.code] ?? b.distKm))

    const containingCodes = new Set(containing.map(r => r.code))
    const nearest = results
      .filter(r => !containingCodes.has(r.code))
      .sort((a, b) => (nearestSiteDistByCode[a.code] ?? a.distKm) - (nearestSiteDistByCode[b.code] ?? b.distKm))
      .slice(0, 10)

    return { containing, nearest }
  }, [results, containmentByCode, nearestSiteDistByCode])

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

      {/* ── Catchment matches ────────────────────────────────────── */}
      {containing.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDot} style={{ background: '#16a34a' }} />
            Catchment area covers this point
          </div>
          <div className={styles.rows}>
            {containing.map(result => (
              <div key={result.code} className={styles.rowContains}>
                <ResultRow
                  result={result}
                  location={location}
                  selectedPractices={selectedPractices}
                  onAdd={onAdd}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading indicator */}
      {!allChecked && containing.length === 0 && (
        <div className={styles.sectionHeader}>
          <span className={styles.loadingDot} />
          Checking which catchment covers this point…
        </div>
      )}

      {/* ── Nearest by site distance ──────────────────────────────── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionDot} style={{ background: '#6b7280' }} />
        {containing.length > 0
          ? 'Other nearby practices'
          : '10 nearest practices'}
      </div>
      <div className={styles.rows}>
        {nearest.map(result => (
          <ResultRow
            key={result.code}
            result={result}
            location={location}
            selectedPractices={selectedPractices}
            onAdd={onAdd}
          />
        ))}
        {nearest.length === 0 && allChecked && (
          <p className={styles.emptyNearby}>All nearby practices are shown above.</p>
        )}
      </div>

      {/* Footer note */}
      <p className={styles.footerNote}>
        Catchment check covers 50 nearest practices. Where a branch surgery is closer than the
        main address, the branch distance and location are shown. Distances are straight-line.
      </p>

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
