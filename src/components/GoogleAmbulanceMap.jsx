import { useEffect, useRef, useState } from 'react'
import { MapPin, KeyRound, AlertCircle, Navigation, CheckCircle2, ExternalLink } from 'lucide-react'
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

export default function GoogleAmbulanceMap({
  cases = [],
  selectedCaseId,
  onSelectCase,
  height = 280,
  showControls = true,
}) {
  const { googleMapsApiKey, saveGoogleMapsApiKey, settings } = useHospital()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const infoWindowRef = useRef(null)

  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0]

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
        setMapError('Google Maps API key authentication failed. Check that Maps JavaScript API and billing are enabled for this key.')
        setMapReady(false)
      }
    }

    loadGoogleMapsScript(googleMapsApiKey)
      .then((maps) => {
        if (cancelled || !mapContainerRef.current) return

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
            center: HOSPITAL_COORDS,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
              { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            ],
          })
          infoWindowRef.current = new maps.InfoWindow()
        }

        const map = mapInstanceRef.current

        // Clear old markers & routes
        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []
        if (polylineRef.current) {
          polylineRef.current.setMap(null)
          polylineRef.current = null
        }
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
          directionsRendererRef.current = null
        }

        // Hospital Marker
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
        markersRef.current.push(hospitalMarker)

        const bounds = new maps.LatLngBounds()
        bounds.extend(HOSPITAL_COORDS)

        // Ambulance Markers
        cases.forEach((c) => {
          if (!c.coords) return
          const color = getPriorityColor(c.priority)
          const isSelected = activeCase?.id === c.id
          const size = isSelected ? 36 : 30
          const ambSvg = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="${color}" stroke="#FFFFFF" stroke-width="${isSelected ? 3 : 2}"/>
                <text x="18" y="22" text-anchor="middle" fill="#FFFFFF" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800">A</text>
              </svg>`
            )}`,
            scaledSize: new maps.Size(size, size),
            anchor: new maps.Point(size / 2, size / 2),
          }

          const marker = new maps.Marker({
            position: c.coords,
            map,
            title: `${c.ambulance} — ${c.id} (${c.eta})`,
            icon: ambSvg,
            zIndex: isSelected ? 90 : 50,
          })

          marker.addListener('click', () => {
            if (onSelectCase) onSelectCase(c.id)
            infoWindowRef.current.setContent(`
              <div style="font-family:Inter,sans-serif;padding:4px 6px;min-width:190px">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                  <strong style="color:#17212B;font-size:13px">${c.id} · ${c.ambulance}</strong>
                  <span style="background:${color}20;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">${c.priority}</span>
                </div>
                <div style="font-size:12px;font-weight:600;color:#087F5B;margin-top:4px">${c.condition}</div>
                <div style="font-size:11px;color:#64748B;margin-top:2px">ETA: <strong style="color:#DC2626">${c.eta}</strong> · ${c.status}</div>
                <div style="font-size:11px;color:#475569;margin-top:4px">HR ${c.vitals.hr} · BP ${c.vitals.bp} · SpO₂ ${c.vitals.spo2}</div>
              </div>
            `)
            infoWindowRef.current.open(map, marker)
          })

          markersRef.current.push(marker)
          bounds.extend(c.coords)
        })

        // Route for selected ambulance (Directions API with fallback polyline)
        if (activeCase?.coords) {
          const drawFallbackPolyline = () => {
            polylineRef.current = new maps.Polyline({
              path: [activeCase.coords, HOSPITAL_COORDS],
              geodesic: true,
              strokeColor: '#087F5B',
              strokeOpacity: 0.85,
              strokeWeight: 4,
              map,
            })
          }

          if (maps.DirectionsService && maps.DirectionsRenderer) {
            const directionsService = new maps.DirectionsService()
            const directionsRenderer = new maps.DirectionsRenderer({
              map,
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#087F5B',
                strokeOpacity: 0.9,
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
                  directionsRenderer.setMap(null)
                  drawFallbackPolyline()
                }
              }
            )
          } else {
            drawFallbackPolyline()
          }
        }

        if (cases.length > 0) {
          map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
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
  }, [googleMapsApiKey, cases, activeCase?.id, settings.hospitalName, settings.address])

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

  return (
    <div className="gmap-wrapper">
      {showControls && cases.length > 0 && (
        <div className="gmap-toolbar">
          <div className="gmap-unit-pills">
            {cases.slice(0, 4).map((c) => (
              <button
                type="button"
                key={c.id}
                className={`gmap-unit-pill ${activeCase?.id === c.id ? 'active' : ''}`}
                onClick={() => onSelectCase && onSelectCase(c.id)}
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
      )}

      {googleMapsApiKey && !mapError ? (
        <div className="gmap-canvas-shell" style={{ height: `${height}px` }}>
          <div ref={mapContainerRef} className="gmap-canvas" />
          {!mapReady && (
            <div className="gmap-loading-overlay">
              <Navigation size={18} />
              <span>Loading Google Maps...</span>
            </div>
          )}
        </div>
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
