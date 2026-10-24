import json
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from ..database import get_db
from ..models import (
    EarlyWarningItem, MultiStageWarningResponse,
    UserSubscriptionUpdate, UserSubscriptionResponse,
    UserNotificationItem, EarlyWarningCreate
)
from ..services.auth_service import get_current_user, require_admin, get_optional_user, log_audit_action

router = APIRouter(prefix="/api/warnings", tags=["Multi-Stage Flood Early Warnings & Alerts"])

def parse_warning_row(row) -> EarlyWarningItem:
    indicators = {}
    try:
        indicators = json.loads(row["hydrological_indicators"])
    except Exception:
        indicators = {}

    guidance = []
    try:
        guidance = json.loads(row["preparedness_guidance"])
    except Exception:
        guidance = []

    now_iso = datetime.now(timezone.utc).isoformat()
    is_expired = row["valid_to"] < now_iso

    return EarlyWarningItem(
        id=row["id"],
        stage=row["stage"],
        location_id=row["location_id"],
        location_name=row["location_name"],
        district=row["district"],
        basin_name=row["basin_name"],
        severity_level=row["severity_level"],
        color_code=row["color_code"],
        title=row["title"],
        summary=row["summary"],
        hydrological_indicators=indicators,
        preparedness_guidance=guidance,
        source_agency=row["source_agency"],
        source_url=row["source_url"],
        provenance_type=row["provenance_type"],
        confidence_uncertainty=row["confidence_uncertainty"],
        issued_at=row["issued_at"],
        valid_from=row["valid_from"],
        valid_to=row["valid_to"],
        is_active=bool(row["is_active"]) and not is_expired,
        is_expired=is_expired
    )

@router.get("/multi-stage", response_model=MultiStageWarningResponse)
def get_multi_stage_warnings(location_id: Optional[str] = None):
    """
    Returns structured flood advisories across 3 distinct operational horizons:
    1. Short-Range Warnings (0–72 Hours): Verified official alerts (IMD, CWC, SDMA)
    2. Medium-Range Monitoring (3–7 Days): River basin advisories and 5-day precipitation forecasts
    3. Early Outlook (7–14 Days): Extended atmospheric outlooks with explicit uncertainty bounds
    """
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM early_warnings WHERE is_active = 1"
        params = []
        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)
        query += " ORDER BY valid_to DESC;"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        short_range: List[EarlyWarningItem] = []
        medium_range: List[EarlyWarningItem] = []
        early_outlook: List[EarlyWarningItem] = []

        for row in rows:
            item = parse_warning_row(row)
            if item.stage == "short_range":
                short_range.append(item)
            elif item.stage == "medium_range":
                medium_range.append(item)
            elif item.stage == "early_outlook":
                early_outlook.append(item)

        now_iso = datetime.now(timezone.utc).isoformat()

        methodology_notes = {
            "early_outlook_disclaimer": "CRITICAL: Extended-range (7–14 day) atmospheric outlooks convey broad circulation patterns and large-scale precipitation anomalies. They are NOT guaranteed flood forecasts and do NOT constitute confirmed alerts.",
            "medium_range_methodology": "Medium-range (3–7 day) hydrological monitoring integrates CWC river basin status, antecedent catchment soil moisture, and numerical weather prediction accumulation ensembles.",
            "short_range_authority": "Short-range (0–72 hour) alerts reflect verified color-coded bulletins issued by the India Meteorological Department (IMD) and Central Water Commission (CWC). Always follow civil defense and disaster authority instructions."
        }

        return MultiStageWarningResponse(
            short_range=short_range,
            medium_range=medium_range,
            early_outlook=early_outlook,
            methodology_notes=methodology_notes,
            last_synced_at=now_iso
        )

@router.get("/subscriptions", response_model=UserSubscriptionResponse)
def get_subscriptions(current_user: dict = Depends(get_current_user)):
    """Returns the monitored locations and alert preferences for the authenticated user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT location_id, notify_short_range, notify_medium_range, notify_early_outlook, channels
            FROM user_alert_subscriptions
            WHERE user_id = ?;
            """,
            (current_user["id"],)
        )
        rows = cursor.fetchall()

        loc_ids = [r["location_id"] for r in rows]
        notify_short = rows[0]["notify_short_range"] if rows else 1
        notify_med = rows[0]["notify_medium_range"] if rows else 1
        notify_early = rows[0]["notify_early_outlook"] if rows else 0
        channels = ["in_app"]
        if rows and rows[0]["channels"]:
            try:
                channels = json.loads(rows[0]["channels"])
            except Exception:
                channels = ["in_app"]

        return UserSubscriptionResponse(
            user_id=current_user["id"],
            subscribed_location_ids=loc_ids,
            notify_short_range=bool(notify_short),
            notify_medium_range=bool(notify_med),
            notify_early_outlook=bool(notify_early),
            channels=channels
        )

@router.post("/subscriptions", response_model=UserSubscriptionResponse)
def update_subscriptions(
    req: UserSubscriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Updates the user's monitored locations and notification preferences."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_alert_subscriptions WHERE user_id = ?;", (current_user["id"],))

        channels_json = json.dumps(req.channels)
        now_iso = datetime.now(timezone.utc).isoformat()

        for loc_id in req.location_ids:
            cursor.execute(
                """
                INSERT INTO user_alert_subscriptions (
                    user_id, location_id, notify_short_range, notify_medium_range,
                    notify_early_outlook, channels, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    current_user["id"],
                    loc_id,
                    1 if req.notify_short_range else 0,
                    1 if req.notify_medium_range else 0,
                    1 if req.notify_early_outlook else 0,
                    channels_json,
                    now_iso
                )
            )

        log_audit_action(
            conn,
            user_id=current_user["id"],
            username=current_user["username"],
            action="UPDATE_ALERT_SUBSCRIPTIONS",
            target_type="subscriptions",
            target_id=current_user["id"],
            details=f"Subscribed to {len(req.location_ids)} locations"
        )

        return UserSubscriptionResponse(
            user_id=current_user["id"],
            subscribed_location_ids=req.location_ids,
            notify_short_range=req.notify_short_range,
            notify_medium_range=req.notify_medium_range,
            notify_early_outlook=req.notify_early_outlook,
            channels=req.channels
        )

@router.get("/notifications", response_model=List[UserNotificationItem])
def get_user_notifications(current_user: dict = Depends(get_current_user)):
    """Returns in-app notifications and broadcast history for the current user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM user_notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50;
            """,
            (current_user["id"],)
        )
        rows = cursor.fetchall()
        return [
            UserNotificationItem(
                id=r["id"],
                user_id=r["user_id"],
                warning_id=r["warning_id"],
                title=r["title"],
                message=r["message"],
                severity_level=r["severity_level"],
                stage=r["stage"],
                is_read=bool(r["is_read"]),
                delivery_channel=r["delivery_channel"],
                created_at=r["created_at"]
            )
            for r in rows
        ]

@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Marks a single notification as read."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?;",
            (notification_id, current_user["id"])
        )
    return {"status": "success", "id": notification_id}

@router.post("/notifications/mark-all-read")
def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Marks all notifications as read for the user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE user_notifications SET is_read = 1 WHERE user_id = ?;",
            (current_user["id"],)
        )
    return {"status": "success", "message": "All notifications marked as read."}

@router.post("/broadcast", response_model=EarlyWarningItem)
def admin_broadcast_warning(
    req: EarlyWarningCreate,
    admin_user: dict = Depends(require_admin)
):
    """
    Administrative portal endpoint to issue an official early warning or emergency bulletin.
    Dispatches notifications to all citizens subscribed to the affected location.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Fetch location details
        cursor.execute("SELECT name, district, basin_name FROM locations WHERE id = ?;", (req.location_id,))
        loc_row = cursor.fetchone()
        if not loc_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target location '{req.location_id}' not found."
            )

        warning_id = f"wrn_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        cursor.execute(
            """
            INSERT INTO early_warnings (
                id, stage, location_id, location_name, district, basin_name,
                severity_level, color_code, title, summary, hydrological_indicators,
                preparedness_guidance, source_agency, source_url, provenance_type,
                confidence_uncertainty, issued_at, valid_from, valid_to, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);
            """,
            (
                warning_id,
                req.stage,
                req.location_id,
                loc_row["name"],
                loc_row["district"],
                loc_row["basin_name"],
                req.severity_level,
                req.color_code,
                req.title.strip(),
                req.summary.strip(),
                json.dumps(req.hydrological_indicators),
                json.dumps(req.preparedness_guidance),
                req.source_agency.strip(),
                req.source_url.strip(),
                req.provenance_type.strip(),
                req.confidence_uncertainty.strip(),
                now_iso,
                req.valid_from,
                req.valid_to,
                now_iso
            )
        )

        # Dispatch notifications to subscribed citizens (avoiding duplicates)
        cursor.execute(
            """
            SELECT DISTINCT user_id FROM user_alert_subscriptions
            WHERE location_id = ?;
            """,
            (req.location_id,)
        )
        sub_users = cursor.fetchall()
        for u in sub_users:
            notif_id = f"notif_{uuid.uuid4().hex[:10]}"
            cursor.execute(
                """
                INSERT INTO user_notifications (
                    id, user_id, warning_id, title, message,
                    severity_level, stage, is_read, delivery_channel, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'in_app', ?);
                """,
                (
                    notif_id,
                    u["user_id"],
                    warning_id,
                    f"[{req.color_code.upper()} ALERT] {req.title}",
                    req.summary[:200],
                    req.severity_level,
                    req.stage,
                    now_iso
                )
            )

        log_audit_action(
            conn,
            user_id=admin_user["id"],
            username=admin_user["username"],
            action="BROADCAST_EARLY_WARNING",
            target_type="early_warning",
            target_id=warning_id,
            details=f"Broadcasted {req.stage} warning for {loc_row['name']} ({req.severity_level})"
        )

        cursor.execute("SELECT * FROM early_warnings WHERE id = ?;", (warning_id,))
        row = cursor.fetchone()
        return parse_warning_row(row)
