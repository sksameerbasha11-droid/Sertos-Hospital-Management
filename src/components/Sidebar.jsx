import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Ambulance,
  BedDouble,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Activity,
  Wifi,
  X
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { settings, metrics } = useHospital()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/incoming-cases', icon: Ambulance, label: 'Incoming Cases', badge: metrics.totalIncomingCount },
    { path: '/bed-management', icon: BedDouble, label: 'Bed Management' },
    { path: '/patient-records', icon: ClipboardList, label: 'Patient Records' },
    { path: '/staff-teams', icon: Users, label: 'Staff & Teams' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div className="logo-text">
            <span className="logo-brand">SERTOS</span>
            <span className="logo-subtitle">Emergency Control</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="nav-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <div className="hospital-card">
          <div className="hospital-visual">
            <svg width="100%" height="60" viewBox="0 0 200 60" fill="none">
              <rect x="70" y="10" width="60" height="50" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="85" y="5" width="30" height="12" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="100" y1="20" x2="100" y2="35" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <line x1="92" y1="27.5" x2="108" y2="27.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <rect x="92" y="42" width="16" height="18" rx="1" fill="rgba(255,255,255,0.12)" />
              <rect x="30" y="30" width="30" height="30" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <rect x="140" y="25" width="35" height="35" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </svg>
          </div>
          <div className="hospital-info">
            <span className="hospital-name">{settings.hospitalName}</span>
            <div className="hospital-status">
              <Wifi size={12} />
              <span>{settings.isOnline ? 'Connected — Online' : 'Standby Mode'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
