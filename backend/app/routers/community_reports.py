import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from ..database import get_db
from ..models import CommunityReportCreate, CommunityReportResponse
from ..services.auth_service import get_current_user, log_audit_action

router = APIRouter(prefix="/api/community-reports", tags=["Community Flood Reports"])

@router.post("", response_model=CommunityReportResponse)
def submit_community_report(
    req: CommunityReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits a community flood observation.
    Supports client_id for offline-first idempotency and deduplication.
    """
    report_id = req.client_id.strip() if req.client_id else f"crep_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()

        # Idempotency check: if report with this ID was already received, return it
        cursor.execute("SELECT * FROM community_reports WHERE id = ?;", (report_id,))
        existing = cursor.fetchone()
        if existing:
            return CommunityReportResponse(**dict(existing))

        cursor.execute(
            """
            INSERT INTO community_reports (
                id, user_id, reporter_name, location_id, location_name,
                latitude, longitude, incident_date, water_level_m,
                severity, description, photo_data, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?);
            """,
            (
                report_id,
                current_user["id"],
                current_user["full_name"],
                req.location_id,
                req.location_name.strip(),
                req.latitude,
                req.longitude,
                req.incident_date,
                req.water_level_m,
                req.severity,
                req.description.strip(),
                req.photo_data,
                now,
                now
            )
        )

        log_audit_action(
            conn,
            user_id=current_user["id"],
            username=current_user["username"],
            action="COMMUNITY_REPORT_SUBMITTED",
            target_type="community_report",
            target_id=report_id,
            details=f"Submitted report for {req.location_name} (Severity: {req.severity})"
        )

        cursor.execute("SELECT * FROM community_reports WHERE id = ?;", (report_id,))
        row = cursor.fetchone()
        return CommunityReportResponse(**dict(row))

@router.get("/my", response_model=List[CommunityReportResponse])
def get_my_submitted_reports(current_user: dict = Depends(get_current_user)):
    """Returns all flood incident reports submitted by the authenticated citizen."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM community_reports
            WHERE user_id = ?
            ORDER BY created_at DESC;
            """,
            (current_user["id"],)
        )
        rows = cursor.fetchall()
        return [CommunityReportResponse(**dict(r)) for r in rows]

@router.get("/public", response_model=List[CommunityReportResponse])
def get_public_approved_reports(location_id: Optional[str] = None):
    """Returns approved community reports for map display and public awareness."""
    with get_db() as conn:
        cursor = conn.cursor()
        if location_id:
            cursor.execute(
                """
                SELECT * FROM community_reports
                WHERE status = 'approved' AND location_id = ?
                ORDER BY incident_date DESC;
                """,
                (location_id,)
            )
        else:
            cursor.execute(
                """
                SELECT * FROM community_reports
                WHERE status = 'approved'
                ORDER BY incident_date DESC;
                """
            )
        rows = cursor.fetchall()
        return [CommunityReportResponse(**dict(r)) for r in rows]
