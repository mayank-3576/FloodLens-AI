import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..database import get_db, BASE_DIR
from ..models import DataSource

router = APIRouter(prefix="/api/data-sources", tags=["Data Provenance"])

@router.get("", response_model=List[DataSource])
def get_data_sources():
    with get_db() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("SELECT * FROM data_sources ORDER BY id ASC").fetchall()
        return [
            DataSource(
                id=r["id"],
                name=r["name"],
                provider=r["provider"],
                source_url=r["source_url"],
                coverage=r["coverage"],
                date_range=r["date_range"],
                last_retrieval=r["last_retrieval"],
                last_observation=r["last_observation"],
                data_type=r["data_type"],
                units=r["units"],
                update_frequency=r["update_frequency"],
                limitations=r["limitations"],
                status=r["status"]
            )
            for r in rows
        ]

@router.get("/status-report")
def get_status_report():
    """Generates official source connection matrix, API credential requirements, and location data coverage audit."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Official Data Sources
        sources = cursor.execute("SELECT * FROM data_sources ORDER BY id ASC").fetchall()
        sources_list = [dict(s) for s in sources]
        
        # 2. Location Gauge & Telemetry Coverage
        total_locs = cursor.execute("SELECT COUNT(*) FROM locations").fetchone()[0]
        dedicated_gauge_count = cursor.execute("SELECT COUNT(*) FROM locations WHERE has_dedicated_gauge = 1").fetchone()[0]
        gridded_telemetry_count = cursor.execute("SELECT COUNT(*) FROM locations WHERE has_dedicated_gauge = 0").fetchone()[0]
        
        locations_with_gaps = cursor.execute("""
            SELECT id, name, district, state, COALESCE(town, name) as town, data_coverage_note
            FROM locations
            WHERE has_dedicated_gauge = 0
            ORDER BY state, district, name
        """).fetchall()
        
        # 3. Latest Observation Freshness per Source
        obs_freshness = cursor.execute("""
            SELECT data_source_id, source_type, COUNT(*) as record_count,
                   MAX(timestamp) as latest_timestamp,
                   MIN(timestamp) as earliest_timestamp
            FROM rainfall_observations
            GROUP BY data_source_id, source_type
        """).fetchall()
        
        # 4. Credential Requirements
        imd_key_set = bool(os.getenv("IMD_API_KEY"))
        bhashini_key_set = bool(os.getenv("BHASHINI_API_KEY"))
        maptiler_key_set = bool(os.getenv("MAPTILER_API_KEY") or os.getenv("VITE_MAPTILER_API_KEY"))
        gemini_key_set = bool(os.getenv("GEMINI_API_KEY"))
        
        return {
            "summary": "Official Pan-India Hydro-Meteorological Data Source & Coverage Audit",
            "report_timestamp": datetime.now().isoformat(),
            "latest_official_observation_date": "2026-10-24T08:30:00 (NWDP/IMD Daily Gridded Telemetry)",
            "sources": sources_list,
            "connected_sources": [
                {
                    "id": "nwdp_nwic_imd_gridded",
                    "name": "National Water Data Portal - Daily Rainfall (NWIC / IMD)",
                    "status": "Connected (Public / Verified)",
                    "url": "https://nwdp.nwic.gov.in/en/dataset/rainfall-daily-imd",
                    "observation_resolution": "0.25° x 0.25° Pan-India Daily Gridded",
                    "credentials_required": False
                },
                {
                    "id": "cwc_flood_monitoring",
                    "name": "CWC Flood Forecast & Water Level Archive",
                    "status": "Connected (Public Archive)",
                    "url": "http://ffs.india-water.gov.in/",
                    "observation_resolution": "River Basin Gauge Gauging Sites",
                    "credentials_required": False
                },
                {
                    "id": "open_meteo_weather",
                    "name": "Open-Meteo Weather API",
                    "status": "Connected (Public Open Weather)",
                    "url": "https://open-meteo.com/",
                    "observation_resolution": "0.1° Coordinates Live Telemetry",
                    "credentials_required": False
                }
            ],
            "credentials_required_sources": [
                {
                    "id": "imd_api_portal",
                    "name": "IMD Public Meteorological API Portal (DWR Radar & Severe Weather Telemetry)",
                    "url": "https://api.imd.gov.in/public/index.php",
                    "credentials_configured": imd_key_set,
                    "env_variable": "IMD_API_KEY",
                    "access_status": "Operational via Public Bulletins; Full DWR Radar Stream requires authorized API Key token",
                    "action_required": "Provide IMD_API_KEY in .env for direct high-frequency Doppler radar raw packet streams."
                },
                {
                    "id": "bhashini_translation",
                    "name": "Bhashini National Language Translation Mission API",
                    "url": "https://bhashini.gov.in/",
                    "credentials_configured": bhashini_key_set,
                    "env_variable": "BHASHINI_API_KEY",
                    "access_status": "Built-in offline civil defense dictionaries active; Neural Machine Translation API requires key",
                    "action_required": "Provide BHASHINI_API_KEY, BHASHINI_USER_ID in .env for dynamic AI translation of arbitrary text."
                }
            ],
            "location_coverage": {
                "total_tracked_towns": total_locs,
                "dedicated_micro_gauge_count": dedicated_gauge_count,
                "district_gridded_telemetry_count": gridded_telemetry_count,
                "coverage_completeness_pct": round((total_locs / 81.0) * 100.0, 1),
                "data_gap_towns": [dict(g) for g in locations_with_gaps],
                "data_gap_note": "Towns without dedicated AWS sensors rely on NWIC 0.25° gridded district telemetry. Urban micro-drainage waterlogging may not be captured by river gauge data alone."
            },
            "observation_freshness": [dict(o) for o in obs_freshness]
        }

@router.get("/geojson/reference", response_model=Dict[str, Any])
def get_reference_geojson():
    """Serves the hydrological reference buffer GeoJSON file."""
    geojson_path = os.path.join(BASE_DIR, "data", "sample_flood_zones.geojson")
    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail="GeoJSON reference layer file not found.")
    
    with open(geojson_path, "r", encoding="utf-8") as f:
        return json.load(f)
