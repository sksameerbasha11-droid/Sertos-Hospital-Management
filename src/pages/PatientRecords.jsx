import { useState } from 'react'
import {
  Search,
  Plus,
  Eye,
  Edit,
  Heart,
  Activity,
  Thermometer,
  Wind,
  Pill,
  Clock,
  FileText,
  Filter,
  CircleDot,
  ClipboardList,
  X
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './PatientRecords.css'

const statusClass = (status) => {
  switch (status) {
    case 'Active': return 'status-active'
    case 'Discharged': return 'status-discharged'
    case 'Critical': return 'status-critical'
    case 'Stable': return 'status-stable'
    case 'Under Observation': return 'status-observation'
    default: return ''
  }
}

export default function PatientRecords() {
  const { patients, addPatient, updatePatient } = useHospital()
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 'PAT-2001')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    department: 'Emergency',
    condition: '',
    status: 'Active',
    doctor: 'Dr. Sarah Chen',
    notes: '',
  })

  const filters = ['All', 'Active', 'Critical', 'Stable', 'Under Observation', 'Discharged']

  const filteredPatients = patients.filter((p) => {
    const matchesFilter = activeFilter === 'All' || p.status === activeFilter
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const detailPatient = patients.find((p) => p.id === selectedPatientId) || filteredPatients[0] || patients[0]

  const vitals = detailPatient
    ? [
        { label: 'Heart Rate', value: detailPatient.vitals.hr, icon: Heart, color: '#DC2626' },
        { label: 'Blood Pressure', value: detailPatient.vitals.bp, icon: Activity, color: '#087F5B' },
        { label: 'SpO2', value: detailPatient.vitals.spo2, icon: Wind, color: '#2563EB' },
        { label: 'Temperature', value: detailPatient.vitals.temp, icon: Thermometer, color: '#F59E0B' },
      ]
    : []

  const handleAddSubmit = (e) => {
    e.preventDefault()
    const created = addPatient(newPatientForm)
    setSelectedPatientId(created.id)
    setShowAddModal(false)
    setNewPatientForm({
      name: '',
      age: '',
      gender: 'Male',
      department: 'Emergency',
      condition: '',
      status: 'Active',
      doctor: 'Dr. Sarah Chen',
      notes: '',
    })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editingPatient) return
    updatePatient(editingPatient.id, {
      status: editingPatient.status,
      department: editingPatient.department,
      doctor: editingPatient.doctor,
      notes: editingPatient.notes,
    })
    setEditingPatient(null)
  }

  return (
    <div className="patient-records-page">
      <div className="patient-records-header">
        <div className="header-title-row">
          <div>
            <h2 className="page-title">Patient Records</h2>
            <p className="page-subtitle">Emergency admissions and patient management</p>
          </div>
          <button
            type="button"
            className="add-patient-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Add Patient
          </button>
        </div>
        <div className="header-controls">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search patients by name, ID, department, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <Filter size={16} />
            {filters.map((f) => (
              <button
                type="button"
                key={f}
                className={`filter-btn ${activeFilter === f ? 'filter-btn-active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="patient-records-content">
        <div className="patient-table-section">
          <div className="card">
            <div className="card-header">
              <ClipboardList size={20} />
              <h3>Patient List</h3>
              <span className="record-count">{filteredPatients.length} records</span>
            </div>
            <div className="table-wrapper">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age/Gender</th>
                    <th>Admission Date</th>
                    <th>Department</th>
                    <th>Condition / Diagnosis</th>
                    <th>Status</th>
                    <th>Attending Doctor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className={detailPatient?.id === patient.id ? 'selected-row' : ''}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <td className="patient-id-cell">{patient.id}</td>
                      <td className="patient-name-cell">
                        <div className="patient-avatar">
                          {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        {patient.name}
                      </td>
                      <td>{patient.age} / {patient.gender}</td>
                      <td>{new Date(patient.admissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>{patient.department}</td>
                      <td className="condition-cell">{patient.condition}</td>
                      <td>
                        <span className={`status-badge ${statusClass(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td>{patient.doctor}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="action-btn view-btn"
                            title="View Details"
                            onClick={() => setSelectedPatientId(patient.id)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Record"
                            onClick={() => setEditingPatient({ ...patient })}
                          >
                            <Edit size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {detailPatient && (
          <div className="patient-detail-panel">
            <div className="card">
              <div className="detail-header">
                <div className="detail-avatar">
                  {detailPatient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="detail-info">
                  <h3>{detailPatient.name}</h3>
                  <p>{detailPatient.id} &middot; {detailPatient.age}y {detailPatient.gender} &middot; Bed {detailPatient.bed}</p>
                  <span className={`status-badge ${statusClass(detailPatient.status)}`}>
                    {detailPatient.status}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  <Activity size={16} />
                  Vitals
                </h4>
                <div className="vitals-grid">
                  {vitals.map((v) => (
                    <div className="vital-card" key={v.label}>
                      <div className="vital-icon" style={{ backgroundColor: `${v.color}15`, color: v.color }}>
                        <v.icon size={18} />
                      </div>
                      <div className="vital-info">
                        <span className="vital-label">{v.label}</span>
                        <span className="vital-value">{v.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  <Pill size={16} />
                  Current Medications
                </h4>
                <ul className="medication-list">
                  {detailPatient.medications.map((med, i) => (
                    <li className="medication-item" key={i}>
                      <div className="med-dot"></div>
                      <div className="med-info">
                        <span className="med-name">{med.name}</span>
                        <span className="med-schedule">{med.schedule} &middot; {med.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  <FileText size={16} />
                  Notes
                </h4>
                <div className="notes-box">{detailPatient.notes}</div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  <Clock size={16} />
                  Timeline
                </h4>
                <div className="timeline">
                  {detailPatient.timeline.map((item, i) => (
                    <div className="timeline-item" key={i}>
                      <div className="timeline-marker">
                        <CircleDot size={14} />
                      </div>
                      <div className="timeline-content">
                        <span className="timeline-time">{item.time}</span>
                        <span className="timeline-event">{item.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="sertos-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Plus size={18} color="#087F5B" /> Admit New Patient</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="sertos-modal-body">
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Full Name</label>
                  <input
                    type="text"
                    className="sertos-form-control"
                    placeholder="e.g. Jordan Miller"
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="sertos-form-row">
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Age</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      className="sertos-form-control"
                      placeholder="42"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm((p) => ({ ...p, age: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Gender</label>
                    <select
                      className="sertos-form-control"
                      value={newPatientForm.gender}
                      onChange={(e) => setNewPatientForm((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="sertos-form-row">
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Department</label>
                    <select
                      className="sertos-form-control"
                      value={newPatientForm.department}
                      onChange={(e) => setNewPatientForm((p) => ({ ...p, department: e.target.value }))}
                    >
                      <option value="Emergency">Emergency</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                    </select>
                  </div>
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Status</label>
                    <select
                      className="sertos-form-control"
                      value={newPatientForm.status}
                      onChange={(e) => setNewPatientForm((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Critical">Critical</option>
                      <option value="Stable">Stable</option>
                      <option value="Under Observation">Under Observation</option>
                    </select>
                  </div>
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Condition / Diagnosis</label>
                  <input
                    type="text"
                    className="sertos-form-control"
                    placeholder="e.g. Suspected Appendicitis"
                    value={newPatientForm.condition}
                    onChange={(e) => setNewPatientForm((p) => ({ ...p, condition: e.target.value }))}
                    required
                  />
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Clinical Notes</label>
                  <textarea
                    rows={2}
                    className="sertos-form-control"
                    placeholder="Initial triage observations..."
                    value={newPatientForm.notes}
                    onChange={(e) => setNewPatientForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="sertos-btn sertos-btn-primary">Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="sertos-modal-backdrop" onClick={() => setEditingPatient(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Edit size={18} color="#087F5B" /> Update {editingPatient.name} ({editingPatient.id})</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setEditingPatient(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="sertos-modal-body">
                <div className="sertos-form-row">
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Status</label>
                    <select
                      className="sertos-form-control"
                      value={editingPatient.status}
                      onChange={(e) => setEditingPatient((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Critical">Critical</option>
                      <option value="Stable">Stable</option>
                      <option value="Under Observation">Under Observation</option>
                      <option value="Discharged">Discharged</option>
                    </select>
                  </div>
                  <div className="sertos-form-group">
                    <label className="sertos-form-label">Department</label>
                    <input
                      type="text"
                      className="sertos-form-control"
                      value={editingPatient.department}
                      onChange={(e) => setEditingPatient((p) => ({ ...p, department: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Attending Doctor</label>
                  <input
                    type="text"
                    className="sertos-form-control"
                    value={editingPatient.doctor}
                    onChange={(e) => setEditingPatient((p) => ({ ...p, doctor: e.target.value }))}
                  />
                </div>
                <div className="sertos-form-group">
                  <label className="sertos-form-label">Clinical Notes</label>
                  <textarea
                    rows={3}
                    className="sertos-form-control"
                    value={editingPatient.notes}
                    onChange={(e) => setEditingPatient((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="sertos-modal-footer">
                <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setEditingPatient(null)}>Cancel</button>
                <button type="submit" className="sertos-btn sertos-btn-primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
