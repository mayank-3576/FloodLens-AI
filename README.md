# FloodLens AI — Pan-India Local Flood Early Warning & Awareness Platform

[![Python Tests](https://img.shields.io/badge/pytest-23%20passed-emerald?style=for-the-badge&logo=pytest)](file:///tests/test_api.py)
[![React 18](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](file:///frontend/package.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-teal?style=for-the-badge&logo=fastapi)](file:///backend/app/main.py)
[![Pan-India LGD](https://img.shields.io/badge/India%20Coverage-28%20States%20%2B%208%20UTs-orange?style=for-the-badge)](https://lgdirectory.gov.in/)
[![Languages](https://img.shields.io/badge/Languages-13%20Indian%20Languages-purple?style=for-the-badge)](file:///frontend/src/i18n/translations.ts)
[![Offline PWA](https://img.shields.io/badge/Offline%20First-IndexedDB%20%2B%20PWA-amber?style=for-the-badge)](file:///frontend/public/sw.js)

> **Pan-India Town-Level Flood Awareness, Multi-Stage Early Warnings & Multilingual Intelligence**  
> *Developed by [Mayank Garg](https://github.com/mayank-3576) (Student at ABES Engineering College)*  
> **"Understand your surroundings. Prepare with transparent, verified information."**  
> *Explore daily rainfall observations (October 2026), river basin corridors, multi-stage early warning horizons, and citizen ground reports.*

---

## 1. Executive Summary

**FloodLens AI** (formerly GIRIRAKSHAK AI) is a full-stack, community-centered geospatial disaster intelligence web platform upgraded with:
1. **Pan-India LGD Administrative Coverage:** Full hierarchical cascading (State → District → Town/City) covering **all 28 States and 8 Union Territories** (36 administrative entities, 81 towns and cities) sourced from the official [Local Government Directory (LGD)](https://lgdirectory.gov.in/).
2. **Multilingual Architecture (13 Indian Languages):** Native in-app switching across English, हिन्दी (Hindi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam), ਪੰਜਾਬੀ (Punjabi), ଓଡ଼ିଆ (Odia), অসমীয়া (Assamese), and اردو (Urdu) with RTL layout support.
3. **October 2026 Official Hydrological Data:** Real observations from the [National Water Data Portal (NWDP / IMD)](https://nwdp.nwic.gov.in/en/dataset/rainfall-daily-imd), Live Open-Meteo hourly weather telemetry, and CWC river gauge danger-level monitoring records.
4. **Multi-Stage Early Warning System:** Three distinct operational horizons (0–72h Short-Range warnings, 3–7d Medium-Range basin monitoring, and 7–14d Extended-Range atmospheric outlooks) with explicit uncertainty guardrails.
5. **Data Integrity & Credential Audit:** Live reporting on connected official sources, credential requirements (e.g. Doppler Radar stream access via the [IMD API Portal](https://api.imd.gov.in/public/index.php)), and micro-gauge vs. district telemetry tracking.
6. **Two-Role Authentication:** Chief Disaster Officer Admin vs. Citizen accounts with report moderation, broadcast bulletins, and notification preferences.
7. **Offline-First PWA:** Native Service Worker and IndexedDB caching for maps, warnings, rainfall charts, and automatic offline citizen report queuing.

### Scientific Hydrological Principle & Uncertainty Guardrail
> **CRITICAL SCIENTIFIC PRINCIPLE:** *FloodLens AI never claims guaranteed flood predictions 7–14 days in advance. Extended-range atmospheric outlooks, river catchment advisories, and confirmed civil warnings are separated into three distinct operational horizons with explicit uncertainty metrics.*
>
> In real-world hydrology, localized flooding is shaped by non-linear physical factors: peak 15-minute downburst intensity, antecedent precipitation index (soil moisture saturation), upstream barrage discharge (e.g. Hathnikund Barrage on the Yamuna), and urban drainage choke points. Historical records indicate *where water has accumulated previously*, but cannot guarantee future inundation.

---

## 2. Pan-India Administrative Coverage (All 36 States & UTs)

FloodLens AI integrates verified administrative data from the official **LGD Directory (Ministry of Panchayati Raj, Govt. of India)**:

- **Complete Geographic Representation:** Covers all 28 States (Andhra Pradesh to West Bengal) and all 8 Union Territories (Andaman & Nicobar Islands, Chandigarh, Dadra & Nagar Haveli and Daman & Diu, Delhi, Jammu & Kashmir, Ladakh, Lakshadweep, Puducherry).
- **Cascading State → District → Town/City Selector:** Selecting a State dynamically populates its official districts; selecting a district populates its towns and urban local bodies.
- **Dedicated Gauge vs. District Telemetry Transparency:**
  - **46 Locations with Dedicated Micro AWS Sensors:** Direct riverfront and municipal gauging stations (e.g., Delhi Old Railway Bridge, Mumbai Kurla/Mithi, Chennai Adyar/Velachery, Guwahati Brahmaputra, Patna Ganga/Danapur, Cuttack Mahanadi).
  - **35 Peripheral Towns with District Gridded Telemetry:** Transparently flagged with a cautionary badge: *"District-level AWS telemetry applied; municipal ward micro-sensor absent"* so citizens understand that river gauging alone does not capture localized street waterlogging.

---

## 3. Multilingual Intelligence & Bhashini Integration

The platform provides complete multilingual disaster awareness for diverse linguistic communities across India:

| Language | Native Name | Script | Direction | Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **English** | English | Latin | LTR | Complete Dashboard, APIs & Documentation |
| **Hindi** | हिन्दी | Devanagari | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Bengali** | বাংলা | Bengali | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Tamil** | தமிழ் | Tamil | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Telugu** | తెలుగు | Telugu | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Marathi** | मराठी | Devanagari | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Gujarati** | ગુજરાતી | Gujarati | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Kannada** | ಕನ್ನಡ | Kannada | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Malayalam** | മലയാളം | Malayalam | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Punjabi** | ਪੰਜਾਬੀ | Gurmukhi | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Odia** | ଓଡ଼ିଆ | Odia | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Assamese** | অসমীয়া | Bengali | LTR | Full UI, Warnings, Safety Protocols & AI Assistant |
| **Urdu** | اردو | Perso-Arabic | **RTL** | Full UI, Warnings, Safety Protocols & AI Assistant |

- **Bhashini Mission Integration:** Supports the Government of India's [BHASHINI National Language Translation Mission](https://bhashini.gov.in/) (`BHASHINI_API_KEY`, `BHASHINI_USER_ID`, `BHASHINI_PIPELINE_ID`) for dynamic neural machine translation.
- **Offline High-Accuracy Fallback:** Built-in verified civil defense dictionaries provide zero-latency offline translations for essential emergency messages, helplines (`112`, `1070`), and disclaimers.

---

## 4. Multi-Stage Flood Early Warning Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLOODLENS AI EARLY WARNING                         │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. SHORT-RANGE WARNINGS  │ 2. MEDIUM-RANGE MONITOR  │ 3. EARLY OUTLOOK      │
│    (0 – 72 Hours)        │    (3 – 7 Days)          │    (7 – 14 Days)      │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ • Verified IMD & CWC     │ • CWC Inundation Status  │ • Extended NWP Pulse  │
│   Color Alerts (Red /    │ • Upstream Barrage       │ • Precipitation       │
│   Orange / Yellow)       │   Discharge (Hathnikund) │   Anomalies (+30-50mm)│
│ • River Warning (204.5m) │ • 5-Day Cumulative       │ • Distinct Historical │
│   & Danger (205.33m)     │   Rainfall Ensembles     │   Vulnerability Index │
│   Water Levels           │ • Basin Watchlist Flags  │ • HIGH UNCERTAINTY    │
│ • Actionable Preparedness│ • Municipal Drain        │   LABEL (Not a flood  │
│   Citizen Checklist      │   Clearing Alerts        │   forecast)           │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

1. **Short-Range Warnings (0–72 Hours):**
   - Verified alerts from IMD and Central Water Commission (CWC).
   - Real-time gauge levels vs. Warning Marks and Danger Marks.
   - Actionable citizen checklists: elevating ground-floor valuables, emergency torches, 3-day drinking water, and emergency helplines.
2. **Medium-Range Monitoring (3–7 Days):**
   - Multi-model numerical weather prediction (NWP) rainfall ensembles and river catchment monitoring.
   - Barrage discharge tracking (e.g., Hathnikund, Hirakud, Chembarambakkam).
3. **Early Outlook (7–14 Days):**
   - Coupled ocean-atmosphere model anomalies (+30% precipitation anomaly).
   - Distinct vulnerability indicators without claiming deterministic flood arrival dates.

---

## 5. October 2026 Official Observations & Provenance Audit

FloodLens AI enforces strict data provenance and never misrepresents synthetic demo data as real government observations:

- **`nwdp_nwic_imd_gridded` (NWDP / IMD):** Official daily gridded observations (0.25° x 0.25° resolution) for October 1–24, 2026.
- **`open_meteo_weather`:** Live hourly reanalysis and Doppler-blended precipitation telemetry.
- **`cwc_flood_monitoring`:** Official river danger marks and barrage discharge records.
- **`imd_api_portal` Transparency:** The platform explicitly reports via `/api/data-sources/status-report` that while public weather forecasts and bulletins are active, raw high-frequency Doppler Weather Radar (DWR) telemetry streams require authorized credentials (`IMD_API_KEY`).

---

## 6. Two-Role Authentication & Security Architecture

1. **Disaster Administrator (`admin`):**
   - Access to Chief Disaster Officer Command Center (`/api/admin/*`).
   - Moderates community flood reports (Approve / Reject with official notes).
   - Issues and broadcasts early warning bulletins with automated push notifications.
   - Data Quality, Completeness Scores, and Model Lead-Time Performance Analytics.
   - Immutable security audit logs (`audit_logs`).
2. **Citizen (`citizen`):**
   - Explores town-level flood risk, 24h rainfall charts, and interactive maps.
   - Submits community waterlogging reports with water depth, severity, and photo.
   - Subscribes to monitored locations and sets alert horizon preferences.

### Demo Credentials
| Role | Identifier | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` or `admin@floodlens.local` | `Admin@12345` | CDO command center, report moderation, bulletin broadcast, provider analytics |
| **Citizen** | `citizen` or `citizen@floodlens.local` | `Citizen@12345` | Town alerts, community report submission, notification center |

*(One-click quick-fill buttons are available on the sign-in modal for quick testing)*

---

## 7. Offline-First PWA (Service Worker & IndexedDB)

- **Progressive Web App (PWA):** Installs seamlessly on desktop and mobile browsers via `manifest.webmanifest`.
- **IndexedDB Local Storage (`floodlens_db`):** Pre-caches administrative hierarchy, October 2026 rainfall observations, active warnings, and translation dictionaries.
- **Offline Report Queue & Auto-Sync:** Community reports submitted while offline are queued in IndexedDB and automatically pushed when internet connectivity resumes.
- **Offline AI Assistant:** Rule-based local knowledge engine answers queries from cached telemetry when offline without breaking.

---

## 8. Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons |
| **Languages & i18n** | Custom React Context i18n, Bhashini NMT API, 13 Indian Languages, RTL Support |
| **Geospatial Mapping** | Leaflet, React-Leaflet, OpenStreetMap baseline, optional MapTiler API |
| **Charts & Viz** | Recharts (Area charts, Bar charts, Time-series trends) |
| **Backend API** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, Python-Multipart |
| **Database** | SQLite3 with indexes on administrative hierarchy, time-series, and spatial columns |
| **Testing** | Pytest test suite (**23/23 tests passed** with 100% success rate) |

---

## 9. Quick Start Guide

### Prerequisites
- Python 3.10+ (Python 3.13 tested)
- Node.js 18+ and npm

### 1. Clone & Configure Environment
```bash
git clone https://github.com/mayank-3576/FloodLens-AI.git
cd FloodLens-AI
cp .env.example .env
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Seed database with all 36 States/UTs and October 2026 data
python scripts/seed_db.py

# Run automated verification suite (23/23 tests)
pytest -v tests/test_api.py

# Start backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build   # Verifies TypeScript compilation
npm run dev     # Starts Vite development server at http://localhost:5173
```

---

## 10. Author & Project Metadata

- **Author:** [Mayank Garg](https://github.com/mayank-3576)
- **Institution:** Student at ABES Engineering College
- **Email:** `mayank.24b1531039@abes.ac.in`
- **GitHub Repository:** [https://github.com/mayank-3576/FloodLens-AI](https://github.com/mayank-3576/FloodLens-AI)
- **License:** Open Source for Humanitarian and Disaster Risk Awareness Purposes
