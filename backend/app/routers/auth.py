import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from ..database import get_db
from ..models import UserRegisterRequest, UserLoginRequest, UserResponse, AuthTokenResponse
from ..services.auth_service import (
    hash_password, verify_password, create_session, revoke_session,
    check_login_rate_limit, record_failed_login, clear_failed_logins,
    log_audit_action, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_citizen(req: UserRegisterRequest):
    """
    Public registration endpoint. Exclusively registers users with the 'citizen' role.
    Administrative accounts cannot be self-registered.
    """
    clean_username = req.username.strip().lower()
    clean_email = req.email.strip().lower()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?;",
            (clean_username, clean_email)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with that username or email address already exists."
            )

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        hashed_pw = hash_password(req.password)

        cursor.execute(
            """
            INSERT INTO users (id, username, email, hashed_password, role, full_name, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'citizen', ?, 1, ?, ?);
            """,
            (user_id, clean_username, clean_email, hashed_pw, req.full_name.strip(), now, now)
        )

        token = create_session(conn, user_id)
        log_audit_action(
            conn,
            user_id=user_id,
            username=clean_username,
            action="USER_REGISTERED",
            target_type="user",
            target_id=user_id,
            details=f"Citizen registration for {clean_username} ({clean_email})"
        )

        user_resp = UserResponse(
            id=user_id,
            username=clean_username,
            email=clean_email,
            role="citizen",
            full_name=req.full_name.strip(),
            is_active=True,
            created_at=now
        )

        return AuthTokenResponse(
            token=token,
            token_type="Bearer",
            user=user_resp,
            message="Citizen account created successfully."
        )

@router.post("/login", response_model=AuthTokenResponse)
def login(req: UserLoginRequest):
    """
    Authenticates a user (Admin or Citizen) using rate-limited password verification.
    Validates actual database role and enforces security boundaries.
    """
    identifier = req.identifier.strip().lower()
    check_login_rate_limit(identifier)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, username, email, hashed_password, role, full_name, is_active, created_at
            FROM users
            WHERE LOWER(username) = ? OR LOWER(email) = ?;
            """,
            (identifier, identifier)
        )
        row = cursor.fetchone()

        if not row or not verify_password(req.password, row["hashed_password"]):
            record_failed_login(identifier)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password."
            )

        # Enforce server-side role verification
        actual_role = row["role"]
        if req.selected_role and req.selected_role.lower() != actual_role:
            record_failed_login(identifier)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role mismatch: This account has '{actual_role.capitalize()}' permissions. Please select the correct role tab to sign in."
            )

        if not row["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact platform administration."
            )

        # Successful authentication - clear rate limit counter
        clear_failed_logins(identifier)

        token = create_session(conn, row["id"])
        log_audit_action(
            conn,
            user_id=row["id"],
            username=row["username"],
            action="USER_LOGIN",
            target_type="session",
            target_id=row["id"],
            details=f"Successful login as {actual_role}"
        )

        user_resp = UserResponse(
            id=row["id"],
            username=row["username"],
            email=row["email"],
            role=row["role"],
            full_name=row["full_name"],
            is_active=bool(row["is_active"]),
            created_at=row["created_at"]
        )

        return AuthTokenResponse(
            token=token,
            token_type="Bearer",
            user=user_resp,
            message=f"Welcome back, {row['full_name']}! Signed in as {actual_role}."
        )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        role=current_user["role"],
        full_name=current_user["full_name"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Revokes the active session token."""
    with get_db() as conn:
        revoke_session(conn, current_user["raw_token"])
        log_audit_action(
            conn,
            user_id=current_user["id"],
            username=current_user["username"],
            action="USER_LOGOUT",
            target_type="session",
            target_id=current_user["id"],
            details="User logged out and session revoked."
        )
    return {"message": "Logged out successfully. Session revoked."}
