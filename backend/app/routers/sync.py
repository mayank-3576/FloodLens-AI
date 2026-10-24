import json
from datetime import datetime, timezone
from fastapi import APIRouter
from ..database import get_db

router = APIRouter(prefix="/api/sync", tags=["Offline Data Synchronization Engine"])

@router.get("/bundle")
def get_offline_sync_bundle():
    """
    Returns a unified data bundle for browser IndexedDB pre-caching and offline-first availability.
    Includes locations, recent observations, historical incidents, approved community reports,
    and multi-stage flood early warning outlooks.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Locations
        cursor.execute("SELECT * FROM locations ORDER BY name ASC;")
        locations = [dict(r) for r in cursor.fetchall()]

        # 2. Data Sources
        cursor.execute("SELECT * FROM data_sources ORDER BY name ASC;")
        data_sources = [dict(r) for r in cursor.fetchall()]

        # 3. Recent 48h Rainfall Observations
        cursor.execute(
            """
            SELECT * FROM rainfall_observations
            ORDER BY timestamp DESC
            LIMIT 700;
            """
        )
        rainfall_obs = [dict(r) for r in cursor.fetchall()]

        # 4. Flood Incidents
        cursor.execute("SELECT * FROM flood_incidents ORDER BY incident_date DESC;")
        incidents = [dict(r) for r in cursor.fetchall()]

        # 5. Public Approved Community Reports
        cursor.execute("SELECT * FROM community_reports WHERE status = 'approved' ORDER BY incident_date DESC;")
        community_reports = [dict(r) for r in cursor.fetchall()]

        # 6. Multi-Stage Early Warnings
        cursor.execute("SELECT * FROM early_warnings WHERE is_active = 1 ORDER BY valid_to DESC;")
        warning_rows = cursor.fetchall()
        warnings = []
        for r in warning_rows:
            w = dict(r)
            try:
                w["hydrological_indicators"] = json.loads(w["hydrological_indicators"])
            except Exception:
                w["hydrological_indicators"] = {}
            try:
                w["preparedness_guidance"] = json.loads(w["preparedness_guidance"])
            except Exception:
                w["preparedness_guidance"] = []
            w["is_expired"] = w["valid_to"] < now_iso
            warnings.append(w)

        return {
            "synced_at": now_iso,
            "offline_mode_ready": True,
            "locations": locations,
            "data_sources": data_sources,
            "recent_rainfall": rainfall_obs,
            "incidents": incidents,
            "community_reports": community_reports,
            "early_warnings": warnings,
            "offline_disclaimer": "OFFLINE NOTICE: This data was cached from the server on the last sync timestamp. Real-time updates and active official warnings require an active network connection."
        }
