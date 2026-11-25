import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Bell,
  Users,
  Server,
  Plug,
  Save,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Volume2,
  X,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './Settings.css'

const tabs = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'system', label: 'System', icon: Server },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? 'settings-toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="settings-toggle-knob" />
    </button>
  )
}

export default function Settings() {
  const { settings, saveSettings, resetAllData, showToast } = useHospital()
  const [activeTab, setActiveTab] = useState('general')
  const [confirmAction, setConfirmAction] = useState(null) // 'reset' | 'clear'

  const [generalForm, setGeneralForm] = useState({
    hospitalName: settings.hospitalName,
    hospitalCode: settings.hospitalCode,
    emergencyContact: settings.emergencyContact,
    address: settings.address,
  })

  const [integrations, setIntegrations] = useState({
    sertosTelemetry: true,
    hl7Fhir: true,
    bloodBankSync: true,
    regionalDispatch: true,
  })

  const [userRoles, setUserRoles] = useState([
    { id: 1, name: 'Dr. Arjun Kumar', role: 'Emergency Control', access: 'Full Admin', active: true },
    { id: 2, name: 'Dr. Sarah Chen', role: 'Lead Surgeon', access: 'Clinical Lead', active: true },
    { id: 3, name: 'Dr. James Wilson', role: 'Cardiologist', access: 'Specialist', active: true },
    { id: 4, name: 'Dispatch Unit Ops', role: 'Dispatcher', access: 'Triage Read/Write', active: true },
  ])

  useEffect(() => {
    setGeneralForm({
      hospitalName: settings.hospitalName,
      hospitalCode: settings.hospitalCode,
      emergencyContact: settings.emergencyContact,
      address: settings.address,
    })
  }, [settings])

  const systemInfoItems = [
    { label: 'System Version', value: '2.4.1' },
    { label: 'Last Updated', value: 'Nov 25, 2026' },
    { label: 'Server Status', value: settings.isOnline ? 'Online' : 'Standby', status: settings.isOnline },
    { label: 'Database Status', value: 'Connected', status: true },
    { label: 'API Status', value: 'Operational', status: true },
    { label: 'SERTOS Integration', value: 'Connected', status: true },
  ]

  const handleSaveGeneral = (e) => {
    e.preventDefault()
    saveSettings(generalForm)
  }

  const handleToggleNotification = (field) => {
    const next = {
      ...settings.notifications,
      [field]: !settings.notifications[field],
    }
    saveSettings({ notifications: next })
  }

  return (
    <div className="settings-page">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              type="button"
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <>
            <div className="settings-card">
              <h3 className="settings-card-title">General Settings</h3>
              <form className="settings-form" onSubmit={handleSaveGeneral}>
                <div className="settings-field">
                  <label className="settings-label">Hospital Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={generalForm.hospitalName}
                    onChange={(e) => setGeneralForm((p) => ({ ...p, hospitalName: e.target.value }))}
                    required
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Hospital Code</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={generalForm.hospitalCode}
                    onChange={(e) => setGeneralForm((p) => ({ ...p, hospitalCode: e.target.value }))}
                    required
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Emergency Contact</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={generalForm.emergencyContact}
                    onChange={(e) => setGeneralForm((p) => ({ ...p, emergencyContact: e.target.value }))}
                    required
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Address</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={generalForm.address}
                    onChange={(e) => setGeneralForm((p) => ({ ...p, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="settings-field-actions">
                  <button type="submit" className="settings-save-btn">
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-card settings-danger-card">
              <h3 className="settings-card-title settings-danger-title">
                <AlertTriangle size={18} />
                Danger Zone
              </h3>
              <div className="settings-danger-actions">
                <div className="settings-danger-item">
                  <div className="settings-danger-info">
                    <span className="settings-danger-label">Reset Dashboard</span>
                    <span className="settings-danger-desc">
                      Reset all dashboard configurations, incoming bays, and active state back to defaults.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="settings-danger-btn"
                    onClick={() => setConfirmAction('reset')}
                  >
                    <RotateCcw size={15} />
                    Reset Dashboard
                  </button>
                </div>
                <div className="settings-danger-item">
                  <div className="settings-danger-info">
                    <span className="settings-danger-label">Clear All Session Changes</span>
                    <span className="settings-danger-desc">
                      Clear temporary session logs and restore baseline hospital demonstration records.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="settings-danger-btn"
                    onClick={() => setConfirmAction('clear')}
                  >
                    <Trash2 size={15} />
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-card">
            <h3 className="settings-card-title">Notification Settings</h3>
            <div className="settings-toggles">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Emergency Alerts</span>
                  <span className="settings-toggle-desc">Receive alerts for all incoming critical and high-priority cases</span>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.emergencyAlerts}
                  onChange={() => handleToggleNotification('emergencyAlerts')}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Ambulance Arrival</span>
                  <span className="settings-toggle-desc">Notify when ambulance is within 2 minutes of facility arrival</span>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.ambulanceArrival}
                  onChange={() => handleToggleNotification('ambulanceArrival')}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Bed Status Updates</span>
                  <span className="settings-toggle-desc">Updates on bed availability and bay preparation changes</span>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.bedStatusUpdates}
                  onChange={() => handleToggleNotification('bedStatusUpdates')}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Staff Shift Changes</span>
                  <span className="settings-toggle-desc">Notifications for emergency team shift handoffs</span>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.staffShiftChanges}
                  onChange={() => handleToggleNotification('staffShiftChanges')}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">System Maintenance</span>
                  <span className="settings-toggle-desc">Alerts for scheduled telemetry maintenance windows</span>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.systemMaintenance}
                  onChange={() => handleToggleNotification('systemMaintenance')}
                />
              </div>
            </div>

            <div className="settings-notification-extras">
              <div className="settings-field">
                <label className="settings-label">Alert Sound</label>
                <select
                  className="settings-select"
                  value={settings.alertSound}
                  onChange={(e) => saveSettings({ alertSound: e.target.value })}
                >
                  <option value="critical-alarm">Critical Alarm</option>
                  <option value="soft-chime">Soft Chime</option>
                  <option value="urgent-beep">Urgent Beep</option>
                  <option value="notification">Standard Notification</option>
                </select>
              </div>
              <div className="settings-field">
                <label className="settings-label">
                  <Volume2 size={14} />
                  Alert Volume
                </label>
                <div className="settings-volume-row">
                  <input
                    type="range"
                    className="settings-range"
                    min="0"
                    max="100"
                    value={settings.alertVolume}
                    onChange={(e) => saveSettings({ alertVolume: Number(e.target.value) })}
                  />
                  <span className="settings-volume-value">{settings.alertVolume}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="settings-card">
            <h3 className="settings-card-title"><ShieldCheck size={18} color="#087F5B" /> Operator Access Control</h3>
            <div className="settings-users-list">
              {userRoles.map((u) => (
                <div className="settings-toggle-row" key={u.id}>
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">{u.name}</span>
                    <span className="settings-toggle-desc">{u.role} · {u.access}</span>
                  </div>
                  <ToggleSwitch
                    checked={u.active}
                    onChange={() => {
                      setUserRoles((prev) =>
                        prev.map((item) => (item.id === u.id ? { ...item, active: !item.active } : item))
                      )
                      showToast(`Updated console access for ${u.name}`, 'info')
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="settings-card">
            <div className="settings-card-top-row">
              <h3 className="settings-card-title" style={{ margin: 0 }}>System Information</h3>
              <button
                type="button"
                className="settings-save-btn"
                onClick={() => showToast('All SERTOS services verified: latency 14ms')}
              >
                <RefreshCw size={15} /> Run Diagnostics
              </button>
            </div>
            <div className="settings-system-grid" style={{ marginTop: 20 }}>
              {systemInfoItems.map((item, index) => (
                <div className="settings-system-item" key={index}>
                  <span className="settings-system-label">{item.label}</span>
                  <span className="settings-system-value">
                    {item.status !== undefined && (
                      <span
                        className="settings-status-dot"
                        style={{ backgroundColor: item.status ? '#16A34A' : '#F59E0B' }}
                      />
                    )}
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="settings-card">
            <h3 className="settings-card-title">Connected Hospital & SERTOS Integrations</h3>
            <div className="settings-toggles">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">SERTOS Ambulance Telemetry Stream</span>
                  <span className="settings-toggle-desc">Live GPS coordinates, ETA updates, and field vitals</span>
                </div>
                <ToggleSwitch
                  checked={integrations.sertosTelemetry}
                  onChange={(val) => {
                    setIntegrations((p) => ({ ...p, sertosTelemetry: val }))
                    showToast(`SERTOS Telemetry ${val ? 'enabled' : 'paused'}`, 'info')
                  }}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">EHR / HL7 FHIR Sync</span>
                  <span className="settings-toggle-desc">Bi-directional patient chart synchronization</span>
                </div>
                <ToggleSwitch
                  checked={integrations.hl7Fhir}
                  onChange={(val) => {
                    setIntegrations((p) => ({ ...p, hl7Fhir: val }))
                    showToast(`HL7 FHIR Sync ${val ? 'enabled' : 'paused'}`, 'info')
                  }}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Blood Bank Inventory Link</span>
                  <span className="settings-toggle-desc">Low-supply alerts and trauma crossmatch status</span>
                </div>
                <ToggleSwitch
                  checked={integrations.bloodBankSync}
                  onChange={(val) => {
                    setIntegrations((p) => ({ ...p, bloodBankSync: val }))
                    showToast(`Blood Bank Link ${val ? 'enabled' : 'paused'}`, 'info')
                  }}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Regional EMS Dispatch Gateway</span>
                  <span className="settings-toggle-desc">Receive priority pre-arrival notifications from 911/EMS</span>
                </div>
                <ToggleSwitch
                  checked={integrations.regionalDispatch}
                  onChange={(val) => {
                    setIntegrations((p) => ({ ...p, regionalDispatch: val }))
                    showToast(`EMS Dispatch Gateway ${val ? 'enabled' : 'paused'}`, 'info')
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="sertos-modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="sertos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sertos-modal-header">
              <h3 className="sertos-modal-title">
                <AlertTriangle size={18} color="#DC2626" /> Confirm {confirmAction === 'reset' ? 'Dashboard Reset' : 'Clear All Data'}
              </h3>
              <button type="button" className="sertos-modal-close" onClick={() => setConfirmAction(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sertos-modal-body">
              <p style={{ fontSize: 14, color: '#475569' }}>
                Are you sure you want to restore all beds, incoming emergency cases, staff statuses, and hospital settings back to their baseline defaults?
              </p>
            </div>
            <div className="sertos-modal-footer">
              <button type="button" className="sertos-btn sertos-btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                type="button"
                className="sertos-btn sertos-btn-danger"
                onClick={() => {
                  resetAllData()
                  setConfirmAction(null)
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
