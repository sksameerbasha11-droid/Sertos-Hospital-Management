# SERTOS Hospital Management — Emergency Control Dashboard

A responsive, multi-page hospital emergency coordination dashboard built with **React**, **Vite**, **React Router**, and **Lucide Icons** for the SERTOS ambulance emergency system.

## Features

- **Hospital Dashboard**: Live KPI overview (Incoming Emergency, Beds Available, On-Duty Specialists, ICU Available), Active Emergency card (`SRT-1047`), live Patient Vitals preview, Ambulance Tracking map & telemetry modal, Quick Actions (`Call Ambulance`, `Reserve Bed`, `Alert Team`, `Code Blue`), Emergency Team status, Recent Alerts, and Department Bed Availability.
- **Incoming Cases**: Real-time ambulance case queue with search, priority/status filtering, bay preparation (`Prepare Bay`), and full clinical case detail & admission workflow.
- **Bed Management**: Hospital-wide bed stats (`120` total beds across 7 departments), visual occupancy bars, and an interactive Emergency Department Bed Map (`B-101`–`B-120`) for real-time bed status updates.
- **Patient Records**: Searchable/filterable admission registry with an interactive clinical detail panel (vitals, medications, clinical notes, timeline), plus Add Patient and Edit Record workflows.
- **Staff & Teams**: Emergency response team cards with roster & paging modals, plus a filterable Staff Directory with inline duty-status management.
- **Reports & Analytics**: Time-period toggling (`7 Days` / `30 Days`), CSS bar & priority charts, department performance metrics, CSV export, and report downloads.
- **Settings**: Tabbed configuration (`General`, `Notifications`, `Users`, `System`, `Integrations`), alert preferences, diagnostics, and dashboard reset controls.

## Tech Stack

- React 19 + Vite 8
- React Router v7
- Lucide React Icons

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
