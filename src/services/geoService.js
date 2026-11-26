export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchNearbyHospitals(lat, lng) {
  const bbox = `${(lng - 0.08).toFixed(4)},${(lat - 0.08).toFixed(4)},${(lng + 0.08).toFixed(4)},${(lat + 0.08).toFixed(4)}`
  const photonUrl = `https://photon.komoot.io/api/?q=hospital&osm_tag=amenity:hospital&bbox=${bbox}&lat=${lat}&lon=${lng}&limit=15`

  const overpassQuery = `[out:json][timeout:9];(node[amenity=hospital](around:6500,${lat},${lng});way[amenity=hospital](around:6500,${lat},${lng}););out center 20;`
  const overpassUrl = 'https://overpass.private.coffee/api/interpreter'

  const [photonRes, overpassRes] = await Promise.allSettled([
    fetchJsonWithTimeout(photonUrl),
    fetchJsonWithTimeout(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    }),
  ])

  const candidates = []

  if (overpassRes.status === 'fulfilled' && Array.isArray(overpassRes.value?.elements)) {
    for (const el of overpassRes.value.elements) {
      const name = el.tags?.name?.trim()
      const hLat = el.lat ?? el.center?.lat
      const hLng = el.lon ?? el.center?.lon
      if (!name || typeof hLat !== 'number' || typeof hLng !== 'number') continue
      const addrParts = [el.tags?.['addr:street'], el.tags?.['addr:suburb'], el.tags?.['addr:city']].filter(Boolean)
      candidates.push({
        id: `osm-hosp-${el.id}`,
        name,
        address: addrParts.join(', ') || el.tags?.['addr:full'] || 'Nearby Emergency Hospital',
        lat: hLat,
        lng: hLng,
        distanceKm: haversineKm({ lat, lng }, { lat: hLat, lng: hLng }),
      })
    }
  }

  if (photonRes.status === 'fulfilled' && Array.isArray(photonRes.value?.features)) {
    for (const feat of photonRes.value.features) {
      const p = feat.properties || {}
      const coords = feat.geometry?.coordinates
      if (!p.name || !Array.isArray(coords)) continue
      const [hLng, hLat] = coords
      const addrParts = [p.street, p.district || p.suburb, p.city].filter(Boolean)
      candidates.push({
        id: `ph-hosp-${p.osm_id || `${hLat}-${hLng}`}`,
        name: p.name.trim(),
        address: addrParts.join(', ') || 'Nearby Medical Center',
        lat: hLat,
        lng: hLng,
        distanceKm: haversineKm({ lat, lng }, { lat: hLat, lng: hLng }),
      })
    }
  }

  // Filter out generic "Hospital" names if real named hospitals exist, and deduplicate
  const named = candidates.filter((h) => h.name.toLowerCase() !== 'hospital')
  const pool = named.length >= 2 ? named : candidates

  const deduped = []
  for (const h of pool.sort((a, b) => a.distanceKm - b.distanceKm)) {
    const duplicate = deduped.some(
      (existing) =>
        existing.name.toLowerCase() === h.name.toLowerCase() ||
        haversineKm(existing, h) < 0.12
    )
    if (!duplicate) deduped.push(h)
  }

  return deduped.slice(0, 8)
}

export async function fetchTrafficSignals(lat, lng) {
  const query = `[out:json][timeout:9];node[highway=traffic_signals](around:5500,${lat},${lng});out 60;`
  try {
    const data = await fetchJsonWithTimeout('https://overpass.private.coffee/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
    })
    if (!Array.isArray(data?.elements)) return []
    return data.elements
      .filter((el) => typeof el.lat === 'number' && typeof el.lon === 'number')
      .map((el) => ({
        id: `sig-${el.id}`,
        name: el.tags?.name || el.tags?.ref || '',
        lat: el.lat,
        lng: el.lon,
      }))
  } catch {
    return []
  }
}

export async function fetchRoadRoute(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`
  const data = await fetchJsonWithTimeout(url, {}, 9000)
  const route = data?.routes?.[0]
  if (!route || !Array.isArray(route.geometry?.coordinates)) {
    throw new Error('No driving route returned')
  }

  const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
  const steps = []
  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      const loc = step.maneuver?.location
      if (Array.isArray(loc)) {
        steps.push({
          lat: loc[1],
          lng: loc[0],
          streetName: step.name || '',
          type: step.maneuver?.type || 'turn',
          modifier: step.maneuver?.modifier || '',
        })
      }
    }
  }

  return {
    path,
    distanceKm: +(route.distance / 1000).toFixed(2),
    durationMin: Math.max(2, Math.round(route.duration / 60)),
    steps,
  }
}

function findClosestPathIndex(path, point) {
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(path[i], point)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return { index: bestIdx, distanceKm: bestDist }
}

export function buildRouteJunctions(routePath, routeSteps = [], osmSignals = []) {
  if (!Array.isArray(routePath) || routePath.length < 4) return []
  const totalPts = routePath.length - 1
  const junctions = []

  // 1. Real OpenStreetMap traffic signals lying within 160m of the road route
  for (const sig of osmSignals) {
    const { index, distanceKm: distToRoute } = findClosestPathIndex(routePath, sig)
    const progress = index / totalPts
    if (distToRoute <= 0.16 && progress >= 0.08 && progress <= 0.92) {
      const tooClose = junctions.some((j) => Math.abs(j.progress - progress) < 0.12)
      if (!tooClose) {
        // Match nearest OSRM step street name if OSM signal node has no name tag
        let nearestStreet = sig.name
        if (!nearestStreet && routeSteps.length > 0) {
          const namedStep = routeSteps.find(
            (s) => s.streetName && haversineKm(s, sig) < 0.45
          )
          nearestStreet = namedStep?.streetName ? `${namedStep.streetName} Signal` : ''
        }
        junctions.push({
          id: sig.id,
          name: nearestStreet || `Traffic Signal #${junctions.length + 1}`,
          lat: routePath[index].lat,
          lng: routePath[index].lng,
          progress,
          isOsmSignal: true,
          basePhase: junctions.length % 2 === 0 ? 'RED' : 'GREEN',
          cycleOffset: junctions.length * 7,
        })
      }
    }
  }

  // 2. Supplement with real OSRM road intersections (named junctions) so every route has 3-4 clear junctions
  for (const step of routeSteps) {
    if (junctions.length >= 4) break
    if (step.type === 'depart' || step.type === 'arrive') continue
    const { index } = findClosestPathIndex(routePath, step)
    const progress = index / totalPts
    if (progress < 0.12 || progress > 0.9) continue
    const tooClose = junctions.some((j) => Math.abs(j.progress - progress) < 0.18)
    if (!tooClose) {
      junctions.push({
        id: `junc-${index}`,
        name: step.streetName ? `${step.streetName} Junction` : `Main Road Junction ${junctions.length + 1}`,
        lat: routePath[index].lat,
        lng: routePath[index].lng,
        progress,
        isOsmSignal: false,
        basePhase: junctions.length % 2 === 0 ? 'RED' : 'AMBER',
        cycleOffset: junctions.length * 9,
      })
    }
  }

  return junctions.sort((a, b) => a.progress - b.progress)
}
