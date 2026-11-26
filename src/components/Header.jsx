import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Ambulance,
  BedDouble,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Wifi,
  Menu,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  LogOut
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './Header.css'

const pageTitles = {
  '/': { title: 'Hospital Dashboard', icon: LayoutDashboard },
  '/incoming-cases': { title: 'Incoming Cases', icon: Ambulance },
  '/bed-management': { title: 'Bed Management', icon: BedDouble },
  '/patient-records': { title: 'Patient Records', icon: ClipboardList },
  '/staff-teams': { title: 'Staff & Teams', icon: Users },
  '/reports': { title: 'Reports', icon: BarChart3 },
  '/settings': { title: 'Settings', icon: Settings },
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { settings, saveSettings, alerts, markAllAlertsRead, showToast } = useHospital()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [dutyStatus, setDutyStatus] = useState('Active Shift')
  const [hospitalTime, setHospitalTime] = useState(() => new Date())
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setHospitalTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedClock = hospitalTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const formattedDate = hospitalTime.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })

  const page = pageTitles[location.pathname] || pageTitles['/']
  const PageIcon = page.icon
  const unreadCount = alerts.filter((a) => a.unread).length

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title-group">
          <PageIcon size={22} className="header-title-icon" />
          <h1 className="header-title">{page.title}</h1>
        </div>
      </div>

      <div className="header-right">
        <div className="header-clock" title="Current Hospital Control Time">
          <Clock size={14} className="header-clock-icon" />
          <span className="header-clock-time">{formattedClock}</span>
          <span className="header-clock-date">{formattedDate}</span>
        </div>

        <button
          type="button"
          className={`header-status ${!settings.isOnline ? 'status-offline' : ''}`}
          onClick={() => {
            saveSettings({ isOnline: !settings.isOnline })
          }}
          title="Toggle Hospital SERTOS Connectivity"
        >
          <Wifi size={14} className="status-icon" />
          <span className="status-text">
            {settings.isOnline ? 'Connected · Online' : 'Standby'}
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="header-dropdown-wrap" ref={notifRef}>
          <button
            type="button"
            className="header-notification"
            onClick={() => {
              setNotifOpen((p) => !p)
              setProfileOpen(false)
            }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="header-popover notif-popover">
              <div className="popover-header">
                <span>Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="popover-link"
                    onClick={markAllAlertsRead}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="popover-list">
                {alerts.slice(0, 6).map((alert) => (
                  <button
                    type="button"
                    key={alert.id}
                    className={`popover-notif-item ${alert.unread ? 'unread' : ''}`}
                    onClick={() => {
                      setNotifOpen(false)
                      navigate('/incoming-cases')
                    }}
                  >
                    <span className={`popover-notif-dot ${alert.type}`}>
                      {alert.type === 'critical' && <AlertTriangle size={13} />}
                      {alert.type === 'warning' && <AlertCircle size={13} />}
                      {alert.type === 'success' && <CheckCircle size={13} />}
                      {alert.type === 'info' && <Clock size={13} />}
                    </span>
                    <div className="popover-notif-body">
                      <span className="popover-notif-text">{alert.text}</span>
                      <span className="popover-notif-time">{alert.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="header-dropdown-wrap" ref={profileRef}>
          <button
            type="button"
            className="header-user"
            onClick={() => {
              setProfileOpen((p) => !p)
              setNotifOpen(false)
            }}
          >
            <div className="user-avatar">
              <span>AK</span>
            </div>
            <div className="user-info">
              <span className="user-name">Dr. A. Kumar</span>
              <span className="user-role">Emergency Control</span>
            </div>
            <ChevronDown size={16} className="user-chevron" />
          </button>

          {profileOpen && (
            <div className="header-popover profile-popover">
              <div className="profile-popover-top">
                <div className="profile-popover-name">Dr. Arjun Kumar</div>
                <div className="profile-popover-role">Emergency Control · {dutyStatus}</div>
              </div>
              <div className="profile-popover-actions">
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    const next = dutyStatus === 'Active Shift' ? 'On Break' : 'Active Shift'
                    setDutyStatus(next)
                    showToast(`Operator status changed to ${next}`, 'info')
                    setProfileOpen(false)
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Switch Status ({dutyStatus === 'Active Shift' ? 'Go On Break' : 'Resume Shift'})</span>
                </button>
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/staff-teams')
                  }}
                >
                  <Users size={15} />
                  <span>Emergency Teams</span>
                </button>
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/settings')
                  }}
                >
                  <Settings size={15} />
                  <span>Console Settings</span>
                </button>
                <div className="profile-divider" />
                <button
                  type="button"
                  className="profile-menu-item danger"
                  onClick={() => {
                    setProfileOpen(false)
                    showToast('Console session locked for handoff', 'warning')
                  }}
                >
                  <LogOut size={15} />
                  <span>Shift Handoff / Lock</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
