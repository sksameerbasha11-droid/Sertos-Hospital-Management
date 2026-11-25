import { Routes, Route, Navigate } from 'react-router-dom'
import { HospitalProvider } from './context/HospitalContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IncomingCases from './pages/IncomingCases'
import BedManagement from './pages/BedManagement'
import PatientRecords from './pages/PatientRecords'
import StaffTeams from './pages/StaffTeams'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import './App.css'
import './components/Modal.css'

function App() {
  return (
    <HospitalProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="incoming-cases" element={<IncomingCases />} />
          <Route path="bed-management" element={<BedManagement />} />
          <Route path="patient-records" element={<PatientRecords />} />
          <Route path="staff-teams" element={<StaffTeams />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HospitalProvider>
  )
}

export default App
