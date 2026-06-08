import { Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Drop-pin icon (SVG divIcon — no asset path issues in Vite)
const PIN_ICON = L.divIcon({
  className: '',
  html: `<svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 0C4.92 0 0 4.92 0 11c0 7.7 11 19 11 19S22 18.7 22 11C22 4.92 17.08 0 11 0z" fill="#1e40af"/>
    <circle cx="11" cy="11" r="4.5" fill="white"/>
  </svg>`,
  iconSize: [22, 30],
  iconAnchor: [11, 30],
})

// Must be rendered inside <MapContainer>.
// Attaches a map click handler and renders a pin at the clicked location.
export default function ClickSearchLayer({ clickedLocation, onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  if (!clickedLocation) return null

  return (
    <Marker
      position={[clickedLocation.lat, clickedLocation.lng]}
      icon={PIN_ICON}
      zIndexOffset={1000}
    />
  )
}
