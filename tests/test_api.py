import os
import sys
import pytest
import io
import json
from fastapi.testclient import TestClient

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
from backend.app.database import init_db
from scripts.seed_db import seed

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database schema is fresh and seeded before running tests."""
    init_db()
    seed()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "GIRIRAKSHAK AI" in data["service"]

def test_dashboard_summary(client):
    response = client.get("/api/dashboard/summary?location_id=noida")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "latest_rainfall" in data["metrics"]
    assert "accumulation_24h" in data["metrics"]
    assert "historical_incidents" in data["metrics"]
    assert len(data["rainfall_trend_24h"]) > 0
    assert len(data["incidents_by_year"]) > 0
    assert len(data["location_rainfall"]) >= 5
    assert "not an official flood forecast" in data["disclaimer"]

def test_locations_list_and_search(client):
    response = client.get("/api/locations")
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) >= 8

    # Search for Noida
    search_resp = client.get("/api/locations?search=noida")
    assert search_resp.status_code == 200
    res = search_resp.json()
    assert len(res) >= 1
    assert "Noida" in res[0]["name"]

def test_rainfall_trends_and_aggregation(client):
    response = client.get("/api/rainfall/trends?location_id=noida&range_type=24h")
    assert response.status_code == 200
    data = response.json()
    assert data["location_id"] == "noida"
    stats = data["stats"]
    assert stats["observation_count"] > 0
    assert stats["max_mm"] >= 0
    assert stats["avg_mm"] >= 0
    assert stats["data_provenance"] in ["DEMO_SYNTHETIC", "LIVE_API", "HISTORICAL_PUBLIC"]
    assert len(data["trends"]) > 0

def test_flood_incidents_filtering(client):
    # Filter by district
    response = client.get("/api/flood-incidents?district=Central%20Delhi")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["district"] == "Central Delhi"
        assert item["provenance_type"] in ["HISTORICAL_PUBLIC", "DEMO_SYNTHETIC"]

    # Filter by severity
    crit_resp = client.get("/api/flood-incidents?severity=Critical")
    assert crit_resp.status_code == 200
    crit_data = crit_resp.json()
    assert crit_data["total"] >= 1
    for item in crit_data["items"]:
        assert item["severity"] == "Critical"

def test_location_comparison(client):
    response = client.get("/api/locations/compare/matrix?ids=noida,ghaziabad,delhi_yamuna")
    assert response.status_code == 200
    data = response.json()
    assert len(data["locations"]) == 3
    assert "METHODOLOGY NOTE" in data["methodology_note"]
    for loc in data["locations"]:
        assert loc["record_coverage_pct"] > 0
        assert loc["total_incidents"] >= 0
        assert loc["latest_rainfall_mm"] is not None

def test_data_sources_and_geojson_reference(client):
    response = client.get("/api/data-sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) >= 5
    demo_source = next((s for s in sources if s["status"] == "Demo"), None)
    assert demo_source is not None
    assert "SYNTHETIC DEMO DATA" in demo_source["limitations"]

    geo_resp = client.get("/api/data-sources/geojson/reference")
    assert geo_resp.status_code == 200
    geojson = geo_resp.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) >= 4

def test_ai_assistant_grounded_queries(client):
    # Query 1: Latest rainfall
    payload = {"message": "What is the latest available rainfall for this area?", "location_id": "noida"}
    resp = client.post("/api/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "mm" in data["reply"]
    assert len(data["citations"]) > 0
    assert "DISCLAIMER" in data["disclaimer"]

    # Query 2: Why historical records cannot predict next flood
    payload2 = {"message": "Why can historical flood records not predict the next flood?"}
    resp2 = client.post("/api/assistant/chat", json=payload2)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert "Non-Stationarity" in data2["reply"] or "predict" in data2["reply"].lower()

    # Query 3: Comparison inquiry
    payload3 = {"message": "Compare rainfall and flood history in Noida and Ghaziabad."}
    resp3 = client.post("/api/assistant/chat", json=payload3)
    assert resp3.status_code == 200
    data3 = resp3.json()
    assert "Noida" in data3["reply"] and "Ghaziabad" in data3["reply"]

def test_csv_import_validation(client):
    # Invalid CSV with negative rainfall
    bad_csv = "location_id,timestamp,rainfall_mm\nnoida,2026-10-24T10:00:00,-15.0\n"
    resp = client.post(
        "/api/import/csv",
        files={"file": ("invalid_rainfall.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")},
        data={"dataset_type": "rainfall"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["rejected_records"] == 1
    assert data["status"] in ["failed", "partially_valid"]
    assert any("between 0.0 and 1500.0" in err["message"] for err in data["errors"])

    # Valid CSV import
    valid_csv = "location_id,timestamp,rainfall_mm,period\nnoida,2026-10-24T11:45:00,12.5,1h\n"
    resp_valid = client.post(
        "/api/import/csv",
        files={"file": ("valid_rainfall.csv", io.BytesIO(valid_csv.encode("utf-8")), "text/csv")},
        data={"dataset_type": "rainfall"}
    )
    assert resp_valid.status_code == 200
    data_valid = resp_valid.json()
    assert data_valid["accepted_records"] == 1
    assert data_valid["status"] == "completed"

def test_geojson_import_validation(client):
    # Invalid GeoJSON (not FeatureCollection)
    bad_geojson = json.dumps({"type": "Point", "coordinates": [77.39, 28.53]})
    resp = client.post(
        "/api/import/geojson",
        files={"file": ("test.geojson", io.BytesIO(bad_geojson.encode("utf-8")), "application/geo+json")}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "failed"
    assert any("FeatureCollection" in err["message"] for err in data["errors"])

# --- Authentication & Authorization Tests ---
def test_authentication_and_role_enforcement(client):
    # 1. Admin Login
    admin_login = client.post("/api/auth/login", json={
        "identifier": "admin",
        "password": "Admin@12345",
        "selected_role": "admin"
    })
    assert admin_login.status_code == 200
    admin_data = admin_login.json()
    admin_token = admin_data["token"]
    assert admin_data["user"]["role"] == "admin"

    # 2. Citizen Login
    citizen_login = client.post("/api/auth/login", json={
        "identifier": "citizen",
        "password": "Citizen@12345",
        "selected_role": "citizen"
    })
    assert citizen_login.status_code == 200
    citizen_data = citizen_login.json()
    citizen_token = citizen_data["token"]
    assert citizen_data["user"]["role"] == "citizen"

    # 3. Role Mismatch Prevention (Trying to login as Admin using Citizen account)
    mismatch_resp = client.post("/api/auth/login", json={
        "identifier": "citizen",
        "password": "Citizen@12345",
        "selected_role": "admin"
    })
    assert mismatch_resp.status_code == 403
    assert "Role mismatch" in mismatch_resp.json()["detail"]

    # 4. Role-based authorization: Citizen blocked from admin endpoints
    cit_admin_resp = client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert cit_admin_resp.status_code == 403
    assert "Administrative role required" in cit_admin_resp.json()["detail"]

    # 5. Admin allowed access to admin endpoints
    adm_stats_resp = client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert adm_stats_resp.status_code == 200
    stats = adm_stats_resp.json()
    assert stats["total_users"] >= 2
    assert stats["active_warnings"] >= 3

def test_citizen_registration_and_profile(client):
    new_username = "resident_rohit"
    new_email = "rohit@delhicivil.org"

    reg_resp = client.post("/api/auth/register", json={
        "username": new_username,
        "email": new_email,
        "password": "Password@123",
        "full_name": "Rohit Verma"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["user"]["role"] == "citizen"  # Server strictly enforces citizen role
    assert data["user"]["username"] == new_username
    token = data["token"]

    # Get Profile
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Rohit Verma"

def test_community_reports_workflow_and_deduplication(client):
    # Login as citizen
    cit_login = client.post("/api/auth/login", json={
        "identifier": "citizen",
        "password": "Citizen@12345"
    })
    token = cit_login.json()["token"]

    # Submit report with client_id for offline deduplication
    client_uuid = "client-offline-uuid-999"
    report_payload = {
        "client_id": client_uuid,
        "location_id": "delhi_yamuna",
        "location_name": "Old Railway Bridge Delhi",
        "latitude": 28.6562,
        "longitude": 77.2410,
        "incident_date": "2026-10-24",
        "water_level_m": 0.65,
        "severity": "High",
        "description": "Yamuna river water has reached the base of the lower service embankment road."
    }

    sub_resp = client.post(
        "/api/community-reports",
        json=report_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sub_resp.status_code == 200
    rep_data = sub_resp.json()
    assert rep_data["id"] == client_uuid
    assert rep_data["status"] == "pending"

    # Re-submitting identical report with same client_id returns existing record without duplication
    dup_resp = client.post(
        "/api/community-reports",
        json=report_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert dup_resp.status_code == 200
    assert dup_resp.json()["id"] == client_uuid

    # Citizen retrieves their submitted reports
    my_resp = client.get("/api/community-reports/my", headers={"Authorization": f"Bearer {token}"})
    assert my_resp.status_code == 200
    assert any(r["id"] == client_uuid for r in my_resp.json())

    # Admin approves the report
    adm_login = client.post("/api/auth/login", json={"identifier": "admin", "password": "Admin@12345"})
    adm_token = adm_login.json()["token"]

    patch_resp = client.patch(
        f"/api/admin/reports/{client_uuid}/status",
        json={"status": "approved", "admin_notes": "Verified against local CCTV gauge feed."},
        headers={"Authorization": f"Bearer {adm_token}"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "approved"

    # Verify public approved feed includes this report
    pub_resp = client.get("/api/community-reports/public")
    assert pub_resp.status_code == 200
    assert any(r["id"] == client_uuid for r in pub_resp.json())

def test_multi_stage_early_warnings_system(client):
    resp = client.get("/api/warnings/multi-stage")
    assert resp.status_code == 200
    data = resp.json()

    # 1. Short-Range (0–72 Hours)
    assert len(data["short_range"]) >= 1
    short_item = data["short_range"][0]
    assert short_item["stage"] == "short_range"
    assert short_item["color_code"] in ["Orange", "Yellow", "Red"]
    assert "current_water_level_m" in short_item["hydrological_indicators"]
    assert len(short_item["preparedness_guidance"]) > 0

    # 2. Medium-Range (3–7 Days)
    assert len(data["medium_range"]) >= 1
    med_item = data["medium_range"][0]
    assert med_item["stage"] == "medium_range"
    assert "forecast_rainfall_mm" in med_item["hydrological_indicators"]

    # 3. Early Outlook (7–14 Days)
    assert len(data["early_outlook"]) >= 1
    outlook_item = data["early_outlook"][0]
    assert outlook_item["stage"] == "early_outlook"
    assert "High Uncertainty" in outlook_item["confidence_uncertainty"]

    # 4. Methodology Notes explicitly disclaiming guaranteed forecasts
    assert "CRITICAL" in data["methodology_notes"]["early_outlook_disclaimer"]
    assert "NOT guaranteed flood forecasts" in data["methodology_notes"]["early_outlook_disclaimer"]

def test_user_alert_subscriptions_and_notifications(client):
    # Citizen login
    cit_login = client.post("/api/auth/login", json={"identifier": "citizen", "password": "Citizen@12345"})
    token = cit_login.json()["token"]

    # Update subscription
    sub_resp = client.post(
        "/api/warnings/subscriptions",
        json={
            "location_ids": ["delhi_yamuna", "ghaziabad", "noida"],
            "notify_short_range": True,
            "notify_medium_range": True,
            "notify_early_outlook": False,
            "channels": ["in_app"]
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sub_resp.status_code == 200
    sub_data = sub_resp.json()
    assert len(sub_data["subscribed_location_ids"]) == 3

    # View Notifications
    notif_resp = client.get("/api/warnings/notifications", headers={"Authorization": f"Bearer {token}"})
    assert notif_resp.status_code == 200
    notifications = notif_resp.json()
    assert len(notifications) >= 1
    notif_id = notifications[0]["id"]

    # Mark as read
    read_resp = client.patch(
        f"/api/warnings/notifications/{notif_id}/read",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert read_resp.status_code == 200

def test_admin_destructive_action_confirmation(client):
    adm_login = client.post("/api/auth/login", json={"identifier": "admin", "password": "Admin@12345"})
    token = adm_login.json()["token"]

    # First add a test rainfall record
    add_resp = client.post(
        "/api/admin/rainfall",
        json={
            "location_id": "noida",
            "timestamp": "2026-10-24T12:00:00",
            "rainfall_mm": 18.4,
            "period": "1h"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert add_resp.status_code == 200
    rec_id = add_resp.json()["id"]

    # Attempting to delete without confirm=true fails with 400
    fail_del = client.delete(
        f"/api/admin/rainfall/{rec_id}?confirm=false",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert fail_del.status_code == 400
    assert "Confirmation required" in fail_del.json()["detail"]

    # Deleting with confirm=true succeeds
    ok_del = client.delete(
        f"/api/admin/rainfall/{rec_id}?confirm=true",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert ok_del.status_code == 200
    assert ok_del.json()["status"] == "deleted"

def test_offline_sync_bundle(client):
    resp = client.get("/api/sync/bundle")
    assert resp.status_code == 200
    bundle = resp.json()
    assert bundle["offline_mode_ready"] is True
    assert len(bundle["locations"]) >= 8
    assert len(bundle["data_sources"]) >= 4
    assert len(bundle["recent_rainfall"]) > 0
    assert len(bundle["incidents"]) > 0
    assert len(bundle["early_warnings"]) >= 3
    assert "OFFLINE NOTICE" in bundle["offline_disclaimer"]

def test_location_hierarchy_and_town_risk(client):
    # 1. Full cascading hierarchy
    h_resp = client.get("/api/locations/hierarchy")
    assert h_resp.status_code == 200
    h_data = h_resp.json()
    assert len(h_data["states"]) >= 5
    assert "Delhi" in h_data["hierarchy"]
    assert "Central Delhi" in h_data["hierarchy"]["Delhi"]

    # 2. States list
    s_resp = client.get("/api/locations/states")
    assert s_resp.status_code == 200
    states = s_resp.json()
    assert any(s["name"] == "Uttar Pradesh" for s in states)

    # 3. Districts for UP
    d_resp = client.get("/api/locations/districts?state=Uttar%20Pradesh")
    assert d_resp.status_code == 200
    districts = d_resp.json()
    assert any(d["name"] == "Gautam Buddha Nagar" for d in districts)

    # 4. Towns for Gautam Buddha Nagar
    t_resp = client.get("/api/locations/towns?state=Uttar%20Pradesh&district=Gautam%20Buddha%20Nagar")
    assert t_resp.status_code == 200
    towns = t_resp.json()
    assert len(towns) >= 2
    assert any(t["id"] == "noida" for t in towns)

    # 5. Granular town risk profile
    r_resp = client.get("/api/locations/delhi_yamuna/risk")
    assert r_resp.status_code == 200
    risk = r_resp.json()
    assert risk["risk_level"] in ["Low", "Moderate", "High", "Critical"]
    assert "estimated_risk_period" in risk
    assert len(risk["safety_precautions"]) > 0
    assert len(risk["emergency_contacts"]) > 0

def test_improved_ai_assistant_inquiries(client):
    # 1. Flood risk inquiry
    resp_risk = client.post("/api/assistant/chat", json={"message": "What is the flood risk in Kashmere Gate right now?", "location_id": "delhi_yamuna"})
    assert resp_risk.status_code == 200
    assert "Risk" in resp_risk.json()["reply"]

    # 2. Prediction lead time inquiry
    resp_lead = client.post("/api/assistant/chat", json={"message": "What are the prediction lead times and forecast horizons?"})
    assert resp_lead.status_code == 200
    assert "Short-Range" in resp_lead.json()["reply"]
    assert "0 – 72 Hours" in resp_lead.json()["reply"]

    # 3. Actionable safety precautions
    resp_safety = client.post("/api/assistant/chat", json={"message": "What safety precautions and emergency helplines should I use?"})
    assert resp_safety.status_code == 200
    assert "112" in resp_safety.json()["reply"]
    assert "1070" in resp_safety.json()["reply"]

    # 4. Rainfall trends
    resp_trend = client.post("/api/assistant/chat", json={"message": "What is the 24-hour rainfall trend and IMD classification?", "location_id": "noida"})
    assert resp_trend.status_code == 200
    assert "Rainfall" in resp_trend.json()["reply"]

def test_admin_quality_performance_and_coverage(client):
    adm_login = client.post("/api/auth/login", json={"identifier": "admin", "password": "Admin@12345"})
    token = adm_login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Data Quality
    dq_resp = client.get("/api/admin/data-quality", headers=headers)
    assert dq_resp.status_code == 200
    dq = dq_resp.json()
    assert dq["total_observations"] > 0
    assert dq["completeness_score_pct"] > 80.0

    # Model Performance
    mp_resp = client.get("/api/admin/model-performance", headers=headers)
    assert mp_resp.status_code == 200
    mp = mp_resp.json()
    assert mp["overall_lead_time_score"] > 70.0
    assert len(mp["lead_time_horizons"]) == 3

    # Location Coverage
    lc_resp = client.get("/api/admin/location-coverage", headers=headers)
    assert lc_resp.status_code == 200
    lc = lc_resp.json()
    assert lc["total_states"] >= 30
    assert lc["total_towns"] >= 80

def test_multilingual_translation_and_languages(client):
    # Test supported languages endpoint
    lang_resp = client.get("/api/translate/languages")
    assert lang_resp.status_code == 200
    langs = lang_resp.json()
    assert len(langs) >= 13
    codes = [l["code"] for l in langs]
    for expected in ["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur"]:
        assert expected in codes

    # Test translate endpoint
    trans_resp = client.post("/api/translate", json={"text": "critical_risk", "target_lang": "hi"})
    assert trans_resp.status_code == 200
    assert "जोखिम" in trans_resp.json()["translated_text"]

    # Test localized safety bulletin
    bulletin_resp = client.post("/api/translate/bulletin", json={"risk_level": "Elevated", "language": "hi"})
    assert bulletin_resp.status_code == 200
    bulletin = bulletin_resp.json()
    assert len(bulletin["precautions"]) >= 4
    assert "112" in bulletin["emergency_contacts"]

    # Test multilingual assistant chat
    chat_resp = client.post("/api/assistant/chat", json={
        "message": "What is the flood risk in Kashmere Gate?",
        "language": "hi",
        "location_id": "delhi_yamuna"
    })
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert "अस्वीकरण" in chat_data["disclaimer"]

def test_data_sources_status_report(client):
    report_resp = client.get("/api/data-sources/status-report")
    assert report_resp.status_code == 200
    report = report_resp.json()
    assert "connected_sources" in report
    assert "credentials_required_sources" in report
    assert "location_coverage" in report
    assert report["location_coverage"]["total_tracked_towns"] >= 80
    assert report["location_coverage"]["coverage_completeness_pct"] == 100.0

def test_pan_india_36_states_uts_coverage(client):
    hier_resp = client.get("/api/locations/hierarchy")
    assert hier_resp.status_code == 200
    data = hier_resp.json()
    # 28 states + 8 UTs = 36 total
    assert len(data["states"]) == 36
    total_towns = sum(s["towns_count"] for s in data["states"])
    assert total_towns >= 81

