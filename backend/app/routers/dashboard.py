from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..models import (
    DashboardSummaryResponse, MetricCard,
    YearlyIncidentCount, LocationRainfallSummary, LocationResponse
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

DISCLAIMER = (
    "These visualizations provide flood awareness based on available observations and historical records. "
    "They are not an official flood forecast or emergency warning."
)

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(location_id: Optional[str] = Query("noida", description="Location ID")):
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Fetch active location
        loc = cursor.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
        if not loc:
            loc = cursor.execute("SELECT * FROM locations LIMIT 1").fetchone()
            if not loc:
                raise HTTPException(status_code=404, detail="No locations found in database.")
        
        active_loc = LocationResponse(**dict(loc))
        target_id = active_loc.id

        # 2. Total locations count
        loc_count = cursor.execute("SELECT COUNT(*) FROM locations").fetchone()[0]

        # 3. Latest rainfall observation for active location
        latest_obs = cursor.execute("""
            SELECT rainfall_mm, accumulation_24h_mm, timestamp, source_type, is_stale
            FROM rainfall_observations
            WHERE location_id = ?
            ORDER BY timestamp DESC LIMIT 1
        """, (target_id,)).fetchone()

        latest_rain = float(latest_obs["rainfall_mm"]) if latest_obs else 0.0
        accum_24h = float(latest_obs["accumulation_24h_mm"]) if latest_obs and latest_obs["accumulation_24h_mm"] is not None else 0.0
        latest_ts = latest_obs["timestamp"] if latest_obs else "No data"
        src_type = latest_obs["source_type"] if latest_obs else "DEMO_SYNTHETIC"
        is_stale = bool(latest_obs["is_stale"]) if latest_obs else False

        # 4. Historical flood incidents count for active location
        inc_count = cursor.execute("""
            SELECT COUNT(*) FROM flood_incidents WHERE location_id = ?
        """, (target_id,)).fetchone()[0]

        # 5. Last update time across the system
        last_update_row = cursor.execute("""
            SELECT MAX(created_at) FROM rainfall_observations
        """).fetchone()
        last_update = last_update_row[0] if last_update_row and last_update_row[0] else datetime.now().isoformat()

        # 6. Rainfall trend (past 24 points / hours)
        trend_rows = cursor.execute("""
            SELECT timestamp, rainfall_mm, accumulation_24h_mm, source_type
            FROM rainfall_observations
            WHERE location_id = ? AND period = '1h'
            ORDER BY timestamp DESC LIMIT 24
        """, (target_id,)).fetchall()
        
        rainfall_trend = [
            {
                "timestamp": r["timestamp"][-5:], # HH:MM
                "full_timestamp": r["timestamp"],
                "rainfall_mm": float(r["rainfall_mm"]),
                "accumulation_24h_mm": float(r["accumulation_24h_mm"]) if r["accumulation_24h_mm"] is not None else 0.0,
                "source_type": r["source_type"]
            }
            for r in reversed(trend_rows)
        ]

        # 7. Incidents by year
        year_rows = cursor.execute("""
            SELECT year, COUNT(*) as count
            FROM flood_incidents
            GROUP BY year
            ORDER BY year ASC
        """).fetchall()
        incidents_by_year = [YearlyIncidentCount(year=r["year"], count=r["count"]) for r in year_rows]

        # 8. Location-wise rainfall comparison
        all_locs = cursor.execute("SELECT id, name, district FROM locations").fetchall()
        location_rainfall = []
        for l in all_locs:
            obs = cursor.execute("""
                SELECT rainfall_mm, accumulation_24h_mm, source_type
                FROM rainfall_observations
                WHERE location_id = ?
                ORDER BY timestamp DESC LIMIT 1
            """, (l["id"],)).fetchone()
            location_rainfall.append(LocationRainfallSummary(
                location_id=l["id"],
                name=l["name"].split(" (")[0],
                district=l["district"],
                rainfall_mm=float(obs["rainfall_mm"]) if obs else 0.0,
                accumulation_24h_mm=float(obs["accumulation_24h_mm"]) if obs and obs["accumulation_24h_mm"] is not None else 0.0,
                provenance=obs["source_type"] if obs else "DEMO_SYNTHETIC"
            ))

        # 9. Monthly / seasonal distribution benchmark
        monthly_distribution = [
            {"month": "Jan", "avg_rainfall_mm": 18.2, "monsoon_phase": "Winter"},
            {"month": "Feb", "avg_rainfall_mm": 22.4, "monsoon_phase": "Winter"},
            {"month": "Mar", "avg_rainfall_mm": 16.5, "monsoon_phase": "Pre-Monsoon"},
            {"month": "Apr", "avg_rainfall_mm": 14.1, "monsoon_phase": "Pre-Monsoon"},
            {"month": "May", "avg_rainfall_mm": 35.8, "monsoon_phase": "Pre-Monsoon"},
            {"month": "Jun", "avg_rainfall_mm": 128.6, "monsoon_phase": "Southwest Monsoon"},
            {"month": "Jul", "avg_rainfall_mm": 284.2, "monsoon_phase": "Southwest Monsoon (Peak)"},
            {"month": "Aug", "avg_rainfall_mm": 265.0, "monsoon_phase": "Southwest Monsoon (Peak)"},
            {"month": "Sep", "avg_rainfall_mm": 175.4, "monsoon_phase": "Retreating Monsoon"},
            {"month": "Oct", "avg_rainfall_mm": 42.1, "monsoon_phase": "Post-Monsoon"},
            {"month": "Nov", "avg_rainfall_mm": 12.0, "monsoon_phase": "Post-Monsoon"},
            {"month": "Dec", "avg_rainfall_mm": 9.5, "monsoon_phase": "Winter"}
        ]

        # Prepare summary metrics dictionary
        metrics = {
            "latest_rainfall": MetricCard(
                title="Latest Rainfall",
                value=f"{latest_rain:.1f}",
                unit="mm",
                subtitle=f"Recorded at {latest_ts[-8:-3] if len(latest_ts) >= 16 else latest_ts}",
                badge="Normal" if latest_rain < 15.6 else "Heavy" if latest_rain < 64.5 else "Extreme",
                badge_variant="cyan" if latest_rain < 15.6 else "amber" if latest_rain < 64.5 else "red"
            ),
            "accumulation_24h": MetricCard(
                title="24h Accumulation",
                value=f"{accum_24h:.1f}",
                unit="mm",
                subtitle="Rolling 24-Hour window",
                badge="DEMO DATA" if src_type == "DEMO_SYNTHETIC" else "LIVE TELEMETRY",
                badge_variant="amber" if src_type == "DEMO_SYNTHETIC" else "teal"
            ),
            "historical_incidents": MetricCard(
                title="Historical Incidents",
                value=str(inc_count),
                unit="recorded",
                subtitle=f"Within {active_loc.district}",
                badge="NDMA / CWC Log",
                badge_variant="cyan"
            ),
            "monitored_locations": MetricCard(
                title="Monitored Locations",
                value=str(loc_count),
                unit="districts",
                subtitle="Across 7 Indian river basins",
                badge="Cataloged",
                badge_variant="teal"
            ),
            "dataset_freshness": MetricCard(
                title="Data Provenance",
                value="Synthetic Demo",
                unit=None,
                subtitle=f"Updated {last_update[:10]}",
                badge="DEMO_SYNTHETIC",
                badge_variant="amber"
            )
        }

        return DashboardSummaryResponse(
            metrics=metrics,
            rainfall_trend_24h=rainfall_trend,
            incidents_by_year=incidents_by_year,
            location_rainfall=location_rainfall,
            monthly_rainfall_distribution=monthly_distribution,
            active_location=active_loc,
            total_locations=loc_count,
            data_freshness=last_update,
            disclaimer=DISCLAIMER
        )
