import csv
import io
from fastapi import APIRouter, Query, HTTPException, Response
from typing import List, Optional
from ..database import get_db
from ..models import FloodIncident, FloodIncidentFilterResponse

router = APIRouter(prefix="/api/flood-incidents", tags=["Historical Flood Incidents"])

@router.get("", response_model=FloodIncidentFilterResponse)
def get_flood_incidents(
    location_id: Optional[str] = Query(None, description="Location ID filter"),
    district: Optional[str] = Query(None, description="District filter"),
    year_from: Optional[int] = Query(None, description="Minimum year"),
    year_to: Optional[int] = Query(None, description="Maximum year"),
    severity: Optional[str] = Query(None, description="Severity filter (Minor, Moderate, Severe, Critical)"),
    search: Optional[str] = Query(None, description="Search term in description or impact")
):
    with get_db() as conn:
        cursor = conn.cursor()

        # Build dynamic query
        query = "SELECT * FROM flood_incidents WHERE 1=1"
        params = []

        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)
        if district:
            query += " AND LOWER(district) = LOWER(?)"
            params.append(district)
        if year_from:
            query += " AND year >= ?"
            params.append(year_from)
        if year_to:
            query += " AND year <= ?"
            params.append(year_to)
        if severity:
            query += " AND LOWER(severity) = LOWER(?)"
            params.append(severity)
        if search:
            sq = f"%{search.strip().lower()}%"
            query += " AND (LOWER(event_description) LIKE ? OR LOWER(reported_impact) LIKE ? OR LOWER(location_name) LIKE ?)"
            params.extend([sq, sq, sq])

        query += " ORDER BY incident_date DESC"
        rows = cursor.execute(query, params).fetchall()

        # Fetch filter metadata
        districts_rows = cursor.execute("SELECT DISTINCT district FROM flood_incidents ORDER BY district ASC").fetchall()
        years_rows = cursor.execute("SELECT DISTINCT year FROM flood_incidents ORDER BY year DESC").fetchall()
        severities = ["Minor", "Moderate", "Severe", "Critical"]

        items = [
            FloodIncident(
                incident_id=r["incident_id"],
                location_id=r["location_id"],
                location_name=r["location_name"],
                district=r["district"],
                latitude=float(r["latitude"]),
                longitude=float(r["longitude"]),
                incident_date=r["incident_date"],
                year=int(r["year"]),
                severity=r["severity"],
                event_description=r["event_description"],
                reported_impact=r["reported_impact"],
                water_level_m=float(r["water_level_m"]) if r["water_level_m"] is not None else None,
                data_source=r["data_source"],
                source_url=r["source_url"],
                provenance_type=r["provenance_type"],
                last_updated=r["last_updated"]
            )
            for r in rows
        ]

        return FloodIncidentFilterResponse(
            total=len(items),
            items=items,
            available_years=[r["year"] for r in years_rows],
            available_districts=[r["district"] for r in districts_rows],
            available_severities=severities
        )

@router.get("/{incident_id}", response_model=FloodIncident)
def get_flood_incident_detail(incident_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        row = cursor.execute("SELECT * FROM flood_incidents WHERE incident_id = ?", (incident_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        return FloodIncident(
            incident_id=row["incident_id"],
            location_id=row["location_id"],
            location_name=row["location_name"],
            district=row["district"],
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            incident_date=row["incident_date"],
            year=int(row["year"]),
            severity=row["severity"],
            event_description=row["event_description"],
            reported_impact=row["reported_impact"],
            water_level_m=float(row["water_level_m"]) if row["water_level_m"] is not None else None,
            data_source=row["data_source"],
            source_url=row["source_url"],
            provenance_type=row["provenance_type"],
            last_updated=row["last_updated"]
        )

@router.get("/export/csv")
def export_incidents_csv(
    district: Optional[str] = None,
    severity: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM flood_incidents WHERE 1=1"
        params = []
        if district:
            query += " AND LOWER(district) = LOWER(?)"
            params.append(district)
        if severity:
            query += " AND LOWER(severity) = LOWER(?)"
            params.append(severity)
        query += " ORDER BY incident_date DESC"
        rows = cursor.execute(query, params).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Incident_ID", "Location_Name", "District", "Latitude", "Longitude",
            "Incident_Date", "Year", "Severity", "Description", "Reported_Impact",
            "Water_Level_m", "Data_Source", "Source_URL", "Provenance"
        ])
        for r in rows:
            writer.writerow([
                r["incident_id"], r["location_name"], r["district"], r["latitude"], r["longitude"],
                r["incident_date"], r["year"], r["severity"], r["event_description"], r["reported_impact"],
                r["water_level_m"], r["data_source"], r["source_url"], r["provenance_type"]
            ])

        response = Response(content=output.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=girirakshak_flood_incidents.csv"
        return response
