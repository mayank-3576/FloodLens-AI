# FloodLens AI — Multi-Stage Flood Early Warning & Awareness Platform

> **Local Flood Awareness Dashboard & Multi-Stage Flood Early Warning Platform**  
> *Subtitle: Local Flood Awareness, Multi-Stage Preparedness & Historical Risk Intelligence*  
> **"Understand your surroundings. Prepare with better information."**  
> *Explore rainfall observations, historical flood events, multi-stage early warnings, and community reports.*

---

## 1. Executive Summary

**FloodLens AI** (formerly GIRIRAKSHAK AI) is a full-stack, community-centered geospatial disaster intelligence web platform upgraded with a **Multi-Stage Flood Early Warning and Preparedness System**, a **two-role authentication architecture** (Admin vs. Common Man / Citizen), and **offline-first PWA functionality** (Service Worker + IndexedDB + background queue sync).

### Scientific Hydrological Principle & Uncertainty Guardrail
> **CRITICAL SCIENTIFIC PRINCIPLE:** *FloodLens AI never claims guaranteed flood predictions 7–14 days in advance. Extended-range atmospheric outlooks, river catchment advisories, and confirmed civil warnings are separated into three distinct operational horizons with explicit uncertainty metrics.*
>
> In real-world hydrology, localized flooding is shaped by non-linear physical factors: peak 15-minute downburst intensity, antecedent precipitation index (soil moisture saturation), upstream barrage discharge (e.g. Hathnikund Barrage on the Yamuna), and urban drainage choke points. Historical records indicate *where water has accumulated previously*, but cannot guarantee future inundation.

---

## 2. Multi-Stage Flood Early Warning & Preparedness Architecture

FloodLens AI structures disaster intelligence into 3 distinct operational horizons:

```
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

### 1. Short-Range Warnings (0–72 Hours)
- Integrates verified bulletins from the India Meteorological Department (IMD) and Central Water Commission (CWC).
- Displays color-coded warning levels (**Red Warning**, **Orange Alert**, **Yellow Watch**, **Green Normal**).
- Compares real-time river levels against official Warning Marks (204.50m) and Danger Marks (205.33m at Old Delhi Railway Bridge).
- Supplies actionable, location-specific citizen preparedness checklists (moving ground-floor valuables, emergency battery torches, 3-day potable water, medical readiness, and civil defense helpline contacts).

### 2. Medium-Range Monitoring (3–7 Days)
- Integrates multi-model numerical weather prediction (NWP) precipitation ensembles and CWC river basin telemetry.
- Monitors upstream barrage releases (e.g., Hathnikund discharge into the Yamuna and Hindon barrage operations).
- Highlights low-lying floodplains and drainage bottlenecks requiring proactive municipal surveillance and de-watering pump deployment.

### 3. Early Outlook (7–14 Days)
- Displays extended-range circulation anomalies and potential active monsoon pulse tendencies from coupled ocean-atmosphere models.
- **Strict Uncertainty Guardrail:** Clearly labeled with explicit confidence bounds (**High Uncertainty / Climatological Outlook**).
- **Separate Indicators:** Potential rainfall concerns and historical area vulnerability (elevation baseline, basin slope) are shown as distinct, transparent indicators, never synthesized into a fake "confirmed flood prediction".

---

## 3. Two-Role Authentication & Security Architecture

FloodLens AI enforces real, server-side cryptographic authentication and role-based access control (RBAC):

### Roles:
1. **Disaster Administrator (`admin`)**:
   - Access to Chief Disaster Officer Command Center (`/api/admin/*`).
   - Moderates community flood reports (Approve or Reject with official verification notes).
   - Issues and broadcasts official early warning bulletins (automatically dispatches in-app notifications to subscribed citizens).
   - Inspects external data provider status, latency, and telemetry sync health.
   - Manages user accounts (activates or deactivates accounts; self-deactivation strictly prevented).
   - Manages rainfall and flood incident records with mandatory destructive action confirmation (`confirm=true`).
   - Audits all operator and security actions in an immutable `audit_logs` table.

2. **Common Man / Citizen (`citizen`)**:
   - Explores the public dashboard, interactive Leaflet maps, rainfall trends, location comparison, and AI assistant without requiring an account.
   - When signed in:
     - Submits community flood reports with location, date, estimated water level, severity, description, and photo evidence.
     - Tracks review status of their submitted reports (`Under Review`, `Approved & Live on Map`, `Rejected`).
     - Subscribes to monitored locations and customizes alert horizon preferences (0–72h, 3–7d, 7–14d).
     - Receives in-app notifications and browser push notifications.

### Security Implementation:
- **Password Storage:** NIST-compliant salted `scrypt` key derivation (`hashlib.scrypt` with a random 16-byte salt, $n=16384, r=8, p=1$) and constant-time verification (`hmac.compare_digest`).
- **Session Tokens:** Cryptographically random 256-bit bearer tokens (`secrets.token_hex(32)`), stored as SHA-256 hashes in SQLite with expiration timestamps.
- **Brute Force Protection:** In-memory rate limiting preventing consecutive failed login attempts (max 5 failed attempts per 5 minutes per user/IP).
- **Server-Side Enforcement:** User roles are verified from database records on every protected endpoint. Frontend-selected roles are validated to prevent role tampering.
- **Initial Bootstrap:** Safe initial administrator account seeded via environment variable (`ADMIN_INITIAL_PASSWORD`).

---

## 4. Offline-First Architecture (PWA, Service Worker & IndexedDB)

FloodLens AI functions seamlessly during network disconnections and disaster power outages:

1. **Progressive Web App (PWA):**
   - Web App Manifest (`manifest.webmanifest`) configured for standalone full-screen mobile and desktop installation.
   - Native Service Worker (`sw.js`) implementing cache-first caching for static assets and network-first caching with automatic fallback for API routes.
2. **IndexedDB Local Database (`floodlens_db`):**
   - Stores pre-cached data bundles: locations, 48h rainfall observations, historical incidents, approved community reports, and multi-stage early warnings.
   - Stores offline user sessions and location subscription preferences.
3. **Offline Community Report Queuing & Auto-Sync:**
   - Citizen reports submitted while offline are queued in IndexedDB with local IDs and a status of `"Pending upload — stored locally"`.
   - Client-generated UUIDs ensure idempotent deduplication when synced.
   - When network connectivity is restored (`online` event), FloodLens AI automatically pushes queued reports to the server and refreshes the cache.
4. **Offline AI Assistant Local Rule Engine:**
   - When offline, the AI assistant queries local IndexedDB storage to answer questions about recent observed rainfall, active cached alerts, and community safety guidelines without failing.
5. **UI Offline Indicators:**
   - Real-time `Online` / `Offline Cache` pill badge in the header.
   - Relative `Last Synced` timestamp display.
   - Manual `Sync Now` button to refresh local data bundles on demand.
   - Offline warning banner explicitly notifying users that active emergency bulletins cannot update without connectivity.

---

## 5. Demo Credentials for Immediate Evaluation

| Role | Username / Email | Password | Intended Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` or `admin@floodlens.local` | `Admin@12345` | Command center, report moderation, bulletin broadcast, provider monitor, audit logs |
| **Citizen** | `citizen` or `citizen@floodlens.local` | `Citizen@12345` | Location subscriptions, report submission, notification center |

*(The login page also provides one-click quick-fill buttons for instant evaluation)*

---

## 6. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons |
| **Design Language** | Humanistic disaster intelligence: warm off-white canvas (`#F8FAFC`), deep navy headings (`#0F172A`), muted teal & natural green accents, restrained amber warnings, and high-contrast accessible typography |
| **PWA & Offline** | Service Worker, Web App Manifest, browser IndexedDB storage engine |
| **Geospatial Mapping** | Leaflet, React-Leaflet, OpenStreetMap baseline (no key needed), MapTiler API integration (optional), CartoDB Voyager, GeoJSON reference buffers |
| **Data Visualizations** | Recharts (Area charts, Bar charts, Grouped bar charts, Pie charts) |
| **Backend API** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, Python-Multipart |
| **Database & Storage** | SQLite3 with indexing on spatial, time-series, auth, and alert columns (`data/girirakshak.db`) |
| **Authentication** | Salted `scrypt` hashing, Bearer session tokens with SHA-256 storage, rate limiting |
| **Validation & Testing** | Pytest test suite (17/17 passed), automated CSV and GeoJSON file validators |

---

## 7. Setup & Execution Guide

### Prerequisites
- Python 3.10+ (Python 3.13 verified on Windows)
- Node.js 18+ and npm

### 1. Clone & Configure Environment
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
# Create virtual environment and activate
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install fastapi uvicorn pydantic python-dotenv pytest httpx python-multipart starlette

# Initialize and seed database with locations, incidents, users, and multi-stage warnings
python scripts/seed_db.py

# Run test suite (17 passed)
pytest -v tests/test_api.py

# Start FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build   # Verifies TypeScript compilation and creates PWA bundle
npm run dev     # Starts Vite development server at http://localhost:5173
```

---

## 8. External APIs & Production Service Integration

| Provider / Service | Environment Variable | Status in FloodLens AI | Description |
| :--- | :--- | :--- | :--- |
| **OpenStreetMap** | *None required* | **Active (Default)** | Free, global tile layer baseline out of the box. |
| **MapTiler API** | `VITE_MAPTILER_API_KEY` | Optional | Enhanced Streets-v2 and Outdoor-v2 topographic cartography. Free key at [maptiler.com](https://www.maptiler.com/). |
| **IMD AWS Network** | `IMD_AWS_API_KEY` | Calibrated Baseline Active | Ingests 15-minute observed precipitation across Indian AWS stations. |
| **CWC Hydrology** | `CWC_HYDROLOGY_API_KEY` | Calibrated Baseline Active | Monitors river gauges, discharge, warning marks, and danger marks. |
| **Open-Meteo Flood** | `OPEN_METEO_API_URL` | Operational | Global GLOFAS river runoff ensemble predictions. |
| **SMTP / Email** | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | Simulated In-App Default | Transmits email warnings to subscribed citizens when configured. |
| **Twilio SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Simulated In-App Default | Broadcasts emergency SMS bulletins when configured. |
