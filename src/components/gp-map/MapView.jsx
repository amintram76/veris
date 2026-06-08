import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { CHART_COLORS } from '../../data/gpListSizeData'
import styles from './MapView.module.css'

const ENGLAND_CENTER = [52.8, -1.6]
const ENGLAND_ZOOM   = 6

// ── BoundsController ──────────────────────────────────────────────────────
// Fits the map to the union of all loaded GeoJSON bounds, falling back to
// centroids for any practice whose boundary hasn't loaded yet.
function BoundsController({ practices, boundsByCode, centroids }) {
  const map = useMap()
  const practicesKey = practices.map(p => p.code).join(',')
  const loadedKey    = Object.keys(boundsByCode).sort().join(',')

  useEffect(() => {
    if (practices.length === 0) return

    let union = null

    for (const p of practices) {
      const b = boundsByCode[p.code]
      if (b && b.isValid()) {
        union = union
          ? union.extend(b)
          : L.latLngBounds(b.getSouthWest(), b.getNorthEast())
      } else {
        const c = centroids[p.code]
        if (c) {
          union = union ? union.extend(c) : L.latLngBounds([c, c])
        }
      }
    }

    if (!union || !union.isValid()) return
    map.flyToBounds(union.pad(0.25), { duration: 1.0, maxZoom: 14 })
  }, [practicesKey, loadedKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ── PracticeBoundary ──────────────────────────────────────────────────────
// Fetches and renders a single practice's boundary + marker.
// Calls onBoundsLoaded(code, L.LatLngBounds) once the GeoJSON is available.
function PracticeBoundary({ practice, color, centroids, onBoundsLoaded }) {
  const [geojson, setGeojson] = useState(null)
  const [noData, setNoData]   = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/gp-boundaries/${practice.code}.geojson`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        if (cancelled) return
        setGeojson(data)
        try {
          const b = L.geoJSON(data).getBounds()
          if (b.isValid()) onBoundsLoaded(practice.code, b)
        } catch (_) { /* malformed geometry */ }
      })
      .catch(() => { if (!cancelled) setNoData(true) })
    return () => { cancelled = true }
  }, [practice.code]) // eslint-disable-line react-hooks/exhaustive-deps

  const center   = centroids[practice.code]
  const icbLabel = (practice.icb ?? '')
    .replace(/^NHS /, '')
    .replace(/ Integrated Care Board$/, '')
    .replace(/ ICB$/, '')

  return (
    <>
      {geojson && (
        <GeoJSON
          key={practice.code}
          data={geojson}
          style={{
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.15,
            opacity: 0.9,
          }}
        />
      )}

      {center && (
        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{
            color: '#fff',
            weight: 1.5,
            fillColor: color,
            fillOpacity: 1,
          }}
        >
          <Popup className={styles.popup}>
            <strong className={styles.popupName}>{practice.name}</strong>
            <span className={styles.popupMeta}>{practice.code}</span>
            {icbLabel && <span className={styles.popupMeta}>{icbLabel}</span>}
            {noData && <span className={styles.popupWarn}>No boundary data available</span>}
          </Popup>
        </CircleMarker>
      )}
    </>
  )
}

// ── MapView ───────────────────────────────────────────────────────────────
export default function MapView({ selectedPractices, centroids }) {
  const [boundsByCode, setBoundsByCode] = useState({})

  // Remove bounds for practices that have been deselected
  const practicesKey = selectedPractices.map(p => p.code).join(',')
  useEffect(() => {
    setBoundsByCode(prev => {
      const codes = new Set(selectedPractices.map(p => p.code))
      return Object.fromEntries(Object.entries(prev).filter(([k]) => codes.has(k)))
    })
  }, [practicesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleBoundsLoaded(code, bounds) {
    setBoundsByCode(prev => ({ ...prev, [code]: bounds }))
  }

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={ENGLAND_CENTER}
        zoom={ENGLAND_ZOOM}
        className={styles.map}
        zoomControl={true}
      >
        {/* CartoDB Positron — light, minimal basemap designed for data overlays */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
          subdomains="abcd"
        />

        {selectedPractices.map((practice, i) => (
          <PracticeBoundary
            key={practice.code}
            practice={practice}
            color={CHART_COLORS[i % CHART_COLORS.length]}
            centroids={centroids}
            onBoundsLoaded={handleBoundsLoaded}
          />
        ))}

        <BoundsController
          practices={selectedPractices}
          boundsByCode={boundsByCode}
          centroids={centroids}
        />
      </MapContainer>
    </div>
  )
}
