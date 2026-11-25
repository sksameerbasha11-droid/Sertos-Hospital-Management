import { useState } from 'react'
import {
  Users,
  UserCheck,
  Coffee,
  UserX,
  Phone,
  Eye,
  Edit,
  Shield,
  Stethoscope,
  Heart,
  Baby,
  Activity,
  ChevronRight,
  Clock,
  Search,
  X,
  BellRing
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './StaffTeams.css'

const teamIcons = {
  'team-alpha': Shield,
  'team-cardiac': Heart,
  'team-peds': Baby,
  'team-gen': Activity,
}

const getTeamStatusClass = (status) => {
  switch (status) {
    case 'Active': return 'team-status-active'
    case 'On Call': return 'team-status-oncall'
    case 'Off Duty': return 'team-status-offduty'
    default: return ''
  }
}

const getStaffStatusClass = (status) => {
  switch (status) {
    case 'On Duty': return 'staff-status-onduty'
    case 'On Break': return 'staff-status-onbreak'
    case 'Off Duty': return 'staff-status-offduty'
    default: return ''
  }
}

const getShiftClass = (shift) => {
  switch (shift) {
    case 'Day': return 'shift-day'
    case 'Night': return 'shift-night'
    case 'Rotating': return 'shift-rotating'
    default: return ''
  }
}

export default function StaffTeams() {
  const { staff, teams, updateStaffStatus, alertTeam, showToast } = useHospital()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [pageNote, setPageNote] = useState('Report to Emergency Bay 1 immediately.')

  // Roster totals start at 48 total (22 on duty, 8 on break, 18 off duty) + deltas from status changes
  const onDutyList = staff.filter((s) => s.status === 'On Duty').length
  const onBreakList = staff.filter((s) => s.status === 'On Break').length
  const offDutyList = staff.filter((s) => s.status === 'Off Duty').length

  const topStats = [
    { label: 'Total Staff', value: 48, icon: Users, color: '#087F5B', bgColor: '#F0FAF6' },
    { label: 'On Duty', value: 17 + onDutyList, icon: UserCheck, color: '#16A34A', bgColor: '#F0FDF4' },
    { label: 'On Break', value: 6 + onBreakList, icon: Coffee, color: '#F59E0B', bgColor: '#FFFBEB' },
    { label: 'Off Duty', value: 16 + offDutyList, icon: UserX, color: '#64748B', bgColor: '#F1F5F9' },
  ]

  const filteredStaff = staff.filter((s) => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesQuery
  })

  return (
    <div className="staff-teams-page">
      <div className="staff-header">
        <div>
          <h2 className="page-title">Staff & Teams</h2>
          <p className="page-subtitle">Emergency department staff and team management</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="stats-grid">
        {topStats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              <stat.icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Teams */}
      <div className="section">
        <div className="section-header">
          <Users size={20} />
          <h3>Emergency Teams</h3>
        </div>
        <div className="teams-grid">
          {teams.map((team) => {
            const TeamIcon = teamIcons[team.id] || Activity
            return (
              <div className="team-card" key={team.id} style={{ borderLeftColor: team.color }}>
                <div className="team-card-top">
                  <div className="team-icon" style={{ backgroundColor: `${team.color}15`, color: team.color }}>
                    <TeamIcon size={20} />
                  </div>
                  <span className={`team-status-badge ${getTeamStatusClass(team.status)}`}>
                    {team.status}
                  </span>
                </div>
                <h4 className="team-name">{team.name}</h4>
                <div className="team-lead">
                  <div className="team-lead-avatar" style={{ backgroundColor: team.color }}>
                    {team.initials}
                  </div>
                  <div className="team-lead-info">
                    <span className="team-lead-label">Team Lead</span>
                    <span className="team-lead-name">{team.lead}</span>
                  </div>
                </div>
                <div className="team-meta">
                  <div className="team-meta-item">
                    <Users size={14} />
                    <span>{team.members} Members</span>
                  </div>
                  <span className="team-specialty-tag">{team.specialty}</span>
                </div>
                <button
                  type="button"
                  className="view-team-btn"
                  onClick={() => setSelectedTeam(team)}
                >
                  View Team
                  <ChevronRight size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Staff List */}
      <div className="section">
        <div className="section-header">
          <Stethoscope size={20} />
          <h3>Staff Directory</h3>
          <div className="staff-filter-controls">
            <div className="staff-search-wrap">
              <Search size={15} className="staff-search-icon" />
              <input
                type="text"
                className="staff-search-input"
                placeholder="Filter staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="staff-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="On Duty">On Duty</option>
              <option value="On Break">On Break</option>
              <option value="Off Duty">Off Duty</option>
            </select>
            <span className="staff-count">{filteredStaff.length} members</span>
          </div>
        </div>
        <div className="card">
          <div className="table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="staff-name-cell">
                        <div className="staff-avatar">{member.initials}</div>
                        <span className="staff-name">{member.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="role-tag">{member.role}</span>
                    </td>
                    <td>{member.department}</td>
                    <td>
                      <span className={`shift-badge ${getShiftClass(member.shift)}`}>
                        <Clock size={12} />
                        {member.shift}
                      </span>
                    </td>
                    <td>
                      <select
                        aria-label={`Duty status for ${member.name}`}
                        className={`staff-status-dropdown ${getStaffStatusClass(member.status)}`}
                        value={member.status}
                        onChange={(e) => updateStaffStatus(member.id, e.target.value)}
                      >
                        <option value="On Duty">On Duty</option>
                        <option value="On Break">On Break</option>
                        <option value="Off Duty">Off Duty</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="contact-btn"
                        onClick={() => showToast(`Dialing ${member.name} at ${member.phone}...`, 'info')}
                      >
                        <Phone size={14} />
                        <span>{member.phone}</span>
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="action-btn"
                          title="View Profile"
                          onClick={() => setSelectedStaff(member)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Toggle Duty Status"
                          onClick={() => {
                            const order = ['On Duty', 'On Break', 'Off Duty']
                            const next = order[(order.indexOf(member.status) + 1) % order.length]
                            updateStaffStatus(member.id, next)
                          }}
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

      {/* Team Modal */}
      {selectedTeam && (
        <div className="sertos-modal-backdrop" onClick={() => setSelectedTeam(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Users size={18} color={selectedTeam.color} /> {selectedTeam.name}</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setSelectedTeam(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              <div className="team-modal-meta">
                <span>Specialty: <strong>{selectedTeam.specialty}</strong></span>
                <span>Status: <strong>{selectedTeam.status}</strong></span>
              </div>
              <div className="sertos-form-group">
                <label className="sertos-form-label">Active Team Roster ({selectedTeam.roster.length} Personnel)</label>
                <ul className="team-roster-list">
                  {selectedTeam.roster.map((person, idx) => (
                    <li key={idx}>{person}</li>
                  ))}
                </ul>
              </div>
              <div className="sertos-form-group">
                <label className="sertos-form-label">Dispatch Emergency Page</label>
                <input
                  type="text"
                  className="sertos-form-control"
                  value={pageNote}
                  onChange={(e) => setPageNote(e.target.value)}
                />
              </div>
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setSelectedTeam(null)}>Close</button>
              <button
                type="button"
                className="sertos-btn sertos-btn-primary"
                onClick={() => {
                  alertTeam(selectedTeam.name, pageNote)
                  setSelectedTeam(null)
                }}
              >
                <BellRing size={15} /> Page {selectedTeam.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile Modal */}
      {selectedStaff && (
        <div className="sertos-modal-backdrop" onClick={() => setSelectedStaff(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title"><Stethoscope size={18} color="#087F5B" /> {selectedStaff.name}</h3>
              <button type="button" className="sertos-modal-close" onClick={() => setSelectedStaff(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              <div className="staff-profile-grid">
                <div><span>Role</span><strong>{selectedStaff.role}</strong></div>
                <div><span>Department</span><strong>{selectedStaff.department}</strong></div>
                <div><span>Assigned Team</span><strong>{selectedStaff.team}</strong></div>
                <div><span>Shift</span><strong>{selectedStaff.shift}</strong></div>
                <div><span>Phone</span><strong>{selectedStaff.phone}</strong></div>
                <div><span>Duty Status</span><strong>{selectedStaff.status}</strong></div>
              </div>
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setSelectedStaff(null)}>Close</button>
              <button
                type="button"
                className="sertos-btn sertos-btn-primary"
                onClick={() => {
                  showToast(`Paging ${selectedStaff.name} (${selectedStaff.phone})`, 'info')
                  setSelectedStaff(null)
                }}
              >
                <Phone size={15} /> Contact Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
