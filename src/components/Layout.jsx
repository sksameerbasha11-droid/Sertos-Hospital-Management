import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useHospital } from '../context/HospitalContext'
import './Layout.css'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { codeBlueActive, toggleCodeBlue, toasts } = useHospital()

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="main-area">
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        {codeBlueActive && (
          <div className="code-blue-banner" role="alert">
            <div className="code-blue-banner-left">
              <AlertTriangle size={16} />
              <span>CODE BLUE ACTIVE — Emergency Bay 1 · Rapid Response Team Dispatched</span>
            </div>
            <button
              type="button"
              className="code-blue-clear-btn"
              onClick={() => toggleCodeBlue('Emergency Bay 1')}
            >
              Stand Down
            </button>
          </div>
        )}

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {toasts.length > 0 && (
        <div className="sertos-toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`sertos-toast toast-${t.type}`}>
              {t.type === 'success' && <CheckCircle size={16} color="#4ADE80" />}
              {t.type === 'warning' && <AlertCircle size={16} color="#FBBF24" />}
              {t.type === 'error' && <AlertTriangle size={16} color="#F87171" />}
              {t.type === 'info' && <Info size={16} color="#60A5FA" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
