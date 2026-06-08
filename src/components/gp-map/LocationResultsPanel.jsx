import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { haversineKm, pointInGeoJSON, formatDistKm } from '../../utils/geoUtils'
import branchLocations from '../../data/gpBranchLocations.json'
import practiceAddresses from '../../data/gpPracticeAddresses.json'
import styles from './LocationResultsPanel.module.css'

// ── Site distances ────────────────────────────────────────────────────────
// For a given practice and click location, return:
//   actualDistKm  — distance to the actual practice address (null if unknown)
//   nearestDistKm — nearest of actual address and all branches
//   branches      — all branches with distKm, sorted nearest-first
function sitesForPractice(lat, lng, practiceCode, fallbackDistKm) {
  const addr    = practiceAddresses[practiceCode]
  const actualDistKm = addr ? haversineKm(lat, lng, addr[0], addr[1]) : null

  const branches = (branchLocations[practiceCode] ?? []).map(b => ({
    ...b,
    distKm: haversineKm(lat, lng, b.lat, b.lng),
  })).sort((a, b) => a.distKm - b.distKm)

  const baseDist = actualDistKm ?? fallbackDistKm
  const nearestDistKm = branches.reduce((best, b) => Math.min(best, b.distKm), baseDist)

  return { actualDistKm, nearestDistKm, branches }
}

// ── ResultRow ─────────────────────────────────────────────────────────────
function ResultRow({ result, location, selectedPractices, onAdd }) {
  const { practice, distKm: fallbackDistKm } = result
  const { actualDistKm, nearestDistKm, branches } = useMemo(
    () => sitesForPractice(location.lat, location.lng, practice.code, fallbackDistKm),
    [location, practice.code, fallbackDistKm]
  )

  const isSelected = selectedPractices.some(p => p.code === practice.code)
  const icbLabel   = (practice.icb ?? '')
    .replace(/^NHS /, '')
    .replace(/ Integrated Care Board$/, '')
    .replace(/ ICB$/, '')

  // Distance shown in the lead column: nearest physical site
  const displayDist = actualDistKm != null ? actualDistKm : fallbackDistKm

  return (
    <div className={styles.row}>
      {/* Distance to nearest site */}
      <div className={styles.distCol}>
        <span className={styles.dist}>{formatDistKm(nearestDistKm)}</span>
      </div>

      {/* Practice info + site breakdown */}
      <div className={styles.infoCol}>
        <span className={styles.name}>{practice.name}</span>
        <span className={styles.meta}>
          {practice.code}
          {icbLabel ? ` · ${icbLabel}` : ''}
        </span>

        {/* Surgery sites */}
        <div className={styles.sites}>
          <span className={styles.site}>
            <span className={styles.siteDot} />
            Main surgery
            <span className={styles.siteDist}>
              {actualDistKm != null ? formatDistKm(actualDistKm) : formatDistKm(displayDist)}
            </span>
          </span>
          {branches.map(b => (
            <span key={b.code} className={styles.site}>
              <span className={styles.siteDot} />
              {b.name}
              <span className={styles.siteDist}>{formatDistKm(b.distKm)}</span>
            </span>
          ))}
        </div>
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
}

// ── LocationResultsPanel ──────────────────────────────────────────────────
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

  // Nearest-site distances for sorting (synchronous, in-memory)
  const nearestDistByCode = useMemo(() => {
    const map = {}
    for (const { code, distKm, practice } of results) {
      map[code] = sitesForPractice(location.lat, location.lng, practice.code, distKm).nearestDistKm
    }
    return map
  }, [results, location])

  // Split into: catchment matches (any from 50) | nearest 10 non-matching
  const { containing, nearest } = useMemo(() => {
    const containing = results
      .filter(r => containmentByCode[r.code] === true)
      .sort((a, b) => (nearestDistByCode[a.code] ?? a.distKm) - (nearestDistByCode[b.code] ?? b.distKm))

    const containingCodes = new Set(containing.map(r => r.code))
    const nearest = results
      .filter(r => !containingCodes.has(r.code))
      .sort((a, b) => (nearestDistByCode[a.code] ?? a.distKm) - (nearestDistByCode[b.code] ?? b.distKm))
      .slice(0, 10)

    return { containing, nearest }
  }, [results, containmentByCode, nearestDistByCode])

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

      {/* Catchment matches */}
      {containing.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionDot} style={{ background: '#16a34a' }} />
            Catchment area covers this point
          </div>
          <div className={styles.rows}>
            {containing.map(result => (
              <div key={result.code} className={styles.rowContains}>
                <ResultRow result={result} location={location} selectedPractices={selectedPractices} onAdd={onAdd} />
              </div>
            ))}
          </div>
        </>
      )}

      {!allChecked && containing.length === 0 && (
        <div className={styles.sectionHeader}>
          <span className={styles.loadingDot} />
          Checking which catchment covers this point…
        </div>
      )}

      {/* Nearest by site distance */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionDot} style={{ background: '#6b7280' }} />
        {containing.length > 0 ? 'Other nearby practices' : '10 nearest practices'}
      </div>
      <div className={styles.rows}>
        {nearest.map(result => (
          <ResultRow key={result.code} result={result} location={location} selectedPractices={selectedPractices} onAdd={onAdd} />
        ))}
        {nearest.length === 0 && allChecked && (
          <p className={styles.emptyNearby}>All nearby practices are shown above.</p>
        )}
      </div>

      <p className={styles.footerNote}>
        Distances are straight-line to each surgery site. Catchment check covers 50 nearest practices.
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
