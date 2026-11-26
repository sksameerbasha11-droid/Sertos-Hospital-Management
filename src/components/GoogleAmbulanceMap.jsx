import { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  KeyRound,
  AlertCircle,
  Navigation,
  CheckCircle2,
  ExternalLink,
  Maximize2,
  Play,
  Pause,
  Truck,
  Clock
} from 'lucide-react'
import { useHospital, HOSPITAL_COORDS } from '../context/HospitalContext'
import './GoogleAmbulanceMap.css'

let loadedScriptPromise = null
let loadedApiKey = null

function loadGoogleMapsScript(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (loadedScriptPromise && loadedApiKey === apiKey) {
    return loadedScriptPromise
  }

  loadedApiKey = apiKey
  loadedScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sertos-gmaps="true"]')
    if (existing) {
      existing.remove()
    }

    const callbackName = '__sertosGoogleMapsInit'
    window[callbackName] = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps)
      } else {
        reject(new Error('Google Maps failed to initialize'))
      }
      delete window[callbackName]
    }

    const script = document.createElement('script')
    script.dataset.sertosGmaps = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      loadedScriptPromise = null
      reject(new Error('Failed to load Google Maps JavaScript SDK'))
    }
    document.head.appendChild(script)
  })

  return loadedScriptPromise
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'Critical':
      return '#DC2626'
    case 'High':
      return '#F59E0B'
    case 'Medium':
      return '#2563EB'
    default:
      return '#16A34A'
  }
}

function interpolateAlongPath(path, progress) {
  if (!path || path.length === 0) return HOSPITAL_COORDS
  if (path.length === 1 || progress <= 0) return path[0]
  if (progress >= 1) return path[path.length - 1]

  const totalSegments = path.length - 1
  const scaled = progress * totalSegments
  const idx = Math.min(Math.floor(scaled), totalSegments - 1)
  const localT = scaled - idx
  const start = path[idx]
  const end = path[idx + 1]

  return {
    lat: start.lat + (end.lat - start.lat) * localT,
    lng: start.lng + (end.lng - start.lng) * localT,
  }
}

function distanceKm(a, b) {
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

function buildAmbulanceIcon(maps, color, isSelected) {
  const size = isSelected ? 40 : 30
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
        ${isSelected ? `<circle cx="20" cy="20" r="19" fill="${color}" fill-opacity="0.22"/>` : ''}
        <circle cx="20" cy="20" r="${isSelected ? 14 : 13}" fill="${color}" stroke="#FFFFFF" stroke-width="${isSelected ? 3 : 2}"/>
        <text x="20" y="24.5" text-anchor="middle" fill="#FFFFFF" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800">A</text>
      </svg>`
    )}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(size / 2, size / 2),
  }
}

function buildInfoHtml(c, color) {
  return `
    <div style="font-family:Inter,sans-serif;padding:4px 6px;min-width:200px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong style="color:#17212B;font-size:13px">${c.id} · ${c.ambulance}</strong>
        <span style="background:${color}20;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">${c.priority}</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:#087F5B;margin-top:4px">${c.condition}</div>
      <div style="font-size:11px;color:#64748B;margin-top:2px">${c.location}</div>
      <div style="font-size:11px;color:#475569;margin-top:4px">ETA: <strong style="color:#DC2626">${c.eta}</strong> · HR ${c.vitals.hr} · SpO₂ ${c.vitals.spo2}</div>
    </div>
  `
}

export default function GoogleAmbulanceMap({
  cases = [],
  selectedCaseId,
  onSelectCase,
  height = 310,
  showControls = true,
  singleCaseMode = false,
}) {
  const { googleMapsApiKey, saveGoogleMapsApiKey, settings } = useHospital()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const hospitalMarkerRef = useRef(null)
  const ambMarkersRef = useRef(new Map())
  const routePolylineRef = useRef(null)
  const routeGlowRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const directionsDisabledRef = useRef(false)
  const infoWindowRef = useRef(null)
  const onSelectCaseRef = useRef(onSelectCase)
  onSelectCaseRef.current = onSelectCase

  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [viewMode, setViewMode] = useState('focus') // 'focus' | 'all'
  const [liveGps, setLiveGps] = useState(true)
  const [gpsProgress, setGpsProgress] = useState(0)

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0]
  const activeId = activeCase?.id || ''

  // Reset GPS progress cleanly when switching active ambulance
  useEffect(() => {
    setGpsProgress(0)
  }, [activeId])

  // Subtle live GPS movement simulation along street waypoints
  useEffect(() => {
    if (!liveGps || !googleMapsApiKey || !activeId) return
    const timer = setInterval(() => {
      setGpsProgress((prev) => (prev >= 0.72 ? 0 : +(prev + 0.04).toFixed(2)))
    }, 1800)
    return () => clearInterval(timer)
  }, [liveGps, googleMapsApiKey, activeId])

  // 1. Initialize Google Map & Hospital Marker
  useEffect(() => {
    if (!googleMapsApiKey) {
      setMapReady(false)
      setMapError('')
      return
    }

    let cancelled = false
    setMapError('')

    const prevAuthFailure = window.gm_authFailure
    window.gm_authFailure = () => {
      if (!cancelled) {
        setMapError('Google Maps API key authentication failed. Check Maps JavaScript API & Billing in Google Cloud Console.')
        setMapReady(false)
      }
    }

    loadGoogleMapsScript(googleMapsApiKey)
      .then((maps) => {
        if (cancelled || !mapContainerRef.current) return

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: HOSPITAL_COORDS,
            zoom: 14,
            zoomControl: true,
            cameraControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: maps.MapTypeControlStyle.DROPDOWN_MENU,
            },
            scaleControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
              { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            ],
          })
          mapInstanceRef.current = map
          infoWindowRef.current = new maps.InfoWindow()
        }

        const map = mapInstanceRef.current
        if (!hospitalMarkerRef.current) {
          const hospitalSvg = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44">
                <rect x="3" y="2" width="32" height="32" rx="8" fill="#087F5B" stroke="#FFFFFF" stroke-width="2.5"/>
                <text x="19" y="24" text-anchor="middle" fill="#FFFFFF" font-family="Inter,Arial,sans-serif" font-size="16" font-weight="800">H</text>
                <polygon points="14,34 24,34 19,42" fill="#087F5B"/>
              </svg>`
            )}`,
            scaledSize: new maps.Size(38, 44),
            anchor: new maps.Point(19, 42),
          }

          const hospitalMarker = new maps.Marker({
            position: HOSPITAL_COORDS,
            map,
            title: settings.hospitalName,
            icon: hospitalSvg,
            zIndex: 100,
          })

          hospitalMarker.addListener('click', () => {
            infoWindowRef.current.setContent(`
              <div style="font-family:Inter,sans-serif;padding:4px 6px;min-width:170px">
                <div style="font-weight:700;color:#087F5B;font-size:13px">${settings.hospitalName}</div>
                <div style="font-size:12px;color:#475569;margin-top:2px">${settings.address}</div>
                <div style="font-size:11px;color:#16A34A;font-weight:600;margin-top:4px">Emergency Receiving Center</div>
              </div>
            `)
            infoWindowRef.current.open(map, hospitalMarker)
          })

          hospitalMarkerRef.current = hospitalMarker
        }

        setMapReady(true)
      })
      .catch((err) => {
        if (!cancelled) {
          setMapError(err.message || 'Unable to load Google Maps')
          setMapReady(false)
        }
      })

    return () => {
      cancelled = true
      window.gm_authFailure = prevAuthFailure
    }
  }, [googleMapsApiKey, settings.hospitalName, settings.address])

  // 2. Sync markers, street-following route, and viewport without killing InfoWindow
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return
    const maps = window.google.maps
    const map = mapInstanceRef.current

    const visibleCases = singleCaseMode && activeCase ? [activeCase] : cases
    const visibleIds = new Set(visibleCases.map((c) => c.id))

    // Remove markers no longer in visibleCases
    for (const [id, marker] of ambMarkersRef.current.entries()) {
      if (!visibleIds.has(id)) {
        marker.setMap(null)
        ambMarkersRef.current.delete(id)
      }
    }

    visibleCases.forEach((c) => {
      if (!c.coords) return
      const color = getPriorityColor(c.priority)
      const isSelected = activeId === c.id
      const livePos =
        isSelected && c.routePath
          ? interpolateAlongPath(c.routePath, gpsProgress)
          : c.coords

      let marker = ambMarkersRef.current.get(c.id)
      if (!marker) {
        marker = new maps.Marker({
          position: livePos,
          map,
          title: `${c.ambulance} — ${c.id} (${c.eta})`,
          icon: buildAmbulanceIcon(maps, color, isSelected),
          zIndex: isSelected ? 95 : 50,
        })

        marker.addListener('click', () => {
          setViewMode('focus')
          if (onSelectCaseRef.current) onSelectCaseRef.current(c.id)
          infoWindowRef.current.setContent(buildInfoHtml(c, color))
          infoWindowRef.current.open(map, marker)
        })

        ambMarkersRef.current.set(c.id, marker)
      } else {
        marker.setPosition(livePos)
        marker.setIcon(buildAmbulanceIcon(maps, color, isSelected))
        marker.setZIndex(isSelected ? 95 : 50)
      }
    })
  }, [mapReady, cases, activeId, gpsProgress, singleCaseMode, activeCase])

  // 3. Draw street route & focus viewport when selected case or viewMode changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return
    const maps = window.google.maps
    const map = mapInstanceRef.current

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null)
      routePolylineRef.current = null
    }
    if (routeGlowRef.current) {
      routeGlowRef.current.setMap(null)
      routeGlowRef.current = null
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }

    const drawStreetPolyline = () => {
      if (!activeCase?.coords) return
      const path = activeCase.routePath || [activeCase.coords, HOSPITAL_COORDS]
      routeGlowRef.current = new maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#15A673',
        strokeOpacity: 0.25,
        strokeWeight: 9,
        map,
      })
      routePolylineRef.current = new maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#087F5B',
        strokeOpacity: 0.95,
        strokeWeight: 4,
        map,
      })
    }

    let cancelled = false
    if (activeCase?.coords) {
      if (!directionsDisabledRef.current && maps.DirectionsService && maps.DirectionsRenderer) {
        const directionsService = new maps.DirectionsService()
        const directionsRenderer = new maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: '#087F5B',
            strokeOpacity: 0.92,
            strokeWeight: 5,
          },
        })
        directionsRendererRef.current = directionsRenderer

        directionsService.route(
          {
            origin: activeCase.coords,
            destination: HOSPITAL_COORDS,
            travelMode: maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (cancelled) return
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result)
            } else {
              directionsDisabledRef.current = true
              directionsRenderer.setMap(null)
              drawStreetPolyline()
            }
          }
        )
      } else {
        drawStreetPolyline()
      }
    }

    // Fit map bounds cleanly based on viewMode ('focus' vs 'all')
    const bounds = new maps.LatLngBounds()
    bounds.extend(HOSPITAL_COORDS)

    if (viewMode === 'focus' && activeCase?.coords) {
      const path = activeCase.routePath || [activeCase.coords]
      path.forEach((pt) => bounds.extend(pt))
    } else {
      cases.forEach((c) => {
        if (c.coords) bounds.extend(c.coords)
      })
    }

    map.fitBounds(bounds, { top: 45, right: 45, bottom: 45, left: 45 })
    const listener = maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom() > 15) map.setZoom(15)
    })

    return () => {
      cancelled = true
      maps.event.removeListener(listener)
    }
  }, [mapReady, activeId, viewMode, cases, activeCase])

  const handleSaveKey = (e) => {
    e.preventDefault()
    const trimmed = keyInput.trim()
    if (!trimmed) return
    const hadLoadedSdk = Boolean(window.google && window.google.maps)
    saveGoogleMapsApiKey(trimmed)
    setShowKeyModal(false)
    setKeyInput('')
    if (hadLoadedSdk) {
      window.location.reload()
    }
  }

  const currentPos = activeCase?.routePath
    ? interpolateAlongPath(activeCase.routePath, gpsProgress)
    : activeCase?.coords || HOSPITAL_COORDS
  const remainingKm = activeCase ? distanceKm(currentPos, HOSPITAL_COORDS).toFixed(2) : '0.0'
  const liveEtaMin = activeCase
    ? Math.max(1, Math.round(activeCase.etaMinutes * (1 - gpsProgress * 0.75)))
    : 0

  return (
    <div className="gmap-wrapper">
      {showControls && cases.length > 0 && (
        <div className="gmap-toolbar">
          <div className="gmap-unit-pills">
            {!singleCaseMode && (
              <button
                type="button"
                className={`gmap-unit-pill ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
                title="Zoom to all active ambulance units"
              >
                <Maximize2 size={11} />
                <span>All Units ({cases.length})</span>
              </button>
            )}
            {cases.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`gmap-unit-pill ${viewMode === 'focus' && activeId === c.id ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('focus')
                  if (onSelectCase) onSelectCase(c.id)
                  const marker = ambMarkersRef.current.get(c.id)
                  if (marker && mapInstanceRef.current && infoWindowRef.current) {
                    infoWindowRef.current.setContent(buildInfoHtml(c, getPriorityColor(c.priority)))
                    infoWindowRef.current.open(mapInstanceRef.current, marker)
                  }
                }}
              >
                <span
                  className="gmap-unit-dot"
                  style={{ background: getPriorityColor(c.priority) }}
                />
                <strong>{c.id}</strong>
                <span>({c.eta})</span>
              </button>
            ))}
          </div>

          <div className="gmap-right-controls">
            {googleMapsApiKey && !mapError && (
              <button
                type="button"
                className={`gmap-gps-btn ${liveGps ? 'active' : ''}`}
                onClick={() => setLiveGps((p) => !p)}
                title="Toggle live ambulance GPS simulation"
              >
                {liveGps ? <Pause size={12} /> : <Play size={12} />}
                <span>{liveGps ? 'Live GPS' : 'Paused'}</span>
              </button>
            )}
            {!googleMapsApiKey ? (
              <button
                type="button"
                className="gmap-config-btn"
                onClick={() => setShowKeyModal(true)}
              >
                <KeyRound size={13} /> Add Google Maps API Key
              </button>
            ) : (
              <span className="gmap-live-indicator">
                <CheckCircle2 size={13} /> Google Maps Live
              </span>
            )}
          </div>
        </div>
      )}

      {googleMapsApiKey && !mapError ? (
        <>
          <div className="gmap-canvas-shell" style={{ height: `${height}px` }}>
            <div ref={mapContainerRef} className="gmap-canvas" />
            {!mapReady && (
              <div className="gmap-loading-overlay">
                <Navigation size={18} />
                <span>Loading Google Maps...</span>
              </div>
            )}
          </div>

          {activeCase && (
            <div className="gmap-telemetry-strip">
              <div className="gmap-telemetry-item">
                <Truck size={14} color="#087F5B" />
                <span>
                  <strong>{activeCase.ambulance}</strong> ({activeCase.id})
                </span>
              </div>
              <div className="gmap-telemetry-item">
                <MapPin size={14} color="#64748B" />
                <span>{activeCase.location}</span>
              </div>
              <div className="gmap-telemetry-item">
                <Navigation size={14} color="#2563EB" />
                <span>
                  Distance: <strong>{remainingKm} km</strong>
                </span>
              </div>
              <div className="gmap-telemetry-item">
                <Clock size={14} color="#DC2626" />
                <span>
                  Live ETA: <strong style={{ color: '#DC2626' }}>{liveEtaMin} min</strong>
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="gmap-setup-panel" style={{ minHeight: `${height}px` }}>
          <div className="gmap-setup-grid-bg" />
          <div className="gmap-setup-content">
            <div className="gmap-setup-icon">
              {mapError ? <AlertCircle size={24} color="#DC2626" /> : <MapPin size={24} color="#087F5B" />}
            </div>
            <h4>{mapError ? 'Google Maps Connection Issue' : 'Connect Google Maps to Track Ambulances Live'}</h4>
            <p>
              {mapError
                ? mapError
                : 'Add your Google Maps JavaScript API key to display interactive street routes, live ambulance markers, and directions to SERTOS Hospital.'}
            </p>
            <div className="gmap-setup-actions">
              <button
                type="button"
                className="sertos-btn sertos-btn-primary"
                onClick={() => {
                  setKeyInput(googleMapsApiKey || '')
                  setShowKeyModal(true)
                }}
              >
                <KeyRound size={15} /> {googleMapsApiKey ? 'Update API Key' : 'Enter Google API Key'}
              </button>
              <span className="gmap-env-hint">
                Or set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>
              </span>
            </div>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="sertos-modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title">
                <KeyRound size={18} color="#087F5B" /> Configure Google Maps API Key
              </h3>
              <button type="button" className="sertos-modal-close" onClick={() => setShowKeyModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSaveKey}>
              <div className="sertos-modal-body">
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  Your API key is stored locally in your browser (<code>localStorage</code>) and never committed to GitHub. Ensure <strong>Maps JavaScript API</strong> (and optionally <strong>Directions API</strong>) is enabled in Google Cloud Console.
                </p>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Google Maps JavaScript API Key</label>
                  <input
                    type="password"
                    className="sertos-form-control"
                    placeholder="AIzaSy..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    required
                  />
                </div>
                <div className="gmap-doc-tip">
                  <ExternalLink size={13} />
                  <span>
                    Prefer an environment file? Paste into <code>c:\sertos hospital\sertos-dashboard\.env.local</code> as <code>VITE_GOOGLE_MAPS_API_KEY=your_key</code>
                  </span>
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setShowKeyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sertos-btn sertos-btn-primary">
                  Save & Activate Google Maps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
