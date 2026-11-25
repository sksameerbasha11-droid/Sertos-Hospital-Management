import { useState } from 'react'
import {
  Download,
  TrendingUp,
  Clock,
  Smile,
  BedDouble,
  FileBarChart,
  Calendar
} from 'lucide-react'
import { useHospital } from '../context/HospitalContext'
import './Reports.css'

const datasetsByPeriod = {
  '7d': {
    summary: { total: 142, response: '8.3 min', satisfaction: '94%', utilization: '72%' },
    weekly: [
      { day: 'Mon', value: 18 },
      { day: 'Tue', value: 24 },
      { day: 'Wed', value: 15 },
      { day: 'Thu', value: 22 },
      { day: 'Fri', value: 28 },
      { day: 'Sat', value: 20 },
      { day: 'Sun', value: 15 },
    ],
    priority: [
      { label: 'Critical', value: 23, color: '#DC2626' },
      { label: 'High', value: 45, color: '#F59E0B' },
      { label: 'Medium', value: 52, color: '#EAB308' },
      { label: 'Low', value: 22, color: '#16A34A' },
    ],
  },
  '30d': {
    summary: { total: 584, response: '7.9 min', satisfaction: '95%', utilization: '76%' },
    weekly: [
      { day: 'Mon', value: 78 },
      { day: 'Tue', value: 92 },
      { day: 'Wed', value: 71 },
      { day: 'Thu', value: 86 },
      { day: 'Fri', value: 104 },
      { day: 'Sat', value: 84 },
      { day: 'Sun', value: 69 },
    ],
    priority: [
      { label: 'Critical', value: 94, color: '#DC2626' },
      { label: 'High', value: 182, color: '#F59E0B' },
      { label: 'Medium', value: 210, color: '#EAB308' },
      { label: 'Low', value: 98, color: '#16A34A' },
    ],
  },
}

const departments = [
  { name: 'Emergency Medicine', cases: 48, avgResponse: '6.2 min', rating: 4.8, efficiency: 94 },
  { name: 'Trauma Surgery', cases: 32, avgResponse: '7.5 min', rating: 4.6, efficiency: 88 },
  { name: 'Cardiology', cases: 25, avgResponse: '8.1 min', rating: 4.7, efficiency: 85 },
  { name: 'Neurology', cases: 18, avgResponse: '9.4 min', rating: 4.5, efficiency: 79 },
  { name: 'Pediatric Emergency', cases: 22, avgResponse: '5.8 min', rating: 4.9, efficiency: 92 },
  { name: 'Orthopedics', cases: 15, avgResponse: '10.2 min', rating: 4.4, efficiency: 76 },
]

const recentReports = [
  { title: 'Daily Emergency Summary - Nov 25', date: 'Nov 25, 2026', type: 'Daily' },
  { title: 'Weekly Bed Utilization Report', date: 'Nov 24, 2026', type: 'Weekly' },
  { title: 'Monthly Staff Performance Review', date: 'Nov 20, 2026', type: 'Monthly' },
  { title: 'Daily Patient Admission Log', date: 'Nov 25, 2026', type: 'Daily' },
  { title: 'Weekly Equipment Maintenance Report', date: 'Nov 22, 2026', type: 'Weekly' },
]

function downloadFile(filename, content, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { showToast, metrics } = useHospital()
  const [fromDate, setFromDate] = useState('2026-11-18')
  const [toDate, setToDate] = useState('2026-11-25')
  const [period, setPeriod] = useState('7d')

  const activeData = datasetsByPeriod[period]
  const liveUtilization = `${Math.round((metrics.totalBedsOccupied / metrics.totalBeds) * 100)}%`

  const summaryCards = [
    { label: 'Total Emergencies This Month', value: String(activeData.summary.total), icon: TrendingUp, color: '#DC2626' },
    { label: 'Average Response Time', value: activeData.summary.response, icon: Clock, color: '#087F5B' },
    { label: 'Patient Satisfaction', value: activeData.summary.satisfaction, icon: Smile, color: '#16A34A' },
    { label: 'Bed Utilization Rate', value: period === '7d' ? liveUtilization : activeData.summary.utilization, icon: BedDouble, color: '#F59E0B' },
  ]

  const maxBarValue = Math.max(...activeData.weekly.map((d) => d.value))
  const maxPriority = Math.max(...activeData.priority.map((d) => d.value))

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Daily': return 'report-badge-daily'
      case 'Weekly': return 'report-badge-weekly'
      case 'Monthly': return 'report-badge-monthly'
      default: return ''
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['SERTOS Hospital Emergency Report', `${fromDate} to ${toDate}`],
      [],
      ['Department', 'Cases Handled', 'Avg Response Time', 'Patient Rating', 'Efficiency Score (%)'],
      ...departments.map((d) => [d.name, d.cases, d.avgResponse, d.rating, d.efficiency]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    downloadFile(`sertos-report-${fromDate}-to-${toDate}.csv`, csv)
    showToast('Exported analytics report CSV')
  }

  const handleDownloadSingleReport = (report) => {
    const content = [
      `SERTOS CENTRAL HOSPITAL — ${report.title}`,
      `Date: ${report.date} | Category: ${report.type}`,
      `--------------------------------------------------`,
      `Total Beds: ${metrics.totalBeds}`,
      `Available Beds: ${metrics.totalBedsAvailable}`,
      `Occupied Beds: ${metrics.totalBedsOccupied}`,
      `Active Incoming Emergencies: ${metrics.totalIncomingCount}`,
      `Average Response Time: ${activeData.summary.response}`,
      `Patient Satisfaction: ${activeData.summary.satisfaction}`,
    ].join('\n')
    const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    downloadFile(`${slug}.txt`, content, 'text/plain')
    showToast(`Downloaded ${report.title}`)
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h2 className="reports-title">Reports & Analytics</h2>
        <div className="reports-header-actions">
          <div className="reports-period-pills">
            <button
              type="button"
              className={`period-pill ${period === '7d' ? 'active' : ''}`}
              onClick={() => setPeriod('7d')}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`period-pill ${period === '30d' ? 'active' : ''}`}
              onClick={() => setPeriod('30d')}
            >
              30 Days
            </button>
          </div>
          <div className="reports-date-range">
            <label className="reports-date-label">From</label>
            <input
              type="date"
              className="reports-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label className="reports-date-label">To</label>
            <input
              type="date"
              className="reports-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button type="button" className="reports-export-btn" onClick={handleExportCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="reports-summary-grid">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div className="reports-summary-card" key={index}>
              <div className="reports-summary-icon" style={{ backgroundColor: card.color + '15', color: card.color }}>
                <Icon size={22} />
              </div>
              <div className="reports-summary-info">
                <span className="reports-summary-value">{card.value}</span>
                <span className="reports-summary-label">{card.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="reports-charts-grid">
        <div className="reports-card">
          <h3 className="reports-card-title">Emergency Cases - {period === '7d' ? 'Last 7 Days' : '30-Day Breakdown by Weekday'}</h3>
          <div className="reports-bar-chart">
            {activeData.weekly.map((item, index) => (
              <div className="reports-bar-col" key={index}>
                <span className="reports-bar-value">{item.value}</span>
                <div
                  className="reports-bar"
                  style={{ height: `${(item.value / maxBarValue) * 100}%` }}
                />
                <span className="reports-bar-label">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reports-card">
          <h3 className="reports-card-title">Cases by Priority Distribution</h3>
          <div className="reports-priority-chart">
            {activeData.priority.map((item, index) => (
              <div className="reports-priority-row" key={index}>
                <span className="reports-priority-label">{item.label}</span>
                <div className="reports-priority-bar-track">
                  <div
                    className="reports-priority-bar-fill"
                    style={{
                      width: `${(item.value / maxPriority) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="reports-priority-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="reports-card">
        <h3 className="reports-card-title">Department Performance</h3>
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Cases Handled</th>
                <th>Avg Response Time</th>
                <th>Patient Rating</th>
                <th>Efficiency Score</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={index}>
                  <td className="reports-dept-name">{dept.name}</td>
                  <td>{dept.cases}</td>
                  <td>{dept.avgResponse}</td>
                  <td>
                    <span className="reports-rating">{dept.rating} / 5.0</span>
                  </td>
                  <td>
                    <div className="reports-efficiency">
                      <div className="reports-efficiency-track">
                        <div
                          className="reports-efficiency-fill"
                          style={{
                            width: `${dept.efficiency}%`,
                            backgroundColor: dept.efficiency >= 90 ? '#16A34A' : dept.efficiency >= 80 ? '#F59E0B' : '#DC2626',
                          }}
                        />
                      </div>
                      <span className="reports-efficiency-value">{dept.efficiency}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reports-card">
        <h3 className="reports-card-title">Recent Reports</h3>
        <div className="reports-recent-list">
          {recentReports.map((report, index) => (
            <div className="reports-recent-item" key={index}>
              <div className="reports-recent-icon">
                <FileBarChart size={20} />
              </div>
              <div className="reports-recent-info">
                <span className="reports-recent-title">{report.title}</span>
                <span className="reports-recent-date">
                  <Calendar size={13} />
                  {report.date}
                </span>
              </div>
              <span className={`reports-recent-badge ${getTypeBadgeClass(report.type)}`}>
                {report.type}
              </span>
              <button
                type="button"
                className="reports-download-link"
                onClick={() => handleDownloadSingleReport(report)}
              >
                <Download size={15} />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
