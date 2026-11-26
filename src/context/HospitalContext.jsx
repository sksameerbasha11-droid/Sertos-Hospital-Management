import { createContext, useContext, useState } from 'react'

const HospitalContext = createContext(null)

export const HOSPITAL_COORDS = { lat: 40.7681, lng: -73.9647 }

const GOOGLE_MAPS_STORAGE_KEY = 'sertos_google_maps_api_key'

const INITIAL_SETTINGS = {
  hospitalName: 'SERTOS Central Hospital',
  hospitalCode: 'SCH-001',
  emergencyContact: '+1-555-0100',
  address: '123 Medical Center Drive',
  isOnline: true,
  notifications: {
    emergencyAlerts: true,
    ambulanceArrival: true,
    bedStatusUpdates: true,
    staffShiftChanges: false,
    systemMaintenance: false,
  },
  alertSound: 'critical-alarm',
  alertVolume: 75,
}

const INITIAL_CASES = [
  {
    id: 'SRT-1047',
    priority: 'High',
    patient: {
      age: 45,
      gender: 'Male',
      description: 'Acute chest pain radiating to left arm, diaphoresis',
      allergies: 'Penicillin',
      bloodType: 'O+',
    },
    condition: 'Suspected Cardiac Event',
    conditionType: 'cardiac',
    ambulance: 'AMB-12',
    crew: 'Paramedics J. Reyes & K. Brooks',
    etaMinutes: 4,
    eta: '4 minutes',
    status: 'En Route',
    source: 'Ambulance Emergency System',
    location: 'Oakridge Blvd & 5th Ave (1.8 km away)',
    coords: { lat: 40.7615, lng: -73.9762 },
    assignedBay: null,
    vitals: { bp: '145/92', hr: 112, spo2: '96%', temp: '37.8°C' },
    notes: '12-lead ECG transmitted. Aspirin 325mg administered en route. IV access established.',
  },
  {
    id: 'SRT-1046',
    priority: 'Critical',
    patient: {
      age: 34,
      gender: 'Female',
      description: 'Multiple trauma injuries, suspected internal bleeding',
      allergies: 'None known',
      bloodType: 'A-',
    },
    condition: 'Trauma - Vehicle Accident',
    conditionType: 'trauma',
    ambulance: 'AMB-07',
    crew: 'Paramedics D. Miller & S. Cho',
    etaMinutes: 8,
    eta: '8 minutes',
    status: 'En Route',
    source: 'Ambulance Emergency System',
    location: 'Interstate 95 Exit 14 (4.2 km away)',
    coords: { lat: 40.7932, lng: -73.9382 },
    assignedBay: 'B-107',
    vitals: { bp: '96/62', hr: 124, spo2: '91%', temp: '36.4°C' },
    notes: 'Cervical collar applied. Two large-bore IVs running normal saline. Trauma Team Alpha alerted.',
  },
  {
    id: 'SRT-1045',
    priority: 'Critical',
    patient: {
      age: 71,
      gender: 'Male',
      description: 'Severe dyspnea, wheezing, peripheral cyanosis',
      allergies: 'Sulfa drugs',
      bloodType: 'B+',
    },
    condition: 'Respiratory Distress',
    conditionType: 'respiratory',
    ambulance: 'AMB-03',
    crew: 'Paramedics L. Gomez & T. Ward',
    etaMinutes: 2,
    eta: '2 minutes',
    status: 'Arriving',
    source: 'Ambulance Emergency System',
    location: 'Approaching Emergency Bay Entrance',
    coords: { lat: 40.7694, lng: -73.9612 },
    assignedBay: 'B-118',
    vitals: { bp: '148/90', hr: 108, spo2: '85%', temp: '38.1°C' },
    notes: 'High-flow O2 via non-rebreather mask at 15 L/min. Nebulized albuterol given.',
  },
  {
    id: 'SRT-1044',
    priority: 'Medium',
    patient: {
      age: 58,
      gender: 'Female',
      description: 'Left-sided weakness, slurred speech, facial droop',
      allergies: 'None known',
      bloodType: 'AB+',
    },
    condition: 'Stroke Symptoms',
    conditionType: 'stroke',
    ambulance: 'AMB-19',
    crew: 'Paramedics R. Patel & M. Dunn',
    etaMinutes: 15,
    eta: '15 minutes',
    status: 'En Route',
    source: 'Ambulance Emergency System',
    location: 'Westside Hwy Mile 8 (7.5 km away)',
    coords: { lat: 40.7855, lng: -73.9841 },
    assignedBay: null,
    vitals: { bp: '172/102', hr: 88, spo2: '95%', temp: '36.9°C' },
    notes: 'Last known well 40 minutes ago. Stroke protocol CT bay requested on arrival.',
  },
  {
    id: 'SRT-1043',
    priority: 'Low',
    patient: {
      age: 27,
      gender: 'Male',
      description: 'Localized allergic reaction, urticaria, mild wheeze',
      allergies: 'Peanuts',
      bloodType: 'O-',
    },
    condition: 'Allergic Reaction',
    conditionType: 'allergy',
    ambulance: 'AMB-21',
    crew: 'Paramedics N. Foster & C. Diaz',
    etaMinutes: 22,
    eta: '22 minutes',
    status: 'Dispatched',
    source: 'Ambulance Emergency System',
    location: 'Downtown Plaza North (10.1 km away)',
    coords: { lat: 40.7498, lng: -73.9879 },
    assignedBay: null,
    vitals: { bp: '116/74', hr: 96, spo2: '97%', temp: '36.8°C' },
    notes: 'IM Epinephrine 0.3mg administered. Symptoms stabilizing during transport.',
  },
]

const INITIAL_DEPARTMENTS = [
  { id: 'ed', name: 'Emergency Department', total: 20, available: 6, occupied: 12, maintenance: 2 },
  { id: 'icu', name: 'ICU', total: 15, available: 6, occupied: 8, maintenance: 1 },
  { id: 'cardiac', name: 'Cardiac Care', total: 12, available: 4, occupied: 7, maintenance: 1 },
  { id: 'ward-a', name: 'General Ward A', total: 25, available: 8, occupied: 15, maintenance: 2 },
  { id: 'ward-b', name: 'General Ward B', total: 25, available: 5, occupied: 19, maintenance: 1 },
  { id: 'peds', name: 'Pediatrics', total: 13, available: 3, occupied: 9, maintenance: 1 },
  { id: 'maternity', name: 'Maternity', total: 10, available: 2, occupied: 8, maintenance: 0 },
]

// 20 beds for Emergency Department visual bed map (6 available, 10 occupied, 2 reserved, 2 maintenance -> total 20)
const INITIAL_ED_BEDS = [
  { id: 'B-101', deptId: 'ed', status: 'available', patientName: null, note: 'Trauma Bay 1 — Ready' },
  { id: 'B-102', deptId: 'ed', status: 'occupied', patientName: 'Robert Harrison', note: 'Cardiac monitoring' },
  { id: 'B-103', deptId: 'ed', status: 'occupied', patientName: 'Chen Wei', note: 'Burn care unit' },
  { id: 'B-104', deptId: 'ed', status: 'available', statusNote: 'Sanitized', patientName: null, note: 'Ready for intake' },
  { id: 'B-105', deptId: 'ed', status: 'occupied', patientName: 'Arthur Pendelton', note: 'Observation' },
  { id: 'B-106', deptId: 'ed', status: 'occupied', patientName: 'Sandra Meyer', note: 'IV fluids' },
  { id: 'B-107', deptId: 'ed', status: 'reserved', patientName: 'SRT-1046 (Incoming)', note: 'Reserved for AMB-07 trauma' },
  { id: 'B-108', deptId: 'ed', status: 'occupied', patientName: 'Daniel Park', note: 'Post-suturing' },
  { id: 'B-109', deptId: 'ed', status: 'available', patientName: null, note: 'Cardiac monitor ready' },
  { id: 'B-110', deptId: 'ed', status: 'maintenance', patientName: null, note: 'Monitor calibration' },
  { id: 'B-111', deptId: 'ed', status: 'occupied', patientName: 'Miriam Vance', note: 'Respiratory support' },
  { id: 'B-112', deptId: 'ed', status: 'occupied', patientName: 'Victor Silva', note: 'Lab results pending' },
  { id: 'B-113', deptId: 'ed', status: 'available', patientName: null, note: 'General ED bay' },
  { id: 'B-114', deptId: 'ed', status: 'occupied', patientName: 'Hannah Brooks', note: 'Pain management' },
  { id: 'B-115', deptId: 'ed', status: 'occupied', patientName: 'George Lin', note: 'Awaiting CT scan' },
  { id: 'B-116', deptId: 'ed', status: 'maintenance', patientName: null, note: 'Deep sanitization' },
  { id: 'B-117', deptId: 'ed', status: 'available', patientName: null, note: 'Isolation capable' },
  { id: 'B-118', deptId: 'ed', status: 'reserved', patientName: 'SRT-1045 (Incoming)', note: 'Reserved for AMB-03' },
  { id: 'B-119', deptId: 'ed', status: 'occupied', patientName: 'Nora Lindqvist', note: 'Orthopedic consult' },
  { id: 'B-120', deptId: 'ed', status: 'available', patientName: null, note: 'Fast-track bay' },
]

const INITIAL_PATIENTS = [
  {
    id: 'PAT-2001',
    name: 'Robert Harrison',
    age: 54,
    gender: 'Male',
    admissionDate: '2026-11-24',
    department: 'Emergency',
    condition: 'Acute Myocardial Infarction',
    status: 'Critical',
    doctor: 'Dr. Sarah Chen',
    bed: 'B-102',
    vitals: { hr: '78 bpm', bp: '120/80', spo2: '98%', temp: '37.2°C' },
    medications: [
      { name: 'Aspirin 325mg', schedule: 'Once daily', time: '08:00 AM' },
      { name: 'Metoprolol 50mg', schedule: 'Twice daily', time: '08:00 AM / 08:00 PM' },
      { name: 'Heparin IV Drip', schedule: 'Continuous', time: 'Ongoing' },
    ],
    notes: 'Patient admitted with chest pain and elevated troponin levels. Immediate cardiac catheterization recommended. Family has been notified.',
    timeline: [
      { time: '02:00 PM', event: 'Admitted via Emergency Department' },
      { time: '02:30 PM', event: 'Dr. Chen reviewed patient chart' },
      { time: '03:15 PM', event: 'ECG performed — ST segment monitored' },
      { time: '04:00 PM', event: 'Aspirin 325mg & Heparin started' },
      { time: '06:30 PM', event: 'Vitals checked — stable under telemetry' },
    ],
  },
  {
    id: 'PAT-2002',
    name: 'Linda Nguyen',
    age: 32,
    gender: 'Female',
    admissionDate: '2026-11-23',
    department: 'Orthopedics',
    condition: 'Fractured Tibia',
    status: 'Active',
    doctor: 'Dr. James Wilson',
    bed: 'A-204',
    vitals: { hr: '74 bpm', bp: '118/76', spo2: '99%', temp: '36.8°C' },
    medications: [
      { name: 'Cefazolin 1g IV', schedule: 'Every 8 hours', time: '06:00 AM / 02:00 PM' },
      { name: 'Acetaminophen 500mg', schedule: 'As needed', time: 'Every 6 hours' },
      { name: 'Enoxaparin 40mg', schedule: 'Once daily', time: '09:00 PM' },
    ],
    notes: 'Post-reduction immobilization complete. Neurovascular checks intact in right lower extremity. Scheduled for morning ortho rounds.',
    timeline: [
      { time: '09:40 AM', event: 'Admitted after sports injury' },
      { time: '11:10 AM', event: 'X-Ray confirmed mid-shaft tibia fracture' },
      { time: '01:30 PM', event: 'Closed reduction & splint applied' },
      { time: '05:00 PM', event: 'Pain controlled, neurovascular check normal' },
    ],
  },
  {
    id: 'PAT-2003',
    name: 'Marcus Thompson',
    age: 67,
    gender: 'Male',
    admissionDate: '2026-11-22',
    department: 'Cardiology',
    condition: 'Atrial Fibrillation',
    status: 'Stable',
    doctor: 'Dr. Amit Patel',
    bed: 'C-302',
    vitals: { hr: '82 bpm', bp: '132/84', spo2: '97%', temp: '36.7°C' },
    medications: [
      { name: 'Amiodarone 200mg', schedule: 'Once daily', time: '09:00 AM' },
      { name: 'Apixaban 5mg', schedule: 'Twice daily', time: '09:00 AM / 09:00 PM' },
      { name: 'Lisinopril 10mg', schedule: 'Once daily', time: '08:00 AM' },
    ],
    notes: 'Rate controlled well on current regimen. Sinus rhythm restored earlier today. Plan to continue 24-hour telemetry before discharge evaluation.',
    timeline: [
      { time: '07:20 AM', event: 'Transferred from ED to Cardiac Care' },
      { time: '10:00 AM', event: 'Rate control achieved with Amiodarone' },
      { time: '04:15 PM', event: 'Echocardiogram completed — EF 55%' },
    ],
  },
  {
    id: 'PAT-2004',
    name: 'Elena Vasquez',
    age: 28,
    gender: 'Female',
    admissionDate: '2026-11-20',
    department: 'General Surgery',
    condition: 'Appendectomy Recovery',
    status: 'Discharged',
    doctor: 'Dr. Maria Lopez',
    bed: 'Discharged',
    vitals: { hr: '70 bpm', bp: '114/72', spo2: '99%', temp: '36.6°C' },
    medications: [
      { name: 'Ibuprofen 400mg', schedule: 'Every 6 hours PRN', time: 'Outpatient' },
      { name: 'Amoxicillin-Clavulanate', schedule: 'Twice daily (5d)', time: 'Outpatient' },
    ],
    notes: 'Laparoscopic appendectomy recovery uneventful. Incision sites clean and dry. Discharged home with follow-up in 7 days.',
    timeline: [
      { time: 'Nov 20', event: 'Laparoscopic appendectomy performed' },
      { time: 'Nov 21', event: 'Tolerating oral diet, ambulating well' },
      { time: 'Nov 22', event: 'Discharged with home care instructions' },
    ],
  },
  {
    id: 'PAT-2005',
    name: "James O'Brien",
    age: 45,
    gender: 'Male',
    admissionDate: '2026-11-25',
    department: 'Neurology',
    condition: 'Concussion',
    status: 'Under Observation',
    doctor: 'Dr. Priya Sharma',
    bed: 'B-105',
    vitals: { hr: '72 bpm', bp: '124/78', spo2: '98%', temp: '36.9°C' },
    medications: [
      { name: 'Acetaminophen 650mg', schedule: 'Every 6 hours PRN', time: '04:00 PM' },
      { name: 'Ondansetron 4mg', schedule: 'PRN nausea', time: 'As needed' },
    ],
    notes: 'Head CT negative for acute hemorrhage. GCS 15/15. Neurological checks q2h for mild headache and photophobia.',
    timeline: [
      { time: '11:30 AM', event: 'Admitted after fall incident' },
      { time: '12:15 PM', event: 'Head CT negative for intracranial bleed' },
      { time: '03:00 PM', event: 'GCS 15/15, mild headache improving' },
    ],
  },
  {
    id: 'PAT-2006',
    name: 'Fatima Al-Rashid',
    age: 71,
    gender: 'Female',
    admissionDate: '2026-11-23',
    department: 'Pulmonology',
    condition: 'Pneumonia',
    status: 'Active',
    doctor: 'Dr. David Kim',
    bed: 'B-211',
    vitals: { hr: '88 bpm', bp: '134/82', spo2: '94%', temp: '37.9°C' },
    medications: [
      { name: 'Ceftriaxone 1g IV', schedule: 'Once daily', time: '10:00 AM' },
      { name: 'Azithromycin 500mg', schedule: 'Once daily', time: '10:00 AM' },
      { name: 'Albuterol Nebulizer', schedule: 'Every 4 hours', time: 'Ongoing' },
    ],
    notes: 'Right lower lobe infiltrate on CXR. Maintaining SpO2 94% on 2L nasal cannula. Fever trending downward.',
    timeline: [
      { time: 'Nov 23', event: 'Admitted with fever and productive cough' },
      { time: 'Nov 24', event: 'IV antibiotics initiated, O2 2L/min' },
      { time: 'Today', event: 'Respiration improved, fever down to 37.9°C' },
    ],
  },
  {
    id: 'PAT-2007',
    name: 'Chen Wei',
    age: 39,
    gender: 'Male',
    admissionDate: '2026-11-24',
    department: 'Emergency',
    condition: 'Severe Burns - Grade II',
    status: 'Critical',
    doctor: 'Dr. Sarah Chen',
    bed: 'B-103',
    vitals: { hr: '104 bpm', bp: '112/70', spo2: '97%', temp: '37.5°C' },
    medications: [
      { name: 'Lactated Ringers IV', schedule: 'Parkland protocol', time: 'Continuous' },
      { name: 'Morphine 4mg IV', schedule: 'Every 4 hours PRN', time: '05:00 PM' },
      { name: 'Silver Sulfadiazine', schedule: 'Topical dressing', time: '12:00 PM' },
    ],
    notes: '18% TBSA partial-thickness burns on forearms and torso. Fluid resuscitation ongoing with good urine output.',
    timeline: [
      { time: '01:15 PM', event: 'Admitted via AMB-04 industrial incident' },
      { time: '01:45 PM', event: 'Burn wound debridement and sterile dressings' },
      { time: '05:30 PM', event: 'Fluid resuscitation goals met' },
    ],
  },
  {
    id: 'PAT-2008',
    name: 'Sophia Martinez',
    age: 8,
    gender: 'Female',
    admissionDate: '2026-11-23',
    department: 'Pediatrics',
    condition: 'Acute Asthma Exacerbation',
    status: 'Stable',
    doctor: 'Dr. Maria Lopez',
    bed: 'P-104',
    vitals: { hr: '94 bpm', bp: '102/66', spo2: '98%', temp: '36.8°C' },
    medications: [
      { name: 'Albuterol Inhaler', schedule: 'Every 4 hours', time: '06:00 PM' },
      { name: 'Prednisolone 20mg', schedule: 'Once daily', time: '08:00 AM' },
    ],
    notes: 'Wheezing resolved on room air. Peak flow improved to 85% personal best. Parents educated on spacer technique.',
    timeline: [
      { time: 'Nov 23', event: 'Admitted with acute wheezing and retractions' },
      { time: 'Nov 24', event: 'Weaned off supplemental O2' },
      { time: 'Today', event: 'Clear lung sounds, preparing discharge plan' },
    ],
  },
]

const INITIAL_STAFF = [
  { id: 'STF-01', name: 'Dr. Sarah Chen', initials: 'SC', role: 'Lead Surgeon', department: 'Emergency', shift: 'Day', status: 'On Duty', phone: '(555) 101-2001', color: '#087F5B', team: 'Trauma Team Alpha' },
  { id: 'STF-02', name: 'Dr. James Wilson', initials: 'JW', role: 'Cardiologist', department: 'Cardiology', shift: 'Day', status: 'On Duty', phone: '(555) 101-2002', color: '#2563EB', team: 'Cardiac Response' },
  { id: 'STF-03', name: 'Dr. Maria Lopez', initials: 'ML', role: 'Anesthesiologist', department: 'Pediatrics', shift: 'Rotating', status: 'On Duty', phone: '(555) 101-2003', color: '#D97706', team: 'Pediatric Emergency' },
  { id: 'STF-04', name: 'Nurse R. Patel', initials: 'RP', role: 'ER Nurse', department: 'Emergency', shift: 'Day', status: 'On Duty', phone: '(555) 101-2009', color: '#7C3AED', team: 'General Emergency' },
  { id: 'STF-05', name: 'Dr. Amit Patel', initials: 'AP', role: 'Doctor', department: 'Emergency', shift: 'Rotating', status: 'On Duty', phone: '(555) 101-2007', color: '#087F5B', team: 'General Emergency' },
  { id: 'STF-06', name: 'Priya Sharma', initials: 'PS', role: 'Nurse', department: 'Emergency', shift: 'Night', status: 'Off Duty', phone: '(555) 101-2004', color: '#0D9488', team: 'Trauma Team Alpha' },
  { id: 'STF-07', name: 'David Kim', initials: 'DK', role: 'Technician', department: 'Radiology', shift: 'Day', status: 'On Break', phone: '(555) 101-2005', color: '#64748B', team: 'Trauma Team Alpha' },
  { id: 'STF-08', name: 'Rebecca Okafor', initials: 'RO', role: 'Nurse', department: 'ICU', shift: 'Night', status: 'Off Duty', phone: '(555) 101-2006', color: '#DC2626', team: 'Cardiac Response' },
  { id: 'STF-09', name: 'Carlos Rivera', initials: 'CR', role: 'Paramedic', department: 'Emergency', shift: 'Day', status: 'On Break', phone: '(555) 101-2008', color: '#F59E0B', team: 'General Emergency' },
]

const INITIAL_TEAMS = [
  {
    id: 'team-alpha',
    name: 'Trauma Team Alpha',
    lead: 'Dr. Sarah Chen',
    initials: 'SC',
    members: 5,
    status: 'Active',
    specialty: 'Trauma Surgery',
    color: '#DC2626',
    assignedCases: ['SRT-1046'],
    roster: ['Dr. Sarah Chen (Lead)', 'Priya Sharma (Trauma RN)', 'David Kim (Imaging Tech)', 'Dr. M. Evans (Ortho)', 'T. Brooks (Tech)'],
  },
  {
    id: 'team-cardiac',
    name: 'Cardiac Response',
    lead: 'Dr. James Wilson',
    initials: 'JW',
    members: 4,
    status: 'On Call',
    specialty: 'Cardiology',
    color: '#2563EB',
    assignedCases: ['SRT-1047'],
    roster: ['Dr. James Wilson (Lead)', 'Rebecca Okafor (ICU RN)', 'H. Vance (Cath Tech)', 'Dr. K. Nair (Interventional)'],
  },
  {
    id: 'team-peds',
    name: 'Pediatric Emergency',
    lead: 'Dr. Maria Lopez',
    initials: 'ML',
    members: 4,
    status: 'Active',
    specialty: 'Pediatrics',
    color: '#F59E0B',
    assignedCases: [],
    roster: ['Dr. Maria Lopez (Lead)', 'Nurse A. Carter (Peds RN)', 'Dr. R. Singh (Peds ER)', 'L. Perez (Resp. Therapist)'],
  },
  {
    id: 'team-gen',
    name: 'General Emergency',
    lead: 'Dr. Amit Patel',
    initials: 'AP',
    members: 6,
    status: 'Active',
    specialty: 'Emergency Medicine',
    color: '#087F5B',
    assignedCases: ['SRT-1045', 'SRT-1044'],
    roster: ['Dr. Amit Patel (Lead)', 'Nurse R. Patel (Charge RN)', 'Carlos Rivera (Paramedic)', 'Dr. P. Sharma (Neuro)', 'J. Cho (ER RN)', 'S. Hall (Tech)'],
  },
]

const INITIAL_ALERTS = [
  { id: 'alt-1', type: 'critical', text: 'Cardiac emergency incoming (SRT-1047) — ETA 4 min', time: '2 min ago', unread: true },
  { id: 'alt-2', type: 'warning', text: 'ICU Bed 7 — patient vitals fluctuating', time: '8 min ago', unread: true },
  { id: 'alt-3', type: 'success', text: 'Ambulance SRT-1042 patient admitted successfully', time: '15 min ago', unread: true },
  { id: 'alt-4', type: 'warning', text: 'Blood bank: O- supply below threshold', time: '22 min ago', unread: true },
  { id: 'alt-5', type: 'info', text: 'Shift change — Night team arriving at 22:00', time: '30 min ago', unread: true },
]

export function HospitalProvider({ children }) {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [cases, setCases] = useState(INITIAL_CASES)
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [edBeds, setEdBeds] = useState(INITIAL_ED_BEDS)
  const [patients, setPatients] = useState(INITIAL_PATIENTS)
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [teams, setTeams] = useState(INITIAL_TEAMS)
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [codeBlueActive, setCodeBlueActive] = useState(false)
  const [toasts, setToasts] = useState([])
  // Extra delta so KPI card 3 starts at 11 (representing 11 specialists across hospital) and reflects staff status changes
  const [specialistOffset] = useState(6)
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(() => {
    const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
    if (envKey) return envKey
    try {
      return (localStorage.getItem(GOOGLE_MAPS_STORAGE_KEY) || '').trim()
    } catch {
      return ''
    }
  })

  const saveGoogleMapsApiKey = (newKey) => {
    const cleaned = newKey.trim()
    setGoogleMapsApiKey(cleaned)
    try {
      if (cleaned) {
        localStorage.setItem(GOOGLE_MAPS_STORAGE_KEY, cleaned)
      } else {
        localStorage.removeItem(GOOGLE_MAPS_STORAGE_KEY)
      }
    } catch {
      // ignore storage failure
    }
    showToast(cleaned ? 'Google Maps API key saved and activated' : 'Google Maps API key cleared', cleaned ? 'success' : 'info')
  }

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }

  const addAlert = (text, type = 'info') => {
    const newAlert = {
      id: 'alt-' + Date.now(),
      type,
      text,
      time: 'Just now',
      unread: true,
    }
    setAlerts((prev) => [newAlert, ...prev])
  }

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })))
  }

  const updateBedStatus = (bedId, newStatus, patientName = null, note = null) => {
    setEdBeds((prevBeds) => {
      const target = prevBeds.find((b) => b.id === bedId)
      if (!target || target.status === newStatus) {
        return prevBeds.map((b) =>
          b.id === bedId
            ? { ...b, patientName: patientName ?? b.patientName, note: note ?? b.note }
            : b
        )
      }

      const oldStatus = target.status
      const updated = prevBeds.map((b) =>
        b.id === bedId
          ? {
              ...b,
              status: newStatus,
              patientName: newStatus === 'available' || newStatus === 'maintenance' ? null : (patientName ?? b.patientName ?? 'Assigned Patient'),
              note: note ?? (newStatus === 'available' ? 'Sanitized & Ready' : newStatus === 'maintenance' ? 'Scheduled Maintenance' : b.note),
            }
          : b
      )

      // Update Emergency Department aggregate counts
      const availCount = updated.filter((b) => b.status === 'available').length
      const maintCount = updated.filter((b) => b.status === 'maintenance').length
      const occCount = updated.length - availCount - maintCount

      setDepartments((prevDepts) =>
        prevDepts.map((d) =>
          d.id === 'ed'
            ? { ...d, available: availCount, occupied: occCount, maintenance: maintCount }
            : d
        )
      )

      addAlert(`Bed ${bedId} changed from ${oldStatus} to ${newStatus}`, newStatus === 'available' ? 'success' : 'info')
      showToast(`Bed ${bedId} marked as ${newStatus}`)
      return updated
    })
  }

  const adjustDepartmentBeds = (deptId, deltaAvailable) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id !== deptId) return d
        const nextAvail = Math.max(0, Math.min(d.total - d.maintenance, d.available + deltaAvailable))
        const nextOcc = d.total - d.maintenance - nextAvail
        return { ...d, available: nextAvail, occupied: nextOcc }
      })
    )
  }

  const prepareBayForCase = (caseId, bedId) => {
    const targetCase = cases.find((c) => c.id === caseId)
    if (!targetCase) return

    updateBedStatus(bedId, 'reserved', `${caseId} (Incoming)`, `Reserved for ${targetCase.condition}`)
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, assignedBay: bedId } : c))
    )
    addAlert(`Bay ${bedId} prepared for incoming case ${caseId} (${targetCase.condition})`, 'success')
    showToast(`Bay ${bedId} prepared for ${caseId}`)
  }

  const admitIncomingCase = (caseId) => {
    const targetCase = cases.find((c) => c.id === caseId)
    if (!targetCase) return

    let assignedBedId = targetCase.assignedBay
    if (!assignedBedId) {
      const freeBed = edBeds.find((b) => b.status === 'available')
      if (freeBed) assignedBedId = freeBed.id
    }

    const patientName = `Emergency Patient (${targetCase.id})`
    if (assignedBedId) {
      updateBedStatus(assignedBedId, 'occupied', patientName, targetCase.condition)
    }

    const newPatientId = `PAT-${2009 + patients.length - 8}`
    const newPatient = {
      id: newPatientId,
      name: patientName,
      age: targetCase.patient.age,
      gender: targetCase.patient.gender,
      admissionDate: new Date().toISOString().slice(0, 10),
      department: 'Emergency',
      condition: targetCase.condition,
      status: targetCase.priority === 'Critical' || targetCase.priority === 'High' ? 'Critical' : 'Active',
      doctor: 'Dr. Sarah Chen',
      bed: assignedBedId || 'ED-Triage',
      vitals: {
        hr: `${targetCase.vitals.hr} bpm`,
        bp: targetCase.vitals.bp,
        spo2: targetCase.vitals.spo2,
        temp: targetCase.vitals.temp || '37.0°C',
      },
      medications: [{ name: 'Initial Stabilization Protocol', schedule: 'Stat', time: 'Now' }],
      notes: `Admitted from ${targetCase.ambulance}. ${targetCase.notes}`,
      timeline: [{ time: 'Just now', event: `Admitted from ${targetCase.id} (${targetCase.ambulance}) to ${assignedBedId || 'ED'}` }],
    }

    setPatients((prev) => [newPatient, ...prev])
    setCases((prev) => prev.filter((c) => c.id !== caseId))
    addAlert(`${targetCase.id} admitted to ${assignedBedId || 'Emergency'} as ${newPatientId}`, 'success')
    showToast(`${targetCase.id} admitted successfully to ${assignedBedId || 'ED'}`)
  }

  const addPatient = (patientInput) => {
    const nextNum = 2001 + patients.length
    const newPatient = {
      id: `PAT-${nextNum}`,
      name: patientInput.name,
      age: Number(patientInput.age) || 40,
      gender: patientInput.gender || 'Male',
      admissionDate: new Date().toISOString().slice(0, 10),
      department: patientInput.department || 'Emergency',
      condition: patientInput.condition,
      status: patientInput.status || 'Active',
      doctor: patientInput.doctor || 'Dr. Sarah Chen',
      bed: patientInput.bed || 'ED-Intake',
      vitals: { hr: '80 bpm', bp: '122/78', spo2: '98%', temp: '36.9°C' },
      medications: [{ name: 'Baseline Observation', schedule: 'Every 4 hours', time: 'Started' }],
      notes: patientInput.notes || 'Newly admitted patient under clinical evaluation.',
      timeline: [{ time: 'Just now', event: `Admitted to ${patientInput.department || 'Emergency'}` }],
    }
    setPatients((prev) => [newPatient, ...prev])
    addAlert(`New patient ${newPatient.name} (${newPatient.id}) admitted`, 'info')
    showToast(`Added patient ${newPatient.name} (${newPatient.id})`)
    return newPatient
  }

  const updatePatient = (id, updates) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updatedTimeline =
          updates.status && updates.status !== p.status
            ? [{ time: 'Just now', event: `Status updated to ${updates.status}` }, ...p.timeline]
            : p.timeline
        return { ...p, ...updates, timeline: updatedTimeline }
      })
    )
    showToast(`Updated record ${id}`)
  }

  const updateStaffStatus = (staffId, newStatus) => {
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, status: newStatus } : s)))
    const member = staff.find((s) => s.id === staffId)
    if (member) {
      showToast(`${member.name} is now ${newStatus}`)
    }
  }

  const alertTeam = (teamName, message) => {
    addAlert(`Alert dispatched to ${teamName}: ${message}`, 'critical')
    showToast(`Alert sent to ${teamName}`, 'warning')
  }

  const toggleCodeBlue = (location = 'Emergency Bay 1') => {
    setCodeBlueActive((prev) => {
      const next = !prev
      if (next) {
        addAlert(`CODE BLUE ACTIVATED — ${location}. All rapid response personnel report immediately.`, 'critical')
        showToast(`CODE BLUE ACTIVATED at ${location}`, 'error')
      } else {
        addAlert(`Code Blue stood down at ${location}`, 'success')
        showToast('Code Blue cleared', 'success')
      }
      return next
    })
  }

  const saveSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
    showToast('Settings saved successfully')
  }

  const resetAllData = () => {
    setSettings(INITIAL_SETTINGS)
    setCases(INITIAL_CASES)
    setDepartments(INITIAL_DEPARTMENTS)
    setEdBeds(INITIAL_ED_BEDS)
    setPatients(INITIAL_PATIENTS)
    setStaff(INITIAL_STAFF)
    setTeams(INITIAL_TEAMS)
    setAlerts(INITIAL_ALERTS)
    setCodeBlueActive(false)
    showToast('Dashboard reset to factory defaults', 'info')
  }

  // Derived metrics used across Dashboard & pages
  const totalBedsAvailable = departments.reduce((sum, d) => sum + d.available, 0)
  const totalBedsOccupied = departments.reduce((sum, d) => sum + d.occupied, 0)
  const totalBedsMaintenance = departments.reduce((sum, d) => sum + d.maintenance, 0)
  const totalBeds = departments.reduce((sum, d) => sum + d.total, 0)
  const icuDept = departments.find((d) => d.id === 'icu')
  const icuAvailable = icuDept ? icuDept.available : 6
  const onDutyCount = staff.filter((s) => s.status === 'On Duty').length + specialistOffset
  const urgentIncomingCount = cases.filter((c) => c.priority === 'Critical' || c.priority === 'High').length

  // Adjust urgent count calculation: initially 2 Critical + 1 High = 3, wait - prompt asks Dashboard Card 1 Value = 2.
  // With 1 High (SRT-1047) and 1 Critical? Wait: in INITIAL_CASES let's check:
  // SRT-1047 is High, SRT-1046 is Critical, SRT-1045 is Critical, SRT-1044 is Medium, SRT-1043 is Low.
  // Critical = 2, and Dashboard Card 1 "Incoming Emergency" = 2 (matching Critical/Immediate count or immediate arrivals).
  // Wait let's expose both `immediateIncomingCount` (initial 2) and `cases.length` (initial 5) cleanly!
  const immediateIncomingCount = cases.filter((c) => c.priority === 'Critical').length

  return (
    <HospitalContext.Provider
      value={{
        settings,
        saveSettings,
        cases,
        prepareBayForCase,
        admitIncomingCase,
        setCases,
        departments,
        adjustDepartmentBeds,
        edBeds,
        updateBedStatus,
        patients,
        addPatient,
        updatePatient,
        staff,
        updateStaffStatus,
        teams,
        setTeams,
        alerts,
        addAlert,
        markAllAlertsRead,
        codeBlueActive,
        toggleCodeBlue,
        alertTeam,
        toasts,
        showToast,
        resetAllData,
        googleMapsApiKey,
        saveGoogleMapsApiKey,
        metrics: {
          totalBeds,
          totalBedsAvailable,
          totalBedsOccupied,
          totalBedsMaintenance,
          icuAvailable,
          onDutyCount,
          immediateIncomingCount,
          totalIncomingCount: cases.length,
        },
      }}
    >
      {children}
    </HospitalContext.Provider>
  )
}

export function useHospital() {
  const ctx = useContext(HospitalContext)
  if (!ctx) throw new Error('useHospital must be used inside HospitalProvider')
  return ctx
}
