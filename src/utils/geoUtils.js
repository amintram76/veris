// ── Haversine distance ────────────────────────────────────────────────────
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Ray-casting point-in-polygon ──────────────────────────────────────────
// pt = [lng, lat] (GeoJSON coordinate order), ring = [[lng, lat], ...]
function raycast([px, py], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Check whether [lat, lng] falls inside a GeoJSON FeatureCollection
// (handles both Polygon and MultiPolygon geometries).
export function pointInGeoJSON(lat, lng, geojson) {
  const geom = geojson?.features?.[0]?.geometry
  if (!geom) return false
  const pt = [lng, lat] // GeoJSON uses [lng, lat]
  if (geom.type === 'Polygon') {
    return raycast(pt, geom.coordinates[0])
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some(poly => raycast(pt, poly[0]))
  }
  return false
}

// ── Nearest practices by location ─────────────────────────────────────────
// centroids:  { [code]: [lat, lng] }  — polygon centroids (fallback)
// addresses:  { [code]: [lat, lng] }  — actual practice addresses (preferred)
// Returns [{ code, distKm }] sorted ascending, capped at n.
export function nearestByCentroid(lat, lng, centroids, n = 10, addresses = {}) {
  return Object.entries(centroids)
    .map(([code, centroid]) => {
      const [clat, clng] = addresses[code] ?? centroid
      return { code, distKm: haversineKm(lat, lng, clat, clng) }
    })
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, n)
}

export function formatDistKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
