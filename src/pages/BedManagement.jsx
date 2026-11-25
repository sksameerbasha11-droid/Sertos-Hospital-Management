import { useState } from 'react'
import {
  Bed,
  Activity,
  Wrench,
  CheckCircle2,
  LayoutGrid,
  Stethoscope,
  Heart,
  Building2,
  Baby,
  Cross,
  Users,
  Settings,
  ChevronRight,
  X,
  Plus,
  Minus
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './BedManagement.css'

const deptIcons = {
  ed: Activity,
  icu: Stethoscope,
  cardiac: Heart,
  'ward-a': Building2,
  'ward-b': Building2,
  peds: Baby,
  maternity: Cross,
}

function getBedStatusClass(status) {
  switch (status) {
    case 'available': return 'bed-available'
    case 'occupied': return 'bed-occupied'
    case 'reserved': return 'bed-reserved'
    case 'maintenance': return 'bed-maintenance'
    default: return ''
  }
}

function getBedStatusLabel(status) {
  switch (status) {
    case 'available': return 'Available'
    case 'occupied': return 'Occupied'
    case 'reserved': return 'Reserved'
    case 'maintenance': return 'Maintenance'
    default: return ''
  }
}

export default function BedManagement() {
  const {
    departments,
    edBeds,
    metrics,
    updateBedStatus,
    adjustDepartmentBeds,
    showToast,
  } = useHospital()

  const [bedFilter, setBedFilter] = useState('all')
  const [selectedBedId, setSelectedBedId] = useState(null)
  const [editStatus, setEditStatus] = useState('available')
  const [editPatientName, setEditPatientName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [managedDeptId, setManagedDeptId] = useState(null)

  const topStats = [
    { label: 'Total Beds', value: metrics.totalBeds, icon: Bed, color: 'stat-total' },
    { label: 'Available', value: metrics.totalBedsAvailable, icon: CheckCircle2, color: 'stat-available' },
    { label: 'Occupied', value: metrics.totalBedsOccupied, icon: Users, color: 'stat-occupied' },
    { label: 'Under Maintenance', value: metrics.totalBedsMaintenance, icon: Wrench, color: 'stat-maintenance' },
  ]

  const filteredBeds = bedFilter === 'all' ? edBeds : edBeds.filter((b) => b.status === bedFilter)
  const selectedBed = edBeds.find((b) => b.id === selectedBedId)
  const managedDept = departments.find((d) => d.id === managedDeptId)

  const openBedModal = (bed) => {
    setSelectedBedId(bed.id)
    setEditStatus(bed.status)
    setEditPatientName(bed.patientName || '')
    setEditNote(bed.note || '')
  }

  const handleSaveBed = (e) => {
    e.preventDefault()
    if (!selectedBed) return
    updateBedStatus(selectedBed.id, editStatus, editPatientName || null, editNote || null)
    setSelectedBedId(null)
  }

  return (
    <div className="bed-management-page">
      <div className="bed-management-header">
        <div>
          <h2 className="page-title">Bed Management</h2>
          <p className="page-subtitle">Monitor and manage hospital bed availability across all departments</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="bed-stats-row">
        {topStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`bed-stat-card ${stat.color}`}>
              <div className="bed-stat-icon-wrap">
                <Icon size={22} />
              </div>
              <div className="bed-stat-info">
                <span className="bed-stat-value">{stat.value}</span>
                <span className="bed-stat-label">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Department Grid */}
      <div className="departments-section">
        <div className="section-header">
          <h3 className="section-title">
            <LayoutGrid size={20} />
            Department Overview
          </h3>
        </div>
        <div className="departments-grid">
          {departments.map((dept) => {
            const Icon = deptIcons[dept.id] || Building2
            const occupiedPct = (dept.occupied / dept.total) * 100
            const availablePct = (dept.available / dept.total) * 100
            const maintenancePct = (dept.maintenance / dept.total) * 100
            return (
              <div key={dept.id} className="department-card">
                <div className="department-card-header">
                  <div className="department-name-row">
                    <div className="department-icon-wrap">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="department-name">{dept.name}</h4>
                      <span className="department-total">{dept.total} beds total</span>
                    </div>
                  </div>
                </div>

                <div className="department-bar-container">
                  <div className="department-bar">
                    <div
                      className="bar-segment bar-occupied"
                      style={{ width: `${occupiedPct}%` }}
                      title={`Occupied: ${dept.occupied}`}
                    ></div>
                    <div
                      className="bar-segment bar-available"
                      style={{ width: `${availablePct}%` }}
                      title={`Available: ${dept.available}`}
                    ></div>
                    {maintenancePct > 0 && (
                      <div
                        className="bar-segment bar-maintenance"
                        style={{ width: `${maintenancePct}%` }}
                        title={`Maintenance: ${dept.maintenance}`}
                      ></div>
                    )}
                  </div>
                </div>

                <div className="department-counts">
                  <div className="dept-count available-count">
                    <span className="dept-count-dot available-dot"></span>
                    <span className="dept-count-label">Available</span>
                    <span className="dept-count-value">{dept.available}</span>
                  </div>
                  <div className="dept-count occupied-count">
                    <span className="dept-count-dot occupied-dot"></span>
                    <span className="dept-count-label">Occupied</span>
                    <span className="dept-count-value">{dept.occupied}</span>
                  </div>
                  <div className="dept-count maintenance-count">
                    <span className="dept-count-dot maintenance-dot"></span>
                    <span className="dept-count-label">Maintenance</span>
                    <span className="dept-count-value">{dept.maintenance}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-manage-dept"
                  onClick={() => setManagedDeptId(dept.id)}
                >
                  <Settings size={14} />
                  Manage
                  <ChevronRight size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bed Map Section */}
      <div className="bed-map-section">
        <div className="section-header">
          <h3 className="section-title">
            <LayoutGrid size={20} />
            Bed Map — Emergency Department (Click any bed to manage)
          </h3>
          <div className="bed-map-controls">
            <div className="bed-filter-pills">
              {['all', 'available', 'occupied', 'reserved', 'maintenance'].map((f) => (
                <button
                  type="button"
                  key={f}
                  className={`bed-filter-pill ${bedFilter === f ? 'active' : ''}`}
                  onClick={() => setBedFilter(f)}
                >
                  {f === 'all' ? 'All' : getBedStatusLabel(f)}
                </button>
              ))}
            </div>
            <div className="bed-legend">
              <div className="legend-item">
                <span className="legend-swatch legend-available"></span>
                Available
              </div>
              <div className="legend-item">
                <span className="legend-swatch legend-occupied"></span>
                Occupied
              </div>
              <div className="legend-item">
                <span className="legend-swatch legend-reserved"></span>
                Reserved
              </div>
              <div className="legend-item">
                <span className="legend-swatch legend-maintenance"></span>
                Maintenance
              </div>
            </div>
          </div>
        </div>
        <div className="bed-map-grid">
          {filteredBeds.map((bed) => (
            <button
              type="button"
              key={bed.id}
              className={`bed-cell ${getBedStatusClass(bed.status)}`}
              title={`${bed.id} — ${getBedStatusLabel(bed.status)}${bed.patientName ? ` (${bed.patientName})` : ''}`}
              onClick={() => openBedModal(bed)}
            >
              <span className="bed-cell-number">{bed.id}</span>
              <span className="bed-cell-status">{getBedStatusLabel(bed.status)}</span>
              {bed.patientName && (
                <span className="bed-cell-patient">{bed.patientName}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Edit Modal */}
      {selectedBed && (
        <div className="sertos-modal-backdrop" onClick={() => setSelectedBedId(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Bed size={18} color="#087F5B" /> Manage Bed {selectedBed.id}</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setSelectedBedId(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBed}>
              <div className="sertos-modal-body">
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Bed Status</label>
                  <select
                    className="sertos-form-control"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved for Incoming</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                {(editStatus === 'occupied' || editStatus === 'reserved') && (
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Patient / Case Assignment</label>
                    <input
                      type="text"
                      className="sertos-form-control"
                      placeholder="Patient name or Incident ID..."
                      value={editPatientName}
                      onChange={(e) => setEditPatientName(e.target.value)}
                    />
                  </div>
                )}
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Bay Notes</label>
                  <input
                    type="text"
                    className="sertos-form-control"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setSelectedBedId(null)}>
                  Cancel
                </button>
                <button type="submit" className="sertos-btn sertos-btn-primary">
                  Update Bed Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Department Modal */}
      {managedDept && (
        <div className="sertos-modal-backdrop" onClick={() => setManagedDeptId(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Settings size={18} color="#087F5B" /> {managedDept.name}</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setManagedDeptId(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              <div className="dept-modal-stats">
                <div><span>Total Capacity</span><strong>{managedDept.total}</strong></div>
                <div><span>Available</span><strong style={{ color: '#16A34A' }}>{managedDept.available}</strong></div>
                <div><span>Occupied</span><strong style={{ color: '#2563EB' }}>{managedDept.occupied}</strong></div>
                <div><span>Maintenance</span><strong style={{ color: '#D97706' }}>{managedDept.maintenance}</strong></div>
              </div>
              {managedDept.id === 'ed' ? (
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  Use the interactive Emergency Department Bed Map below (B-101 to B-120) to manage individual ED bays.
                </p>
              ) : (
                <div className="dept-modal-adjust">
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#17212B' }}>Quick Bed Turnover</span>
                  <div className="dept-modal-btns">
                    <button
                      type="button"
                      className="sertos-btn sertos-btn-secondary"
                      onClick={() => {
                        adjustDepartmentBeds(managedDept.id, -1)
                        showToast(`Admitted 1 bed in ${managedDept.name}`, 'info')
                      }}
                      disabled={managedDept.available === 0}
                    >
                      <Minus size={14} /> Assign Bed (-1 Avail)
                    </button>
                    <button
                      type="button"
                      className="sertos-btn sertos-btn-primary"
                      onClick={() => {
                        adjustDepartmentBeds(managedDept.id, 1)
                        showToast(`Released 1 bed in ${managedDept.name}`)
                      }}
                      disabled={managedDept.occupied === 0}
                    >
                      <Plus size={14} /> Release Bed (+1 Avail)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-primary" onClick={() => setManagedDeptId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
