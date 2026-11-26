import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Truck,
  User,
  Activity,
  ChevronRight,
  Bell,
  Bed,
  Radio,
  Heart,
  Wind,
  Brain,
  ShieldAlert,
  Zap,
  X,
  CheckCircle,
  MapPin
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import GoogleAmbulanceMap from '../components/GoogleAmbulanceMap'
import './IncomingCases.css'

function getConditionIcon(type) {
  switch (type) {
    case 'cardiac': return Heart
    case 'trauma': return AlertTriangle
    case 'respiratory': return Wind
    case 'stroke': return Brain
    case 'allergy': return ShieldAlert
    default: return Activity
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case 'Critical': return 'priority-critical'
    case 'High': return 'priority-high'
    case 'Medium': return 'priority-medium'
    case 'Low': return 'priority-low'
    default: return ''
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Arriving': return 'status-arriving'
    case 'En Route': return 'status-enroute'
    case 'Dispatched': return 'status-dispatched'
    default: return ''
  }
}

function getActivityIcon(type) {
  switch (type) {
    case 'critical': return <AlertTriangle size={14} />
    case 'warning': return <Zap size={14} />
    case 'success': return <CheckCircle size={14} />
    case 'info': return <Truck size={14} />
    default: return <Bell size={14} />
  }
}

export default function IncomingCases() {
  const {
    cases,
    edBeds,
    alerts,
    metrics,
    prepareBayForCase,
    admitIncomingCase,
  } = useHospital()

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [detailCaseId, setDetailCaseId] = useState(null)
  const [prepareBayCaseId, setPrepareBayCaseId] = useState(null)
  const [chosenBedId, setChosenBedId] = useState('')

  const availableEdBeds = edBeds.filter((b) => b.status === 'available')

  useEffect(() => {
    const requestedCase = searchParams.get('case')
    if (requestedCase && cases.some((c) => c.id === requestedCase)) {
      setDetailCaseId(requestedCase)
    }
  }, [searchParams, cases])

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ambulance.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  const activeDetailCase = cases.find((c) => c.id === detailCaseId)
  const activePrepareCase = cases.find((c) => c.id === prepareBayCaseId)

  const openPrepareModal = (caseId) => {
    setPrepareBayCaseId(caseId)
    if (availableEdBeds.length > 0) {
      setChosenBedId(availableEdBeds[0].id)
    } else {
      setChosenBedId('')
    }
  }

  const handleConfirmBay = (e) => {
    e.preventDefault()
    if (prepareBayCaseId && chosenBedId) {
      prepareBayForCase(prepareBayCaseId, chosenBedId)
      setPrepareBayCaseId(null)
    }
  }

  const closeDetailModal = () => {
    setDetailCaseId(null)
    if (searchParams.has('case')) {
      setSearchParams({})
    }
  }

  return (
    <div className="incoming-cases-page">
      <div className="incoming-cases-header">
        <div className="header-title-section">
          <h2 className="page-title">Incoming Emergency Cases</h2>
          <p className="page-subtitle">Real-time tracking of ambulance cases en route to the facility</p>
        </div>
        <div className="header-filter-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search cases by ID, condition, or unit..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown-wrapper">
            <Filter size={16} className="filter-icon-label" />
            <select
              className="filter-dropdown"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="filter-dropdown-wrapper">
            <select
              className="filter-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="En Route">En Route</option>
              <option value="Arriving">Arriving</option>
              <option value="Dispatched">Dispatched</option>
            </select>
          </div>
        </div>
      </div>

      <div className="incoming-cases-content">
        <div className="cases-main">
          <div className="cases-list-header">
            <h3 className="section-title">Active Cases</h3>
            <span className="cases-count">{filteredCases.length} cases</span>
          </div>

          {filteredCases.length === 0 ? (
            <div className="empty-cases-box">
              <p>No incoming cases match your current search or filters.</p>
            </div>
          ) : (
            <div className="cases-list">
              {filteredCases.map((caseItem) => {
                const ConditionIcon = getConditionIcon(caseItem.conditionType)
                return (
                  <div key={caseItem.id} className={`case-card ${getPriorityClass(caseItem.priority)}`}>
                    <div className="case-card-top">
                      <div className="case-id-row">
                        <span className="case-id">{caseItem.id}</span>
                        <span className={`priority-badge ${getPriorityClass(caseItem.priority)}`}>
                          {caseItem.priority}
                        </span>
                        <span className={`status-badge ${getStatusClass(caseItem.status)}`}>
                          <span className="status-dot"></span>
                          {caseItem.status}
                        </span>
                        {caseItem.assignedBay && (
                          <span className="bay-assigned-badge">
                            <CheckCircle size={12} /> Bay {caseItem.assignedBay} Ready
                          </span>
                        )}
                      </div>
                      <div className="source-badge">
                        <Radio size={12} />
                        {caseItem.source}
                      </div>
                    </div>

                    <div className="case-card-body">
                      <div className="case-info-left">
                        <div className="condition-row">
                          <ConditionIcon size={18} className="condition-icon" />
                          <span className="condition-name">{caseItem.condition}</span>
                        </div>
                        <div className="patient-info">
                          <User size={14} />
                          <span>{caseItem.patient.age} y/o {caseItem.patient.gender}</span>
                          <span className="patient-desc">— {caseItem.patient.description}</span>
                        </div>
                        <div className="case-meta-row">
                          <div className="meta-item">
                            <Truck size={14} />
                            <span>Unit {caseItem.ambulance}</span>
                          </div>
                          <div className="meta-item">
                            <Clock size={14} />
                            <span className="eta-value">ETA: {caseItem.eta}</span>
                          </div>
                        </div>
                      </div>

                      <div className="case-vitals">
                        <span className="vitals-label">Vitals</span>
                        <div className="vitals-grid">
                          <div className="vital-item">
                            <span className="vital-key">BP</span>
                            <span className="vital-val">{caseItem.vitals.bp}</span>
                          </div>
                          <div className="vital-item">
                            <span className="vital-key">HR</span>
                            <span className="vital-val">{caseItem.vitals.hr}</span>
                          </div>
                          <div className="vital-item">
                            <span className="vital-key">SpO2</span>
                            <span className="vital-val">{caseItem.vitals.spo2}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="case-card-actions">
                      <button
                        type="button"
                        className="btn-prepare-bay"
                        onClick={() => openPrepareModal(caseItem.id)}
                      >
                        <Bed size={15} />
                        {caseItem.assignedBay ? `Change Bay (${caseItem.assignedBay})` : 'Prepare Bay'}
                      </button>
                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={() => setDetailCaseId(caseItem.id)}
                      >
                        View Details
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="cases-sidebar">
          <div className="sidebar-card quick-stats-card">
            <h3 className="sidebar-card-title">Quick Stats</h3>
            <div className="quick-stats-grid">
              <div className="quick-stat">
                <div className="quick-stat-value">{cases.length}</div>
                <div className="quick-stat-label">Total Active</div>
              </div>
              <div className="quick-stat critical">
                <div className="quick-stat-value">
                  {cases.filter((c) => c.priority === 'Critical').length}
                </div>
                <div className="quick-stat-label">Critical</div>
              </div>
              <div className="quick-stat arriving">
                <div className="quick-stat-value">
                  {cases.filter((c) => c.status === 'Arriving').length}
                </div>
                <div className="quick-stat-label">Arriving Soon</div>
              </div>
              <div className="quick-stat beds">
                <div className="quick-stat-value">{metrics.totalBedsAvailable}</div>
                <div className="quick-stat-label">Beds Ready</div>
              </div>
            </div>
          </div>

          <div className="sidebar-card recent-activity-card">
            <h3 className="sidebar-card-title">Recent Activity</h3>
            <div className="activity-feed">
              {alerts.slice(0, 5).map((item) => (
                <div key={item.id} className={`activity-item activity-${item.type}`}>
                  <div className="activity-icon-wrap">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{item.text}</p>
                    <span className="activity-time">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prepare Bay Modal */}
      {activePrepareCase && (
        <div className="sertos-modal-backdrop" onClick={() => setPrepareBayCaseId(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title">
                <Bed size={18} color="#087F5B" /> Prepare Bay for {activePrepareCase.id}
              </h3>
              <button type="button" className="sertos-modal-close" onClick={() => setPrepareBayCaseId(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmBay}>
              <div className="sertos-modal-body">
                <div className="case-modal-summary">
                  <strong>{activePrepareCase.condition}</strong> · {activePrepareCase.patient.age} y/o {activePrepareCase.patient.gender} · ETA {activePrepareCase.eta}
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Select Available Emergency Bed ({availableEdBeds.length} ready)</label>
                  <select
                    className="sertos-form-control"
                    value={chosenBedId}
                    onChange={(e) => setChosenBedId(e.target.value)}
                    required
                  >
                    {availableEdBeds.length === 0 ? (
                      <option value="">No available ED beds</option>
                    ) : (
                      availableEdBeds.map((bed) => (
                        <option key={bed.id} value={bed.id}>
                          {bed.id} — {bed.note}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setPrepareBayCaseId(null)}>
                  Cancel
                </button>
                <button type="submit" className="sertos-btn sertos-btn-primary" disabled={!chosenBedId}>
                  Reserve & Mark Bay Ready
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Full Details Modal */}
      {activeDetailCase && (
        <div className="sertos-modal-backdrop" onClick={closeDetailModal}>
          <div className="sertos-modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title">
                <AlertTriangle size={18} color="#DC2626" /> Emergency Case {activeDetailCase.id} — {activeDetailCase.condition}
              </h3>
              <button type="button" className="sertos-modal-close" onClick={closeDetailModal}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              <div className="case-detail-grid">
                <div className="case-detail-block">
                  <span className="detail-k">Patient Profile</span>
                  <span className="detail-v">{activeDetailCase.patient.age} y/o {activeDetailCase.patient.gender} · Blood {activeDetailCase.patient.bloodType}</span>
                  <span className="detail-sub">Allergies: {activeDetailCase.patient.allergies}</span>
                </div>
                <div className="case-detail-block">
                  <span className="detail-k">Ambulance Unit & ETA</span>
                  <span className="detail-v">{activeDetailCase.ambulance} · {activeDetailCase.status} (ETA {activeDetailCase.eta})</span>
                  <span className="detail-sub">{activeDetailCase.crew}</span>
                </div>
              </div>

              <div className="case-detail-location">
                <MapPin size={15} color="#087F5B" />
                <span>{activeDetailCase.location}</span>
              </div>

              <GoogleAmbulanceMap
                cases={[activeDetailCase]}
                selectedCaseId={activeDetailCase.id}
                height={210}
                showControls={false}
                singleCaseMode={true}
              />

              <div className="case-detail-vitals-bar">
                <div><span>BP</span><strong>{activeDetailCase.vitals.bp} mmHg</strong></div>
                <div><span>Heart Rate</span><strong>{activeDetailCase.vitals.hr} bpm</strong></div>
                <div><span>SpO2</span><strong>{activeDetailCase.vitals.spo2}</strong></div>
                <div><span>Temp</span><strong>{activeDetailCase.vitals.temp}</strong></div>
              </div>

              <div className="case-detail-notes">
                <h4>Paramedic Field Notes</h4>
                <p>{activeDetailCase.notes}</p>
              </div>
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-secondary" onClick={closeDetailModal}>
                Close
              </button>
              {!activeDetailCase.assignedBay && (
                <button
                  type="button"
                  className="sertos-btn sertos-btn-secondary"
                  onClick={() => {
                    const id = activeDetailCase.id
                    closeDetailModal()
                    openPrepareModal(id)
                  }}
                >
                  Prepare Bay
                </button>
              )}
              <button
                type="button"
                className="sertos-btn sertos-btn-primary"
                onClick={() => {
                  const id = activeDetailCase.id
                  closeDetailModal()
                  admitIncomingCase(id)
                  navigate('/patient-records')
                }}
              >
                <CheckCircle size={15} /> Admit Patient to Hospital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
