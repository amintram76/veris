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

// ── FitBounds ─────────────────────────────────────────────────────────────
// Re-centres the map whenever the set of selected practices changes.
function FitBounds({ practices, centroids }) {
  const map = useMap()
  const key = practices.map(p => p.code).join(',')

  useEffect(() => {
    if (practices.length === 0) return
    const coords = practices.map(p => centroids[p.code]).filter(Boolean)
    if (coords.length === 0) return

    if (coords.length === 1) {
      map.flyTo(coords[0], 13, { duration: 1.2 })
    } else {
      map.flyToBounds(L.latLngBounds(coords).pad(0.25), { duration: 1.2 })
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ── PracticeBoundary ──────────────────────────────────────────────────────
// Fetches and renders a single practice's boundary + marker.
function PracticeBoundary({ practice, color, centroids }) {
  const [geojson, setGeojson]     = useState(null)
  const [noData, setNoData]       = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/gp-boundaries/${practice.code}.geojson`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { if (!cancelled) setGeojson(data) })
      .catch(() => { if (!cancelled) setNoData(true) })
    return () => { cancelled = true }
  }, [practice.code])

  const center = centroids[practice.code]
  const icbLabel = (practice.icb ?? '').replace(/^NHS /, '').replace(/ Integrated Care Board$/, '').replace(/ ICB$/, '')

  return (
    <>
      {/* Boundary polygon */}
      {geojson && (
        <GeoJSON
          key={practice.code}
          data={geojson}
          style={{
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.12,
            opacity: 0.9,
          }}
        />
      )}

      {/* Centroid marker */}
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

      {/* Marker for practices with no centroid but no boundary either */}
      {!center && noData && null}
    </>
  )
}

// ── MapView ───────────────────────────────────────────────────────────────
export default function MapView({ selectedPractices, centroids }) {
  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={ENGLAND_CENTER}
        zoom={ENGLAND_ZOOM}
        className={styles.map}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {selectedPractices.map((practice, i) => (
          <PracticeBoundary
            key={practice.code}
            practice={practice}
            color={CHART_COLORS[i % CHART_COLORS.length]}
            centroids={centroids}
          />
        ))}

        {selectedPractices.length > 0 && (
          <FitBounds practices={selectedPractices} centroids={centroids} />
        )}
      </MapContainer>
    </div>
  )
}
