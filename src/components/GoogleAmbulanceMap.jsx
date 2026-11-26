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
  Clock,
  LocateFixed,
  Activity,
  ShieldCheck,
  Building2,
  RotateCcw,
  Gauge
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import { haversineKm } from '../services/geoService'
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

function interpolateAlongPath(path, progress, fallback) {
  if (!path || path.length === 0) return fallback
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

function computeSignalState(junction, tickSec, overriddenSet) {
  if (overriddenSet.has(junction.id)) {
    return { phase: 'GREEN', isOverridden: true, secondsLeft: null }
  }
  // 34-second cycle: 16s RED, 3s AMBER, 15s GREEN
  const cyclePos = (tickSec + (junction.cycleOffset || 0)) % 34
  if (cyclePos < 16) {
    return { phase: 'RED', isOverridden: false, secondsLeft: 16 - cyclePos }
  }
  if (cyclePos < 19) {
    return { phase: 'AMBER', isOverridden: false, secondsLeft: 19 - cyclePos }
  }
  return { phase: 'GREEN', isOverridden: false, secondsLeft: 34 - cyclePos }
}

function buildAmbulanceIcon(maps, color, isSelected, unitCode) {
  const w = isSelected ? 54 : 44
  const h = isSelected ? 46 : 38
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 54 46">
        ${isSelected ? `<ellipse cx="27" cy="24" rx="25" ry="20" fill="${color}" fill-opacity="0.18"/>` : ''}
        <rect x="20" y="3" width="10" height="4" rx="2" fill="#EF4444" stroke="#FFFFFF" stroke-width="1"/>
        <path d="M7 13 C7 10 9 8 12 8 L33 8 L33 30 L7 30 Z" fill="#FFFFFF" stroke="${color}" stroke-width="2.2"/>
        <path d="M33 13 L42 13 L47 21 L47 30 L33 30 Z" fill="#F8FAFC" stroke="${color}" stroke-width="2.2"/>
        <polygon points="35,15 41,15 44,21 35,21" fill="#BAE6FD"/>
        <rect x="8" y="23" width="38" height="3.5" fill="${color}"/>
        <rect x="18" y="11.5" width="4" height="10" rx="1" fill="#DC2626"/>
        <rect x="15" y="14.5" width="10" height="4" rx="1" fill="#DC2626"/>
        <circle cx="15" cy="31" r="4.2" fill="#1E293B" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="39" cy="31" r="4.2" fill="#1E293B" stroke="#FFFFFF" stroke-width="1.5"/>
        <rect x="9" y="35.5" width="36" height="10" rx="4" fill="${color}"/>
        <text x="27" y="42.8" text-anchor="middle" fill="#FFFFFF" font-family="Inter,Arial,sans-serif" font-size="7.2" font-weight="800">${unitCode || 'AMB'}</text>
      </svg>`
    )}`,
    scaledSize: new maps.Size(w, h),
    anchor: new maps.Point(w / 2, h / 2),
  }
}

function buildHospitalIcon(maps, isPrimary = true) {
  if (isPrimary) {
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="50" viewBox="0 0 44 50">
          <rect x="4" y="4" width="36" height="36" rx="9" fill="#087F5B" stroke="#FFFFFF" stroke-width="2.5"/>
          <rect x="12" y="13" width="20" height="18" rx="2" fill="#FFFFFF" fill-opacity="0.16"/>
          <rect x="19.5" y="13" width="5" height="18" rx="1" fill="#FFFFFF"/>
          <rect x="13" y="19.5" width="18" height="5" rx="1" fill="#FFFFFF"/>
          <polygon points="16,40 28,40 22,48" fill="#087F5B"/>
        </svg>`
      )}`,
      scaledSize: new maps.Size(44, 50),
      anchor: new maps.Point(22, 48),
    }
  }
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="34" viewBox="0 0 30 34">
        <rect x="3" y="3" width="24" height="24" rx="6" fill="#0F766E" stroke="#FFFFFF" stroke-width="2"/>
        <rect x="13" y="8" width="4" height="14" rx="1" fill="#FFFFFF"/>
        <rect x="8" y="13" width="14" height="4" rx="1" fill="#FFFFFF"/>
        <polygon points="11,27 19,27 15,32" fill="#0F766E"/>
      </svg>`
    )}`,
    scaledSize: new maps.Size(30, 34),
    anchor: new maps.Point(15, 32),
  }
}

function buildUserLocationIcon(maps) {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
        <circle cx="17" cy="17" r="15" fill="#2563EB" fill-opacity="0.22"/>
        <circle cx="17" cy="17" r="7.5" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
      </svg>`
    )}`,
    scaledSize: new maps.Size(34, 34),
    anchor: new maps.Point(17, 17),
  }
}

function buildTrafficLightIcon(maps, phase, isOverridden) {
  const redFill = phase === 'RED' ? '#EF4444' : '#334155'
  const amberFill = phase === 'AMBER' ? '#F59E0B' : '#334155'
  const greenFill = phase === 'GREEN' ? '#22C55E' : '#334155'
  const border = isOverridden ? '#16A34A' : '#FFFFFF'
  const halo = isOverridden ? `<circle cx="15" cy="19" r="14" fill="#22C55E" fill-opacity="0.28"/>` : ''
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
        ${halo}
        <rect x="8" y="3" width="14" height="30" rx="5" fill="#0F172A" stroke="${border}" stroke-width="2"/>
        <circle cx="15" cy="10" r="3.3" fill="${redFill}"/>
        <circle cx="15" cy="18" r="3.3" fill="${amberFill}"/>
        <circle cx="15" cy="26" r="3.3" fill="${greenFill}"/>
      </svg>`
    )}`,
    scaledSize: new maps.Size(30, 38),
    anchor: new maps.Point(15, 36),
  }
}

function formatArrivalClock(now, etaMinutes) {
  const arrival = new Date(now.getTime() + (etaMinutes || 4) * 60000)
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function buildInfoHtml(c, color, now) {
  const arrivalStr = formatArrivalClock(now, c.etaMinutes)
  return `
    <div style="font-family:Inter,sans-serif;padding:4px 6px;min-width:210px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong style="color:#17212B;font-size:13px">${c.id} · ${c.ambulance}</strong>
        <span style="background:${color}20;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">${c.priority}</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:#087F5B;margin-top:4px">${c.condition}</div>
      <div style="font-size:11px;color:#64748B;margin-top:2px">${c.location}</div>
      <div style="font-size:11px;color:#475569;margin-top:4px">
        ETA: <strong style="color:#DC2626">${c.eta}</strong> · Arrives ~<strong>${arrivalStr}</strong>
      </div>
      <div style="font-size:11px;color:#475569;margin-top:2px">HR ${c.vitals.hr} · BP ${c.vitals.bp} · SpO₂ ${c.vitals.spo2}</div>
    </div>
  `
}

export default function GoogleAmbulanceMap({
  cases = [],
  selectedCaseId,
  onSelectCase,
  height = 320,
  showControls = true,
  singleCaseMode = false,
}) {
  const {
    googleMapsApiKey,
    saveGoogleMapsApiKey,
    settings,
    userLocation,
    hospitalCoords,
    nearbyHospitals,
    selectedHospital,
    selectReceivingHospital,
    overriddenJunctions,
    toggleJunctionOverride,
    activateGreenCorridor,
    releaseAllSignalOverrides,
    locationStatus,
    requestUserLocation,
  } = useHospital()

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const hospitalMarkersRef = useRef([])
  const userMarkerRef = useRef(null)
  const trafficLayerRef = useRef(null)
  const ambMarkersRef = useRef(new Map())
  const junctionMarkersRef = useRef(new Map())
  const routePolylineRef = useRef(null)
  const routeGlowRef = useRef(null)
  const infoWindowRef = useRef(null)
  const onSelectCaseRef = useRef(onSelectCase)
  onSelectCaseRef.current = onSelectCase
  const overriddenSetRef = useRef(new Set())
  overriddenSetRef.current = new Set(overriddenJunctions)

  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [viewMode, setViewMode] = useState('focus') // 'focus' | 'all'
  const [liveGps, setLiveGps] = useState(true)
  const [showTraffic, setShowTraffic] = useState(true)
  const [gpsProgress, setGpsProgress] = useState(0)
  const [now, setNow] = useState(() => new Date())

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0]
  const activeId = activeCase?.id || ''
  const tickSec = Math.floor(now.getTime() / 1000)
  const overriddenSet = new Set(overriddenJunctions)

  // Compute default junctions along route even before geolocation arrives
  const routeJunctions = activeCase?.junctions?.length
    ? activeCase.junctions
    : activeCase?.routePath?.length >= 3
    ? [
        {
          id: `${activeCase.id}-j1`,
          name: 'Main Avenue Traffic Signal',
          lat: activeCase.routePath[Math.floor(activeCase.routePath.length * 0.35)].lat,
          lng: activeCase.routePath[Math.floor(activeCase.routePath.length * 0.35)].lng,
          progress: 0.35,
          cycleOffset: 2,
        },
        {
          id: `${activeCase.id}-j2`,
          name: 'Hospital Cross Junction Signal',
          lat: activeCase.routePath[Math.floor(activeCase.routePath.length * 0.72)].lat,
          lng: activeCase.routePath[Math.floor(activeCase.routePath.length * 0.72)].lng,
          progress: 0.72,
          cycleOffset: 14,
        },
      ]
    : []

  // Check if ambulance is currently held at an un-overridden RED/AMBER junction
  const blockingJunction = routeJunctions.find((j) => {
    const state = computeSignalState(j, tickSec, overriddenSet)
    const diff = j.progress - gpsProgress
    return !state.isOverridden && state.phase !== 'GREEN' && diff >= 0.005 && diff <= 0.045
  })

  // Live 1s hospital clock & continuous movement along road geometry
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

  useEffect(() => {
    setGpsProgress(0)
  }, [activeId, hospitalCoords.lat, hospitalCoords.lng])

  useEffect(() => {
    if (!liveGps || !googleMapsApiKey || !activeId) return
    const timer = setInterval(() => {
      setGpsProgress((prev) => {
        if (blockingJunction) return prev
        if (prev >= 0.98) return 0
        return +(prev + 0.015).toFixed(3)
      })
    }, 900)
    return () => clearInterval(timer)
  }, [liveGps, googleMapsApiKey, activeId, blockingJunction])

  // 1. Initialize Google Map & TrafficLayer
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
            center: hospitalCoords,
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
          trafficLayerRef.current = new maps.TrafficLayer()
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
  }, [googleMapsApiKey])

  // 2. Toggle Real-Time Google Traffic Layer
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !trafficLayerRef.current) return
    trafficLayerRef.current.setMap(showTraffic ? mapInstanceRef.current : null)
  }, [mapReady, showTraffic])

  // 3. Sync Real Nearby Hospital Markers & User Location Marker
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return
    const maps = window.google.maps
    const map = mapInstanceRef.current

    hospitalMarkersRef.current.forEach((m) => m.setMap(null))
    hospitalMarkersRef.current = []

    const hospitalsToRender =
      nearbyHospitals.length > 0
        ? nearbyHospitals
        : [
            {
              id: 'default-hosp',
              name: selectedHospital?.name || settings.hospitalName,
              address: selectedHospital?.address || settings.address,
              lat: hospitalCoords.lat,
              lng: hospitalCoords.lng,
              distanceKm: 0,
            },
          ]

    hospitalsToRender.forEach((h) => {
      const isSelected =
        selectedHospital ? h.id === selectedHospital.id : Math.abs(h.lat - hospitalCoords.lat) < 0.0002
      const marker = new maps.Marker({
        position: { lat: h.lat, lng: h.lng },
        map,
        title: `${h.name}${isSelected ? ' (Active Receiving Hospital)' : ''}`,
        icon: buildHospitalIcon(maps, isSelected),
        zIndex: isSelected ? 105 : 70,
      })

      marker.addListener('click', () => {
        const btnId = `sertos-route-hosp-${h.id.replace(/[^a-zA-Z0-9]/g, '')}`
        infoWindowRef.current.setContent(`
          <div style="font-family:Inter,sans-serif;padding:4px 6px;min-width:205px">
            <div style="font-weight:700;color:#087F5B;font-size:13px">${h.name}</div>
            <div style="font-size:11.5px;color:#475569;margin-top:2px">${h.address}</div>
            <div style="font-size:11px;color:#64748B;margin-top:4px">
              ${h.distanceKm ? `${h.distanceKm.toFixed(2)} km from you · ` : ''}Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            ${
              !isSelected
                ? `<button id="${btnId}" style="margin-top:8px;width:100%;padding:6px 10px;border:none;border-radius:6px;background:#087F5B;color:#fff;font-size:11.5px;font-weight:600;cursor:pointer">Route Ambulances Here</button>`
                : `<div style="margin-top:6px;font-size:11px;font-weight:700;color:#16A34A">✓ Active Receiving Hospital</div>`
            }
          </div>
        `)
        infoWindowRef.current.open(map, marker)
        if (!isSelected) {
          maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
            const btn = document.getElementById(btnId)
            if (btn) {
              btn.onclick = () => {
                infoWindowRef.current.close()
                selectReceivingHospital(h)
              }
            }
          })
        }
      })

      hospitalMarkersRef.current.push(marker)
    })

    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new maps.Marker({
          position: userLocation,
          map,
          title: 'Your Actual Location',
          icon: buildUserLocationIcon(maps),
          zIndex: 92,
        })
        userMarkerRef.current.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="font-family:Inter,sans-serif;padding:4px 6px">
              <strong style="color:#2563EB;font-size:13px">Your Actual GPS Location</strong>
              <div style="font-size:11px;color:#64748B;margin-top:2px">
                ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}
              </div>
            </div>
          `)
          infoWindowRef.current.open(map, userMarkerRef.current)
        })
      } else {
        userMarkerRef.current.setPosition(userLocation)
      }
    }
  }, [mapReady, hospitalCoords, nearbyHospitals, selectedHospital, userLocation, settings.hospitalName, settings.address, selectReceivingHospital])

  // 4. Sync Traffic Signal Junction Markers & Live Phase Colors
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return
    const maps = window.google.maps
    const map = mapInstanceRef.current

    const junctionIds = new Set(routeJunctions.map((j) => j.id))
    for (const [id, marker] of junctionMarkersRef.current.entries()) {
      if (!junctionIds.has(id)) {
        marker.setMap(null)
        junctionMarkersRef.current.delete(id)
      }
    }

    routeJunctions.forEach((j) => {
      const state = computeSignalState(j, tickSec, new Set(overriddenJunctions))
      let marker = junctionMarkersRef.current.get(j.id)
      if (!marker) {
        marker = new maps.Marker({
          position: { lat: j.lat, lng: j.lng },
          map,
          title: `${j.name} (${state.phase})`,
          icon: buildTrafficLightIcon(maps, state.phase, state.isOverridden),
          zIndex: 88,
        })

        marker.addListener('click', () => {
          const curState = computeSignalState(j, Math.floor(Date.now() / 1000), overriddenSetRef.current)
          const btnId = `sertos-sig-btn-${j.id.replace(/[^a-zA-Z0-9]/g, '')}`
          const statusColor =
            curState.phase === 'GREEN' ? '#16A34A' : curState.phase === 'AMBER' ? '#D97706' : '#DC2626'
          infoWindowRef.current.setContent(`
            <div style="font-family:Inter,sans-serif;padding:4px 6px;min-width:205px">
              <div style="font-weight:700;color:#17212B;font-size:13px">${j.name}</div>
              <div style="margin-top:4px;font-size:11.5px;font-weight:700;color:${statusColor}">
                Signal: ${curState.phase}${curState.isOverridden ? ' (EMERGENCY OVERRIDE)' : curState.secondsLeft ? ` · ${curState.secondsLeft}s` : ''}
              </div>
              <button id="${btnId}" style="margin-top:8px;width:100%;padding:6px 10px;border:none;border-radius:6px;background:${curState.isOverridden ? '#475569' : '#16A34A'};color:#fff;font-size:11.5px;font-weight:600;cursor:pointer">
                ${curState.isOverridden ? 'Release Override' : 'Override Signal → GREEN'}
              </button>
            </div>
          `)
          infoWindowRef.current.open(map, marker)
          maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
            const btn = document.getElementById(btnId)
            if (btn) {
              btn.onclick = () => {
                toggleJunctionOverride(j, activeCase?.ambulance || 'Ambulance')
                infoWindowRef.current.close()
              }
            }
          })
        })

        junctionMarkersRef.current.set(j.id, marker)
      } else {
        marker.setPosition({ lat: j.lat, lng: j.lng })
        marker.setIcon(buildTrafficLightIcon(maps, state.phase, state.isOverridden))
        marker.setTitle(`${j.name} (${state.isOverridden ? 'GREEN OVERRIDE' : state.phase})`)
      }
    })
  }, [mapReady, routeJunctions, tickSec, overriddenJunctions, activeCase?.ambulance, toggleJunctionOverride])

  // 5. Sync Ambulance Vehicle Markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return
    const maps = window.google.maps
    const map = mapInstanceRef.current

    const visibleCases = singleCaseMode && activeCase ? [activeCase] : cases
    const visibleIds = new Set(visibleCases.map((c) => c.id))

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
          ? interpolateAlongPath(c.routePath, gpsProgress, c.coords)
          : c.coords

      let marker = ambMarkersRef.current.get(c.id)
      if (!marker) {
        marker = new maps.Marker({
          position: livePos,
          map,
          title: `${c.ambulance} — ${c.id} (${c.eta})`,
          icon: buildAmbulanceIcon(maps, color, isSelected, c.ambulance),
          zIndex: isSelected ? 98 : 55,
        })

        marker.addListener('click', () => {
          setViewMode('focus')
          if (onSelectCaseRef.current) onSelectCaseRef.current(c.id)
          infoWindowRef.current.setContent(buildInfoHtml(c, color, new Date()))
          infoWindowRef.current.open(map, marker)
        })

        ambMarkersRef.current.set(c.id, marker)
      } else {
        marker.setPosition(livePos)
        marker.setIcon(buildAmbulanceIcon(maps, color, isSelected, c.ambulance))
        marker.setZIndex(isSelected ? 98 : 55)
      }
    })
  }, [mapReady, cases, activeId, gpsProgress, singleCaseMode, activeCase])

  // 6. Draw Real Street Polyline Route & Fit Viewport
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

    if (activeCase?.coords) {
      const path = activeCase.routePath || [activeCase.coords, hospitalCoords]
      routeGlowRef.current = new maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#15A673',
        strokeOpacity: 0.28,
        strokeWeight: 9,
        map,
      })
      routePolylineRef.current = new maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#087F5B',
        strokeOpacity: 0.96,
        strokeWeight: 4.5,
        map,
      })
    }

    const fitViewport = () => {
      const bounds = new maps.LatLngBounds()
      bounds.extend(hospitalCoords)
      if (userLocation) bounds.extend(userLocation)

      if (viewMode === 'focus' && activeCase?.coords) {
        const path = activeCase.routePath || [activeCase.coords]
        path.forEach((pt) => bounds.extend(pt))
      } else {
        cases.forEach((c) => {
          if (c.coords) bounds.extend(c.coords)
        })
      }

      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })
      maps.event.addListenerOnce(map, 'idle', () => {
        const z = map.getZoom()
        if (z > 15) map.setZoom(15)
        if (z < 12) map.setZoom(12)
      })
    }

    fitViewport()

    const handleFullscreenChange = () => {
      setTimeout(() => {
        maps.event.trigger(map, 'resize')
        fitViewport()
      }, 150)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [mapReady, activeId, viewMode, cases, activeCase, hospitalCoords, userLocation])

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
    ? interpolateAlongPath(activeCase.routePath, gpsProgress, activeCase?.coords || hospitalCoords)
    : activeCase?.coords || hospitalCoords
  const remainingKm = activeCase ? haversineKm(currentPos, hospitalCoords).toFixed(2) : '0.0'
  const unClearedRedCount = routeJunctions.filter(
    (j) => j.progress > gpsProgress && !overriddenSet.has(j.id)
  ).length
  const liveSpeedKmh = !liveGps ? 0 : blockingJunction ? 0 : unClearedRedCount === 0 ? 64 : 46
  const baseEta = activeCase?.etaMinutes || 4
  const liveEtaMin = activeCase
    ? Math.max(1, Math.round(baseEta * (1 - gpsProgress * 0.85)) + unClearedRedCount)
    : 0
  const hospitalClockStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const arrivalTimeStr = activeCase ? formatArrivalClock(now, liveEtaMin) : '--:--'
  const allJunctionsOverridden =
    routeJunctions.length > 0 && routeJunctions.every((j) => overriddenSet.has(j.id))

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
                    infoWindowRef.current.setContent(buildInfoHtml(c, getPriorityColor(c.priority), now))
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
            <button
              type="button"
              className={`gmap-action-pill ${locationStatus === 'live' ? 'active-green' : ''}`}
              onClick={() => requestUserLocation(true)}
              title="Center map on your browser's actual GPS location & find real nearby hospitals"
            >
              <LocateFixed size={12} />
              <span>
                {locationStatus === 'live'
                  ? 'My Location'
                  : locationStatus === 'locating'
                  ? 'Locating...'
                  : 'Use My Location'}
              </span>
            </button>

            {googleMapsApiKey && !mapError && (
              <>
                <button
                  type="button"
                  className={`gmap-action-pill ${showTraffic ? 'active-amber' : ''}`}
                  onClick={() => setShowTraffic((p) => !p)}
                  title="Toggle real-time Google Maps road traffic layer"
                >
                  <Activity size={12} />
                  <span>Traffic {showTraffic ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  className={`gmap-gps-btn ${liveGps ? 'active' : ''}`}
                  onClick={() => setLiveGps((p) => !p)}
                  title="Toggle live ambulance movement"
                >
                  {liveGps ? <Pause size={12} /> : <Play size={12} />}
                  <span>{liveGps ? 'Live Run' : 'Paused'}</span>
                </button>
              </>
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

      {/* Real Nearby Receiving Hospital Selector */}
      {showControls && nearbyHospitals.length > 0 && (
        <div className="gmap-hospital-bar">
          <div className="gmap-hospital-bar-label">
            <Building2 size={14} color="#087F5B" />
            <span>Receiving Hospital ({nearbyHospitals.length} nearby found):</span>
          </div>
          <select
            className="gmap-hospital-select"
            value={selectedHospital?.id || ''}
            onChange={(e) => {
              const target = nearbyHospitals.find((h) => h.id === e.target.value)
              if (target) selectReceivingHospital(target)
            }}
          >
            {nearbyHospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.distanceKm.toFixed(2)} km away)
              </option>
            ))}
          </select>
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

            {blockingJunction && (
              <div className="gmap-signal-alert-banner">
                <span>
                  Held at Red Signal: <strong>{blockingJunction.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    toggleJunctionOverride(blockingJunction, activeCase?.ambulance || 'Ambulance')
                  }
                >
                  Override → GREEN
                </button>
              </div>
            )}

            <div className="gmap-hospital-clock-overlay">
              <Clock size={12} color="#087F5B" />
              <span>
                Hospital Time: <strong>{hospitalClockStr}</strong>
              </span>
            </div>
          </div>

          {activeCase && (
            <div className="gmap-telemetry-strip">
              <div className="gmap-telemetry-item">
                <Truck size={14} color="#087F5B" />
                <span>
                  <strong>{activeCase.ambulance}</strong> →{' '}
                  <strong>{selectedHospital?.name || settings.hospitalName}</strong>
                </span>
              </div>
              <div className="gmap-telemetry-item">
                <Gauge size={14} color="#2563EB" />
                <span>
                  Speed: <strong>{liveSpeedKmh} km/h</strong> · Rem: <strong>{remainingKm} km</strong>
                </span>
              </div>
              <div className="gmap-telemetry-item">
                <Clock size={14} color="#DC2626" />
                <span>
                  ETA: <strong style={{ color: '#DC2626' }}>{liveEtaMin} min</strong> · Arrival:{' '}
                  <strong>{arrivalTimeStr}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Traffic Junctions & Signal Preemption Override Console */}
          {!singleCaseMode && routeJunctions.length > 0 && (
            <div className="gmap-corridor-panel">
              <div className="gmap-corridor-header">
                <div className="gmap-corridor-title">
                  <ShieldCheck size={16} color="#087F5B" />
                  <span>Traffic Junctions &amp; Signal Override Console</span>
                  <span className="gmap-sim-badge">Live Route Preemption</span>
                </div>
                <div className="gmap-corridor-actions">
                  {overriddenJunctions.length > 0 && (
                    <button
                      type="button"
                      className="gmap-corridor-reset-btn"
                      onClick={releaseAllSignalOverrides}
                    >
                      <RotateCcw size={12} /> Reset Signals
                    </button>
                  )}
                  <button
                    type="button"
                    className={`gmap-corridor-all-btn ${allJunctionsOverridden ? 'active' : ''}`}
                    onClick={() =>
                      allJunctionsOverridden
                        ? releaseAllSignalOverrides()
                        : activateGreenCorridor(routeJunctions, activeCase?.ambulance || 'Ambulance')
                    }
                  >
                    <ShieldCheck size={13} />
                    {allJunctionsOverridden ? 'Green Corridor Active' : 'Activate Full Green Corridor'}
                  </button>
                </div>
              </div>

              <div className="gmap-junctions-grid">
                {routeJunctions.map((j) => {
                  const state = computeSignalState(j, tickSec, overriddenSet)
                  const passed = gpsProgress > j.progress + 0.02
                  return (
                    <div
                      key={j.id}
                      className={`gmap-junction-card ${state.isOverridden ? 'overridden' : ''} ${
                        blockingJunction?.id === j.id ? 'blocking' : ''
                      }`}
                    >
                      <div className="gmap-junction-info">
                        <div className="gmap-junction-name-row">
                          <span className={`gmap-sig-dot sig-${state.phase.toLowerCase()}`} />
                          <span className="gmap-junction-name">{j.name}</span>
                        </div>
                        <span className="gmap-junction-meta">
                          {passed
                            ? 'Cleared by ambulance'
                            : state.isOverridden
                            ? 'GREEN CORRIDOR OVERRIDE ACTIVE'
                            : `Signal: ${state.phase} (${state.secondsLeft}s)`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`gmap-override-btn ${state.isOverridden ? 'active' : ''}`}
                        onClick={() => toggleJunctionOverride(j, activeCase?.ambulance || 'Ambulance')}
                      >
                        {state.isOverridden ? 'Green Override ON' : 'Override → GREEN'}
                      </button>
                    </div>
                  )
                })}
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
                : 'Add your Google Maps JavaScript API key to display real nearby hospitals, live traffic junctions, signal overrides, and ambulance routes.'}
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
                  Your API key is stored locally in your browser (<code>localStorage</code>) and never committed to GitHub. Ensure <strong>Maps JavaScript API</strong> is enabled in Google Cloud Console.
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
                  Save &amp; Activate Google Maps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
