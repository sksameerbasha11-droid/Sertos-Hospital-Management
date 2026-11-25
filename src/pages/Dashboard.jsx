import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ambulance,
  BedDouble,
  Users,
  Monitor,
  ArrowRight,
  AlertTriangle,
  Clock,
  MapPin,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  Phone,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Stethoscope,
  Shield,
  X,
  Radio,
  Navigation
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './Dashboard.css'

export default function Dashboard() {
  const {
    cases,
    departments,
    edBeds,
    staff,
    teams,
    alerts,
    metrics,
    codeBlueActive,
    toggleCodeBlue,
    prepareBayForCase,
    alertTeam,
    addAlert,
    showToast,
  } = useHospital()

  const [activeModal, setActiveModal] = useState(null) // 'ambulance' | 'reserve' | 'alertTeam' | 'codeBlue' | 'map'
  const [selectedCaseId, setSelectedCaseId] = useState('SRT-1047')
  const [selectedBedId, setSelectedBedId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('team-cardiac')
  const [teamMessage, setTeamMessage] = useState('Prepare cardiac cath bay for incoming SRT-1047.')
  const [radioMessage, setRadioMessage] = useState('Bay prepared. Proceed directly to Emergency Entrance North.')
  const [codeBlueLocation, setCodeBlueLocation] = useState('Emergency Bay 1')

  const primaryEmergency = cases.find((c) => c.id === 'SRT-1047') || cases[0]
  const availableEdBeds = edBeds.filter((b) => b.status === 'available')

  const kpiCards = [
    {
      icon: Ambulance,
      title: 'Incoming Emergency',
      value: metrics.immediateIncomingCount,
      bg: '#FEF2F2',
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      change: `${metrics.totalIncomingCount} total en route`,
      changeType: 'warning',
    },
    {
      icon: BedDouble,
      title: 'Beds Available',
      value: metrics.totalBedsAvailable,
      bg: '#ECFDF5',
      iconBg: '#D1FAE5',
      iconColor: '#16A34A',
      change: `${Math.round((metrics.totalBedsAvailable / metrics.totalBeds) * 100)}% capacity free`,
      changeType: 'success',
    },
    {
      icon: Users,
      title: 'On-Duty Specialists',
      value: metrics.onDutyCount,
      bg: '#EFF6FF',
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
      change: 'Full ER coverage',
      changeType: 'info',
    },
    {
      icon: Monitor,
      title: 'ICU Available',
      value: metrics.icuAvailable,
      bg: '#F5F3FF',
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
      change: 'of 15 ICU beds',
      changeType: 'neutral',
    },
  ]

  const generalWards = departments.filter((d) => d.id === 'ward-a' || d.id === 'ward-b')
  const generalAvail = generalWards.reduce((s, d) => s + d.available, 0)
  const generalTotal = generalWards.reduce((s, d) => s + d.total, 0)
  const edDept = departments.find((d) => d.id === 'ed')
  const icuDept = departments.find((d) => d.id === 'icu')
  const cardiacDept = departments.find((d) => d.id === 'cardiac')

  const quickActions = [
    { id: 'ambulance', icon: Phone, label: 'Call Ambulance', color: '#DC2626' },
    { id: 'reserve', icon: BedDouble, label: 'Reserve Bed', color: '#087F5B' },
    { id: 'alertTeam', icon: Users, label: 'Alert Team', color: '#2563EB' },
    { id: 'codeBlue', icon: Shield, label: codeBlueActive ? 'Code Blue Active' : 'Code Blue', color: '#7C3AED' },
  ]

  const openModal = (id) => {
    if (id === 'reserve' && availableEdBeds.length > 0) {
      setSelectedBedId(availableEdBeds[0].id)
    }
    if (id === 'reserve' && cases.length > 0) {
      setSelectedCaseId(cases[0].id)
    }
    setActiveModal(id)
  }

  const handleCallAmbulance = (e) => {
    e.preventDefault()
    const unit = cases.find((c) => c.id === selectedCaseId) || primaryEmergency
    addAlert(`Radio contact established with ${unit?.ambulance || 'AMB-12'}: "${radioMessage}"`, 'info')
    showToast(`Radio message sent to ${unit?.ambulance || 'AMB-12'}`)
    setActiveModal(null)
  }

  const handleReserveBed = (e) => {
    e.preventDefault()
    if (!selectedBedId) {
      showToast('No available ED beds remaining', 'warning')
      return
    }
    prepareBayForCase(selectedCaseId, selectedBedId)
    setActiveModal(null)
  }

  const handleAlertTeam = (e) => {
    e.preventDefault()
    const team = teams.find((t) => t.id === selectedTeamId)
    alertTeam(team?.name || 'Emergency Team', teamMessage)
    setActiveModal(null)
  }

  const trackedCase = cases.find((c) => c.id === selectedCaseId) || primaryEmergency

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div className="kpi-card" key={i} style={{ background: card.bg }}>
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: card.iconBg }}>
                  <Icon size={22} color={card.iconColor} />
                </div>
                <TrendingUp size={16} className="kpi-trend" />
              </div>
              <div className="kpi-value">{card.value}</div>
              <div className="kpi-title">{card.title}</div>
              <div className={`kpi-change ${card.changeType}`}>{card.change}</div>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Emergency + Vitals + Map | Quick Actions + Team + Alerts + Beds */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Active Emergency Card */}
          <div className="emergency-card">
            <div className="emergency-header">
              <div className="emergency-header-left">
                <AlertTriangle size={18} className="emergency-icon" />
                <h3>Active Emergency</h3>
              </div>
              <span className="priority-badge high">
                {primaryEmergency ? `${primaryEmergency.priority} Priority` : 'All Cleared'}
              </span>
            </div>

            {primaryEmergency ? (
              <>
                <div className="emergency-body">
                  <div className="emergency-row">
                    <div className="emergency-detail">
                      <span className="detail-label">Incident ID</span>
                      <span className="detail-value">{primaryEmergency.id}</span>
                    </div>
                    <div className="emergency-detail">
                      <span className="detail-label">Priority</span>
                      <span className="detail-value priority-text">{primaryEmergency.priority} Priority</span>
                    </div>
                  </div>

                  <div className="emergency-row">
                    <div className="emergency-detail">
                      <span className="detail-label">Patient</span>
                      <span className="detail-value">
                        {primaryEmergency.patient.gender}, approximately {primaryEmergency.patient.age} years
                      </span>
                    </div>
                    <div className="emergency-detail">
                      <span className="detail-label">Condition</span>
                      <span className="detail-value">{primaryEmergency.condition}</span>
                    </div>
                  </div>

                  <div className="emergency-row">
                    <div className="emergency-detail">
                      <span className="detail-label">Ambulance Status</span>
                      <div className="ambulance-status">
                        <span className="status-dot en-route"></span>
                        <span>{primaryEmergency.status} ({primaryEmergency.ambulance})</span>
                      </div>
                    </div>
                    <div className="emergency-detail">
                      <span className="detail-label">ETA</span>
                      <span className="detail-value eta-value">
                        <Clock size={14} /> {primaryEmergency.eta}
                      </span>
                    </div>
                  </div>

                  <div className="emergency-source">
                    <Ambulance size={14} />
                    <span>Source: {primaryEmergency.source}</span>
                    {primaryEmergency.assignedBay && (
                      <span className="assigned-bay-chip">Bay Ready: {primaryEmergency.assignedBay}</span>
                    )}
                  </div>
                </div>

                <div className="emergency-footer">
                  <Link to={`/incoming-cases?case=${primaryEmergency.id}`} className="btn-view-details">
                    View Full Details <ArrowRight size={16} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="emergency-body">
                <p style={{ color: '#64748B', fontSize: 14 }}>No incoming emergency units at this time. All cases admitted.</p>
              </div>
            )}
          </div>

          {/* Patient Vitals Preview */}
          <div className="card vitals-card">
            <div className="card-header">
              <h3><Activity size={18} /> Patient Vitals — {primaryEmergency?.id || 'SRT-1047'}</h3>
              <span className="card-badge live">LIVE</span>
            </div>
            <div className="vitals-grid">
              <div className="vital-item">
                <div className="vital-icon heart">
                  <Heart size={18} />
                </div>
                <div className="vital-info">
                  <span className="vital-label">Heart Rate</span>
                  <span className="vital-value">{primaryEmergency?.vitals.hr || 112} <small>bpm</small></span>
                </div>
                <span className="vital-status warning">Elevated</span>
              </div>
              <div className="vital-item">
                <div className="vital-icon bp">
                  <Droplets size={18} />
                </div>
                <div className="vital-info">
                  <span className="vital-label">Blood Pressure</span>
                  <span className="vital-value">{primaryEmergency?.vitals.bp || '145/92'} <small>mmHg</small></span>
                </div>
                <span className="vital-status warning">High</span>
              </div>
              <div className="vital-item">
                <div className="vital-icon spo2">
                  <Wind size={18} />
                </div>
                <div className="vital-info">
                  <span className="vital-label">SpO₂</span>
                  <span className="vital-value">{(primaryEmergency?.vitals.spo2 || '96%').replace('%', '')} <small>%</small></span>
                </div>
                <span className="vital-status normal">Normal</span>
              </div>
              <div className="vital-item">
                <div className="vital-icon temp">
                  <Thermometer size={18} />
                </div>
                <div className="vital-info">
                  <span className="vital-label">Temperature</span>
                  <span className="vital-value">{(primaryEmergency?.vitals.temp || '37.8°C').replace('°C', '')} <small>°C</small></span>
                </div>
                <span className="vital-status normal">Normal</span>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="card map-card">
            <div className="card-header">
              <h3><MapPin size={18} /> Ambulance Tracking</h3>
              <button type="button" className="card-link-btn" onClick={() => setActiveModal('map')}>
                View Full Map →
              </button>
            </div>
            <div className="map-placeholder">
              <div className="map-content">
                <svg viewBox="0 0 600 220" width="100%" height="220">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5EAF0" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="600" height="220" fill="#F8FAFB" rx="8" />
                  <rect width="600" height="220" fill="url(#grid)" />

                  {/* Road paths */}
                  <path d="M 0 110 L 600 110" stroke="#D1D5DB" strokeWidth="3" strokeDasharray="8,4" />
                  <path d="M 300 0 L 300 220" stroke="#D1D5DB" strokeWidth="3" strokeDasharray="8,4" />
                  <path d="M 100 50 L 500 180" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="6,3" />

                  {/* Route line */}
                  <path d="M 120 160 C 200 140, 280 100, 420 70" stroke="#087F5B" strokeWidth="3" fill="none" strokeDasharray="6,4">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                  </path>

                  {/* Ambulance 1 */}
                  <circle cx="120" cy="160" r="10" fill="#DC2626" stroke="#fff" strokeWidth="2" />
                  <text x="120" y="164" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">A</text>
                  <text x="120" y="182" textAnchor="middle" fill="#64748B" fontSize="10">SRT-1047</text>

                  {/* Hospital marker */}
                  <rect x="405" y="55" width="30" height="30" rx="6" fill="#087F5B" stroke="#fff" strokeWidth="2" />
                  <text x="420" y="74" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">H</text>
                  <text x="420" y="100" textAnchor="middle" fill="#087F5B" fontSize="10" fontWeight="600">SERTOS Hospital</text>

                  {/* ETA badge */}
                  <rect x="230" y="90" width="80" height="28" rx="14" fill="#087F5B" />
                  <text x="270" y="108" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">ETA: 4 min</text>

                  {/* Second ambulance */}
                  <circle cx="480" cy="170" r="8" fill="#F59E0B" stroke="#fff" strokeWidth="2" />
                  <text x="480" y="174" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">A</text>
                  <text x="480" y="190" textAnchor="middle" fill="#64748B" fontSize="9">SRT-1046</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* Quick Actions */}
          <div className="card quick-actions-card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    type="button"
                    className={`quick-action-btn ${action.id === 'codeBlue' && codeBlueActive ? 'qa-code-blue-active' : ''}`}
                    key={action.id}
                    onClick={() => openModal(action.id)}
                  >
                    <div className="qa-icon" style={{ background: action.color + '14', color: action.color }}>
                      <Icon size={18} />
                    </div>
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Emergency Team */}
          <div className="card team-card">
            <div className="card-header">
              <h3><Stethoscope size={18} /> Emergency Team</h3>
              <Link to="/staff-teams" className="card-link">View All →</Link>
            </div>
            <div className="team-list">
              {staff.slice(0, 4).map((member) => (
                <div className="team-member" key={member.id}>
                  <div className="member-avatar" style={{ background: member.color }}>
                    {member.initials}
                  </div>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                  </div>
                  <span className={`member-status ${member.status === 'On Duty' ? 'available' : 'on-call'}`}>
                    {member.status === 'On Duty' ? 'Available' : member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="card alerts-card">
            <div className="card-header">
              <h3><AlertTriangle size={18} /> Recent Alerts</h3>
              <span className="alert-count">{alerts.length} Logged</span>
            </div>
            <div className="alerts-list">
              {alerts.slice(0, 5).map((alert) => {
                const Icon =
                  alert.type === 'critical'
                    ? AlertTriangle
                    : alert.type === 'warning'
                    ? AlertCircle
                    : alert.type === 'success'
                    ? CheckCircle
                    : Clock
                return (
                  <div className={`alert-item ${alert.type}`} key={alert.id}>
                    <div className={`alert-icon ${alert.type}`}>
                      <Icon size={14} />
                    </div>
                    <div className="alert-content">
                      <span className="alert-text">{alert.text}</span>
                      <span className="alert-time">{alert.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bed Summary */}
          <div className="card bed-summary-card">
            <div className="card-header">
              <h3><BedDouble size={18} /> Bed Availability</h3>
              <Link to="/bed-management" className="card-link">Manage →</Link>
            </div>
            <div className="bed-bars">
              <div className="bed-bar-item">
                <div className="bed-bar-label">
                  <span>Emergency</span>
                  <span>{edDept?.available ?? 6} free / {edDept?.total ?? 20}</span>
                </div>
                <div className="bed-bar-track">
                  <div
                    className="bed-bar-fill"
                    style={{ width: `${(((edDept?.total ?? 20) - (edDept?.available ?? 6)) / (edDept?.total ?? 20)) * 100}%`, background: '#16A34A' }}
                  />
                </div>
              </div>
              <div className="bed-bar-item">
                <div className="bed-bar-label">
                  <span>ICU</span>
                  <span>{icuDept?.available ?? 6} free / {icuDept?.total ?? 15}</span>
                </div>
                <div className="bed-bar-track">
                  <div
                    className="bed-bar-fill"
                    style={{ width: `${(((icuDept?.total ?? 15) - (icuDept?.available ?? 6)) / (icuDept?.total ?? 15)) * 100}%`, background: '#2563EB' }}
                  />
                </div>
              </div>
              <div className="bed-bar-item">
                <div className="bed-bar-label">
                  <span>General Ward</span>
                  <span>{generalAvail} free / {generalTotal}</span>
                </div>
                <div className="bed-bar-track">
                  <div
                    className="bed-bar-fill"
                    style={{ width: `${((generalTotal - generalAvail) / generalTotal) * 100}%`, background: '#F59E0B' }}
                  />
                </div>
              </div>
              <div className="bed-bar-item">
                <div className="bed-bar-label">
                  <span>Cardiac Care</span>
                  <span>{cardiacDept?.available ?? 4} free / {cardiacDept?.total ?? 12}</span>
                </div>
                <div className="bed-bar-track">
                  <div
                    className="bed-bar-fill"
                    style={{ width: `${(((cardiacDept?.total ?? 12) - (cardiacDept?.available ?? 4)) / (cardiacDept?.total ?? 12)) * 100}%`, background: '#7C3AED' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      {activeModal === 'ambulance' && (
        <div className="sertos-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Radio size={18} color="#DC2626" /> Ambulance Radio Dispatch</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCallAmbulance}>
              <div className="sertos-modal-body">
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Select Ambulance Unit</label>
                  <select
                    className="sertos-form-control"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ambulance} — {c.id} ({c.condition}, ETA {c.eta})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Dispatch Instruction / Bay Note</label>
                  <textarea
                    rows={3}
                    className="sertos-form-control"
                    value={radioMessage}
                    onChange={(e) => setRadioMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="sertos-btn sertos-btn-primary">
                  <Phone size={15} /> Transmit Radio Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'reserve' && (
        <div className="sertos-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><BedDouble size={18} color="#087F5B" /> Reserve Emergency Bed</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleReserveBed}>
              <div className="sertos-modal-body">
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Assign to Incoming Case</label>
                  <select
                    className="sertos-form-control"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} — {c.condition} ({c.priority})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Available Emergency Beds ({availableEdBeds.length} open)</label>
                  <select
                    className="sertos-form-control"
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    disabled={availableEdBeds.length === 0}
                  >
                    {availableEdBeds.length === 0 ? (
                      <option value="">No available ED beds</option>
                    ) : (
                      availableEdBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id} — {b.note}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="sertos-btn sertos-btn-primary" disabled={availableEdBeds.length === 0}>
                  Confirm Bed Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'alertTeam' && (
        <div className="sertos-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Users size={18} color="#2563EB" /> Page Emergency Team</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAlertTeam}>
              <div className="sertos-modal-body">
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Target Response Team</label>
                  <select
                    className="sertos-form-control"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.lead} · {t.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Alert Message</label>
                  <textarea
                    rows={3}
                    className="sertos-form-control"
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="sertos-btn sertos-btn-primary">Send Team Page</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'codeBlue' && (
        <div className="sertos-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title">
                <Shield size={18} color="#DC2626" /> {codeBlueActive ? 'Stand Down Code Blue' : 'Activate Code Blue'}
              </h3>
              <button type="button" className="sertos-modal-close" onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              {codeBlueActive ? (
                <p style={{ fontSize: 14, color: '#475569' }}>
                  Code Blue is currently active. Confirm stand-down once the resuscitation team has stabilized or concluded response.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#64748B' }}>
                    Triggering Code Blue broadcasts an immediate high-priority cardiac/respiratory arrest alert across all active hospital terminals.
                  </p>
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Location / Bay</label>
                    <input
                      type="text"
                      className="sertos-form-control"
                      value={codeBlueLocation}
                      onChange={(e) => setCodeBlueLocation(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button
                type="button"
                className={codeBlueActive ? 'sertos-btn sertos-btn-primary' : 'sertos-btn sertos-btn-danger'}
                onClick={() => {
                  toggleCodeBlue(codeBlueLocation)
                  setActiveModal(null)
                }}
              >
                {codeBlueActive ? 'Confirm Stand Down' : 'Broadcast Code Blue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'map' && (
        <div className="sertos-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sertos-modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Navigation size={18} color="#087F5B" /> Live SERTOS Ambulance Telemetry & Tracking</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              <div className="map-modal-units">
                {cases.slice(0, 3).map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`map-unit-pill ${trackedCase?.id === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedCaseId(c.id)}
                  >
                    <strong>{c.ambulance}</strong> · {c.id} ({c.eta})
                  </button>
                ))}
              </div>
              {trackedCase && (
                <div className="map-telemetry-bar">
                  <div><span>Case:</span> <strong>{trackedCase.id} — {trackedCase.condition}</strong></div>
                  <div><span>Location:</span> <strong>{trackedCase.location}</strong></div>
                  <div><span>Crew:</span> <strong>{trackedCase.crew}</strong></div>
                  <div><span>ETA:</span> <strong style={{ color: '#DC2626' }}>{trackedCase.eta}</strong></div>
                </div>
              )}
              <div className="map-content">
                <svg viewBox="0 0 680 260" width="100%" height="260">
                  <defs>
                    <pattern id="modalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5EAF0" strokeWidth="0.6" />
                    </pattern>
                  </defs>
                  <rect width="680" height="260" fill="#F8FAFB" rx="8" />
                  <rect width="680" height="260" fill="url(#modalGrid)" />
                  <path d="M 0 130 L 680 130" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="10,5" />
                  <path d="M 340 0 L 340 260" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="10,5" />
                  <path d="M 90 195 C 210 175, 310 120, 490 80" stroke="#087F5B" strokeWidth="3.5" fill="none" strokeDasharray="6,4">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                  <circle cx="90" cy="195" r="13" fill="#DC2626" stroke="#fff" strokeWidth="2.5" />
                  <text x="90" y="199" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">A</text>
                  <text x="90" y="220" textAnchor="middle" fill="#17212B" fontSize="11" fontWeight="600">{trackedCase?.ambulance || 'AMB-12'}</text>
                  <rect x="475" y="62" width="34" height="34" rx="7" fill="#087F5B" stroke="#fff" strokeWidth="2.5" />
                  <text x="492" y="84" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">H</text>
                  <text x="492" y="112" textAnchor="middle" fill="#087F5B" fontSize="11" fontWeight="700">SERTOS Central Hospital</text>
                  <rect x="260" y="108" width="110" height="30" rx="15" fill="#087F5B" />
                  <text x="315" y="127" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">ETA: {trackedCase?.eta || '4 min'}</text>
                </svg>
              </div>
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
              <Link to={`/incoming-cases?case=${trackedCase?.id || 'SRT-1047'}`} className="sertos-btn sertos-btn-primary">
                Open Full Case File <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
