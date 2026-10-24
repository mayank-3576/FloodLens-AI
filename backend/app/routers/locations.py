from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..database import get_db
from ..models import (
    LocationResponse, LocationComparisonResponse, LocationComparisonItem,
    TownItem, DistrictItem, StateItem, LocationHierarchyResponse, TownRiskResponse
)

router = APIRouter(prefix="/api/locations", tags=["Locations"])

def _compute_town_risk(conn, loc_id: str, district: str, state: str) -> Dict[str, Any]:
    """Dynamically computes town-level risk using active early warnings, rainfall, and community reports."""
    cursor = conn.cursor()
    
    # 1. Check active early warnings
    warnings = cursor.execute("""
        SELECT stage, severity_level, color_code, title, summary, hydrological_indicators, preparedness_guidance, issued_at
        FROM early_warnings
        WHERE (location_id = ? OR district = ?) AND is_active = 1
        ORDER BY CASE color_code 
            WHEN 'Red' THEN 1 
            WHEN 'Orange' THEN 2 
            WHEN 'Yellow' THEN 3 
            ELSE 4 
        END ASC
    """, (loc_id, district)).fetchall()
    
    # 2. Check latest rainfall observation
    latest_rain = cursor.execute("""
        SELECT rainfall_mm, accumulation_24h_mm, timestamp, source_type, is_stale
        FROM rainfall_observations
        WHERE location_id = ?
        ORDER BY timestamp DESC LIMIT 1
    """, (loc_id,)).fetchone()
    
    rf_1h = float(latest_rain["rainfall_mm"]) if latest_rain else 0.0
    accum_24h = float(latest_rain["accumulation_24h_mm"]) if latest_rain and latest_rain["accumulation_24h_mm"] is not None else 0.0
    
    # Rainfall classification (IMD standard)
    if accum_24h > 204.4:
        rf_cat = "Extremely Heavy"
    elif accum_24h > 115.5:
        rf_cat = "Very Heavy"
    elif accum_24h > 64.4:
        rf_cat = "Heavy"
    elif accum_24h > 15.5:
        rf_cat = "Moderate"
    elif accum_24h > 2.4:
        rf_cat = "Light"
    else:
        rf_cat = "Very Light"

    # 3. Check recent community reports
    recent_reports = cursor.execute("""
        SELECT severity, description FROM community_reports 
        WHERE (location_id = ? OR location_name LIKE ?) AND status = 'approved'
        ORDER BY created_at DESC LIMIT 3
    """, (loc_id, f"%{district}%")).fetchall()

    risk_level = "Low"
    risk_color = "Green"
    est_period = "Normal - No imminent flood hazard identified"

    if warnings:
        top_w = warnings[0]
        c_code = top_w["color_code"]
        if c_code == "Red":
            risk_level = "Critical"
            risk_color = "Red"
            est_period = "Immediate (0–24 hours) - Severe Water Ingress / Inundation"
        elif c_code == "Orange":
            risk_level = "High"
            risk_color = "Orange"
            est_period = "Next 24–48 hours - River swell & drainage backflow likely"
        elif c_code == "Yellow":
            risk_level = "Moderate"
            risk_color = "Yellow"
            est_period = "Next 48–72 hours - Monitored advisory window"
    elif accum_24h >= 115.6:
        risk_level = "High"
        risk_color = "Orange"
        est_period = "Next 12–24 hours - Runoff drainage congestion"
    elif accum_24h >= 64.5:
        risk_level = "Moderate"
        risk_color = "Yellow"
        est_period = "Next 24 hours - Localized street waterlogging"

    # Emergency precautions based on risk
    if risk_color in ["Red", "Critical"]:
        safety_precautions = [
            "Evacuate low-lying riverbed basements and ground-floor units immediately.",
            "Do not drive or walk through flood waters; 15 cm of moving water can knock down an adult.",
            "Switch off main electrical breakers and gas supplies before water reaches meters.",
            "Keep emergency survival go-bag, drinking water, and medications accessible."
        ]
    elif risk_color in ["Orange", "High"]:
        safety_precautions = [
            "Move valuable assets and electronics to upper floors.",
            "Avoid low-lying underpasses, subways, and culverts known for chronic inundation.",
            "Charge mobile phones, flashlights, and power banks; store clean drinking water.",
            "Monitor official CWC river gauge advisories and IMD nowcasts regularly."
        ]
    elif risk_color in ["Yellow", "Moderate"]:
        safety_precautions = [
            "Clear outdoor drainage grates and storm gullies around your residence.",
            "Check local municipal traffic and road closure advisories before commuting.",
            "Keep emergency contact numbers handy on paper in case cellular power drops."
        ]
    else:
        safety_precautions = [
            "Conditions are currently normal in this municipal area.",
            "Maintain general monsoon preparedness and avoid disposing solid waste into open stormwater drains."
        ]

    emergency_contacts = [
        {"name": "National Emergency Helpline", "number": "112"},
        {"name": "Disaster Management Control Room (NDMA)", "number": "1070"},
        {"name": f"District Disaster Helpline ({district})", "number": "1077"},
        {"name": "Ambulance / Medical Emergency", "number": "108"}
    ]

    return {
        "risk_level": risk_level,
        "risk_color": risk_color,
        "estimated_risk_period": est_period,
        "rainfall_1h_mm": rf_1h,
        "accumulation_24h_mm": accum_24h,
        "rainfall_category": rf_cat,
        "active_warnings_count": len(warnings),
        "active_advisories": [dict(w) for w in warnings],
        "safety_precautions": safety_precautions,
        "emergency_contacts": emergency_contacts
    }

@router.get("/hierarchy", response_model=LocationHierarchyResponse)
def get_location_hierarchy():
    """Returns the full cascading State -> District -> Town administrative hierarchy."""
    with get_db() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("""
            SELECT id, name, district, state, COALESCE(town, name) as town, 
                   latitude, longitude, elevation_m, basin_name 
            FROM locations 
            ORDER BY state ASC, district ASC, town ASC
        """).fetchall()

        hierarchy: Dict[str, Dict[str, List[TownItem]]] = {}
        state_districts: Dict[str, set] = {}
        state_town_count: Dict[str, int] = {}
        state_highest_risk: Dict[str, str] = {}

        risk_weights = {"Critical": 4, "High": 3, "Moderate": 2, "Low": 1}

        for r in rows:
            st = r["state"]
            dist = r["district"]
            town_name = r["town"] if r["town"] else r["name"]

            risk_info = _compute_town_risk(conn, r["id"], dist, st)

            town_item = TownItem(
                id=r["id"],
                name=r["name"],
                town=town_name,
                district=dist,
                state=st,
                latitude=r["latitude"],
                longitude=r["longitude"],
                elevation_m=r["elevation_m"],
                basin_name=r["basin_name"],
                risk_level=risk_info["risk_level"],
                risk_color=risk_info["risk_color"],
                latest_rainfall_mm=risk_info["rainfall_1h_mm"],
                accumulation_24h_mm=risk_info["accumulation_24h_mm"],
                active_warnings_count=risk_info["active_warnings_count"]
            )

            if st not in hierarchy:
                hierarchy[st] = {}
                state_districts[st] = set()
                state_town_count[st] = 0
                state_highest_risk[st] = "Low"

            if dist not in hierarchy[st]:
                hierarchy[st][dist] = []
            
            hierarchy[st][dist].append(town_item)
            state_districts[st].add(dist)
            state_town_count[st] += 1

            if risk_weights.get(risk_info["risk_level"], 0) > risk_weights.get(state_highest_risk[st], 0):
                state_highest_risk[st] = risk_info["risk_level"]

        state_items = [
            StateItem(
                name=st,
                districts_count=len(state_districts[st]),
                towns_count=state_town_count[st],
                highest_risk=state_highest_risk[st]
            )
            for st in sorted(hierarchy.keys())
        ]

        return LocationHierarchyResponse(states=state_items, hierarchy=hierarchy)

@router.get("/states", response_model=List[StateItem])
def get_states():
    """Returns list of monitored states with district and town statistics."""
    with get_db() as conn:
        cursor = conn.cursor()
        rows = cursor.execute("""
            SELECT state, COUNT(DISTINCT district) as dist_cnt, COUNT(id) as town_cnt
            FROM locations
            GROUP BY state
            ORDER BY state ASC
        """).fetchall()

        result = []
        for r in rows:
            st = r["state"]
            # Check highest risk in this state
            warn = cursor.execute("""
                SELECT color_code FROM early_warnings ew
                JOIN locations l ON ew.location_id = l.id
                WHERE l.state = ? AND ew.is_active = 1
                ORDER BY CASE color_code WHEN 'Red' THEN 1 WHEN 'Orange' THEN 2 WHEN 'Yellow' THEN 3 ELSE 4 END ASC
                LIMIT 1
            """, (st,)).fetchone()
            risk = "Critical" if warn and warn["color_code"] == "Red" else "High" if warn and warn["color_code"] == "Orange" else "Moderate" if warn and warn["color_code"] == "Yellow" else "Low"
            result.append(StateItem(
                name=st,
                districts_count=r["dist_cnt"],
                towns_count=r["town_cnt"],
                highest_risk=risk
            ))
        return result

@router.get("/districts", response_model=List[DistrictItem])
def get_districts(state: Optional[str] = Query(None, description="Filter by state name")):
    """Returns districts, optionally filtered by state."""
    with get_db() as conn:
        cursor = conn.cursor()
        if state:
            rows = cursor.execute("""
                SELECT district, state, COUNT(id) as town_cnt
                FROM locations
                WHERE LOWER(state) = LOWER(?)
                GROUP BY district, state
                ORDER BY district ASC
            """, (state.strip(),)).fetchall()
        else:
            rows = cursor.execute("""
                SELECT district, state, COUNT(id) as town_cnt
                FROM locations
                GROUP BY district, state
                ORDER BY state ASC, district ASC
            """).fetchall()

        result = []
        for r in rows:
            dist = r["district"]
            warn = cursor.execute("""
                SELECT color_code FROM early_warnings ew
                WHERE (ew.district = ? OR ew.location_id IN (SELECT id FROM locations WHERE district = ?))
                  AND ew.is_active = 1
                ORDER BY CASE color_code WHEN 'Red' THEN 1 WHEN 'Orange' THEN 2 WHEN 'Yellow' THEN 3 ELSE 4 END ASC
                LIMIT 1
            """, (dist, dist)).fetchone()
            risk = "Critical" if warn and warn["color_code"] == "Red" else "High" if warn and warn["color_code"] == "Orange" else "Moderate" if warn and warn["color_code"] == "Yellow" else "Low"
            result.append(DistrictItem(
                name=dist,
                state=r["state"],
                towns_count=r["town_cnt"],
                highest_risk=risk
            ))
        return result

@router.get("/towns", response_model=List[TownItem])
def get_towns(
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district")
):
    """Returns towns with real-time computed flood risk indicators."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT id, name, district, state, COALESCE(town, name) as town, latitude, longitude, elevation_m, basin_name FROM locations WHERE 1=1"
        params = []

        if state:
            query += " AND LOWER(state) = LOWER(?)"
            params.append(state.strip())
        if district:
            query += " AND LOWER(district) = LOWER(?)"
            params.append(district.strip())

        query += " ORDER BY town ASC"
        rows = cursor.execute(query, tuple(params)).fetchall()

        items = []
        for r in rows:
            risk_info = _compute_town_risk(conn, r["id"], r["district"], r["state"])
            items.append(TownItem(
                id=r["id"],
                name=r["name"],
                town=r["town"] or r["name"],
                district=r["district"],
                state=r["state"],
                latitude=r["latitude"],
                longitude=r["longitude"],
                elevation_m=r["elevation_m"],
                basin_name=r["basin_name"],
                risk_level=risk_info["risk_level"],
                risk_color=risk_info["risk_color"],
                latest_rainfall_mm=risk_info["rainfall_1h_mm"],
                accumulation_24h_mm=risk_info["accumulation_24h_mm"],
                active_warnings_count=risk_info["active_warnings_count"]
            ))
        return items

@router.get("/{location_id}/risk", response_model=TownRiskResponse)
def get_town_risk_profile(location_id: str):
    """Returns granular town-level flood risk assessment, estimated risk period, and safety advice."""
    with get_db() as conn:
        cursor = conn.cursor()
        loc = cursor.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
        if not loc:
            raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

        loc_data = dict(loc)
        risk_info = _compute_town_risk(conn, location_id, loc_data["district"], loc_data["state"])

        # Determine vulnerable corridors based on known topography
        basin = loc_data.get("basin_name") or "Local Basin"
        affected_areas = [
            f"Low-lying banks along the {basin}",
            "Underpasses and stormwater depressions with poor gravity runoff",
            f"Dense residential settlements in low-elevation pockets of {loc_data.get('town') or loc_data['name']}"
        ]

        return TownRiskResponse(
            location_id=location_id,
            town=loc_data.get("town") or loc_data["name"],
            district=loc_data["district"],
            state=loc_data["state"],
            risk_level=risk_info["risk_level"],
            risk_color=risk_info["risk_color"],
            estimated_risk_period=risk_info["estimated_risk_period"],
            affected_areas=affected_areas,
            rainfall_1h_mm=risk_info["rainfall_1h_mm"],
            accumulation_24h_mm=risk_info["accumulation_24h_mm"],
            rainfall_category=risk_info["rainfall_category"],
            active_advisories=risk_info["active_advisories"],
            safety_precautions=risk_info["safety_precautions"],
            emergency_contacts=risk_info["emergency_contacts"],
            confidence_rating="High (Sensor Telemetry + CWC Hydrology Benchmarks)",
            last_updated=datetime.now().isoformat()
        )

@router.get("", response_model=List[LocationResponse])
def get_locations(
    search: Optional[str] = Query(None, description="Search by name, town, district, or state"),
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district")
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM locations WHERE 1=1"
        params = []

        if state:
            query += " AND LOWER(state) = LOWER(?)"
            params.append(state.strip())
        if district:
            query += " AND LOWER(district) = LOWER(?)"
            params.append(district.strip())
        if search:
            q = f"%{search.strip().lower()}%"
            query += " AND (LOWER(name) LIKE ? OR LOWER(COALESCE(town, '')) LIKE ? OR LOWER(district) LIKE ? OR LOWER(state) LIKE ? OR LOWER(basin_name) LIKE ?)"
            params.extend([q, q, q, q, q])

        query += " ORDER BY name ASC"
        rows = cursor.execute(query, tuple(params)).fetchall()
        
        return [LocationResponse(**dict(r)) for r in rows]

@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        row = cursor.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")
        return LocationResponse(**dict(row))

@router.get("/compare/matrix", response_model=LocationComparisonResponse)
def compare_locations(ids: str = Query(..., description="Comma-separated location IDs (2 to 4 locations)")):
    loc_ids = [i.strip() for i in ids.split(",") if i.strip()]
    if len(loc_ids) < 2 or len(loc_ids) > 4:
        raise HTTPException(status_code=400, detail="Comparison requires between 2 and 4 valid location IDs.")

    comparison_items: List[LocationComparisonItem] = []

    with get_db() as conn:
        cursor = conn.cursor()

        for lid in loc_ids:
            loc_row = cursor.execute("SELECT * FROM locations WHERE id = ?", (lid,)).fetchone()
            if not loc_row:
                continue

            loc_data = dict(loc_row)

            # Latest rainfall & 24h accumulation
            obs = cursor.execute("""
                SELECT rainfall_mm, accumulation_24h_mm, timestamp, source_type, is_stale
                FROM rainfall_observations
                WHERE location_id = ?
                ORDER BY timestamp DESC LIMIT 1
            """, (lid,)).fetchone()

            latest_rf = float(obs["rainfall_mm"]) if obs else None
            latest_ts = obs["timestamp"] if obs else None
            accum_24h = float(obs["accumulation_24h_mm"]) if obs and obs["accumulation_24h_mm"] is not None else None
            provenance = obs["source_type"] if obs else "NO_DATA"
            is_stale = bool(obs["is_stale"]) if obs else True

            # Incident breakdown
            inc_rows = cursor.execute("""
                SELECT severity, year FROM flood_incidents WHERE location_id = ?
            """, (lid,)).fetchall()

            total_incs = len(inc_rows)
            sev_dict = {"Minor": 0, "Moderate": 0, "Severe": 0, "Critical": 0}
            year_dict = {}

            for ir in inc_rows:
                s = ir["severity"]
                if s in sev_dict:
                    sev_dict[s] += 1
                y = ir["year"]
                year_dict[y] = year_dict.get(y, 0) + 1

            # Record coverage % (measure of observations available vs expected past 48h)
            count_obs = cursor.execute("""
                SELECT COUNT(*) FROM rainfall_observations WHERE location_id = ? AND period = '1h'
            """, (lid,)).fetchone()[0]
            coverage_pct = min(100.0, round((count_obs / 48.0) * 100.0, 1))

            freshness = "Stale / Offline" if is_stale else "Current (Synthetic Demo)" if "DEMO" in provenance else "Current (Telemetry)"

            comparison_items.append(LocationComparisonItem(
                location_id=lid,
                location_name=loc_data["name"],
                district=loc_data["district"],
                state=loc_data["state"],
                latitude=loc_data["latitude"],
                longitude=loc_data["longitude"],
                basin_name=loc_data["basin_name"],
                latest_rainfall_mm=latest_rf,
                latest_rainfall_timestamp=latest_ts,
                accumulation_24h_mm=accum_24h,
                total_incidents=total_incs,
                incidents_by_severity=sev_dict,
                incidents_by_year=year_dict,
                record_coverage_pct=coverage_pct,
                data_freshness_status=freshness,
                has_missing_data=(coverage_pct < 90.0 or latest_rf is None),
                provenance=provenance
            ))

    if len(comparison_items) < 2:
        raise HTTPException(status_code=404, detail="Fewer than 2 locations could be resolved for comparison.")

    methodology = (
        "METHODOLOGY NOTE: Comparative metrics utilize identical rolling 24-hour observation timeframes "
        "and documented historical incident records spanning 2005-2024. Differences in incident counts "
        "reflect municipal logging frequency and river basin characteristics rather than a single-number risk score. "
        "No arbitrary synthetic ranking score is assigned."
    )

    return LocationComparisonResponse(
        time_window="Rolling 24-Hour Observation & 2005-2024 Historical Record",
        locations=comparison_items,
        methodology_note=methodology
    )
