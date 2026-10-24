import csv
import io
from fastapi import APIRouter, Query, HTTPException, Response
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import (
    RainfallObservation, RainfallTrendsResponse, RainfallStats, RainfallTrendPoint
)
from ..services.weather_service import WeatherAdapter

router = APIRouter(prefix="/api/rainfall", tags=["Rainfall Intelligence"])

@router.get("", response_model=List[RainfallObservation])
def get_rainfall_observations(
    location_id: Optional[str] = Query(None, description="Location ID filter"),
    period: Optional[str] = Query(None, description="Period filter (e.g. 1h, 24h)"),
    start_date: Optional[str] = Query(None, description="Start date/time (ISO 8601)"),
    end_date: Optional[str] = Query(None, description="End date/time (ISO 8601)"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM rainfall_observations WHERE 1=1"
        params = []

        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)
        if period:
            query += " AND period = ?"
            params.append(period)
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = cursor.execute(query, params).fetchall()
        return [
            RainfallObservation(
                id=r["id"],
                location_id=r["location_id"],
                timestamp=r["timestamp"],
                rainfall_mm=float(r["rainfall_mm"]),
                period=r["period"],
                accumulation_24h_mm=float(r["accumulation_24h_mm"]) if r["accumulation_24h_mm"] is not None else None,
                source_type=r["source_type"],
                data_source_id=r["data_source_id"],
                is_stale=bool(r["is_stale"])
            )
            for r in rows
        ]

@router.get("/trends", response_model=RainfallTrendsResponse)
async def get_rainfall_trends(
    location_id: str = Query("noida", description="Target location ID"),
    range_type: str = Query("24h", description="Time window: 24h, 7d, 30d, 1y"),
    check_live: bool = Query(False, description="Whether to query live Open-Meteo API")
):
    with get_db() as conn:
        cursor = conn.cursor()
        
        loc_row = cursor.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
        if not loc_row:
            raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")
        
        loc_dict = dict(loc_row)

        # Optional check for live weather API
        live_result = None
        if check_live:
            live_result = await WeatherAdapter.fetch_live_rainfall(
                latitude=loc_dict["latitude"],
                longitude=loc_dict["longitude"]
            )

        # Determine query period and limits
        limit_map = {"24h": 24, "7d": 7, "30d": 30, "1y": 365}
        limit = limit_map.get(range_type, 24)
        period_filter = "1h" if range_type == "24h" else "24h"

        rows = cursor.execute("""
            SELECT timestamp, rainfall_mm, accumulation_24h_mm, source_type, is_stale
            FROM rainfall_observations
            WHERE location_id = ? AND period = ?
            ORDER BY timestamp DESC LIMIT ?
        """, (location_id, period_filter, limit)).fetchall()

        if not rows:
            # Fallback to any period if filtered empty
            rows = cursor.execute("""
                SELECT timestamp, rainfall_mm, accumulation_24h_mm, source_type, is_stale
                FROM rainfall_observations
                WHERE location_id = ?
                ORDER BY timestamp DESC LIMIT ?
            """, (location_id, limit)).fetchall()

        trend_points = []
        rain_values = []
        stale_flag = False
        data_source_label = "DEMO_SYNTHETIC"

        for r in reversed(rows):
            rf = float(r["rainfall_mm"])
            rain_values.append(rf)
            if r["is_stale"]:
                stale_flag = True
            data_source_label = r["source_type"]
            
            trend_points.append(RainfallTrendPoint(
                timestamp=r["timestamp"],
                date=r["timestamp"][:10],
                rainfall_mm=rf,
                accumulation_24h_mm=float(r["accumulation_24h_mm"]) if r["accumulation_24h_mm"] is not None else None,
                source_type=r["source_type"]
            ))

        # Compute calculated statistics only when supported by data
        obs_count = len(rain_values)
        total_mm = round(sum(rain_values), 1) if obs_count > 0 else 0.0
        max_mm = max(rain_values) if obs_count > 0 else 0.0
        avg_mm = round(total_mm / obs_count, 1) if obs_count > 0 else 0.0
        latest_mm = rain_values[-1] if obs_count > 0 else 0.0
        latest_ts = rows[0]["timestamp"] if rows else None

        # If live API succeeded, attach live badge
        if live_result:
            latest_mm = live_result["rainfall_mm"]
            latest_ts = live_result["timestamp"]
            data_source_label = "LIVE_API"
            stale_flag = False

        stats = RainfallStats(
            total_mm=total_mm,
            max_mm=max_mm,
            avg_mm=avg_mm,
            latest_mm=latest_mm,
            latest_timestamp=latest_ts,
            observation_count=obs_count,
            stale_warning=stale_flag,
            data_provenance=data_source_label
        )

        return RainfallTrendsResponse(
            location_id=location_id,
            location_name=loc_dict["name"],
            district=loc_dict["district"],
            period=range_type,
            stats=stats,
            trends=trend_points
        )

@router.get("/export/csv")
def export_rainfall_csv(
    location_id: Optional[str] = Query(None, description="Location ID filter"),
    period: Optional[str] = Query(None, description="Period filter")
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT r.*, l.name as location_name FROM rainfall_observations r JOIN locations l ON r.location_id = l.id WHERE 1=1"
        params = []
        if location_id:
            query += " AND r.location_id = ?"
            params.append(location_id)
        if period:
            query += " AND r.period = ?"
            params.append(period)

        query += " ORDER BY r.timestamp DESC LIMIT 1000"
        rows = cursor.execute(query, params).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Observation_ID", "Location_ID", "Location_Name", "Timestamp",
            "Rainfall_mm", "Period", "Accumulation_24h_mm", "Provenance_Source", "Is_Stale"
        ])
        for r in rows:
            writer.writerow([
                r["id"], r["location_id"], r["location_name"], r["timestamp"],
                r["rainfall_mm"], r["period"], r["accumulation_24h_mm"],
                r["source_type"], "True" if r["is_stale"] else "False"
            ])

        response = Response(content=output.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=girirakshak_rainfall_{location_id or 'all'}.csv"
        return response
