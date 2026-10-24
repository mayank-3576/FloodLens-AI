import os
import hashlib
import secrets
import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..database import get_db

security = HTTPBearer(auto_error=False)

# In-memory rate limiting for failed login attempts
# Format: {identifier: [timestamp1, timestamp2, ...]}
_FAILED_LOGINS: Dict[str, list[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 300  # 5 minutes
RATE_LIMIT_MAX_ATTEMPTS = 5

def hash_password(password: str) -> str:
    """Hashes a password using NIST-approved salted scrypt."""
    salt = secrets.token_bytes(16)
    key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
        maxmem=0,
        dklen=32
    )
    return f"scrypt$16384$8$1${salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored scrypt hash in constant time."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 6 or parts[0] != "scrypt":
            return False
        n = int(parts[1])
        r = int(parts[2])
        p = int(parts[3])
        salt = bytes.fromhex(parts[4])
        expected_key = bytes.fromhex(parts[5])

        derived_key = hashlib.scrypt(
            plain_password.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p,
            maxmem=0,
            dklen=len(expected_key)
        )
        return hmac.compare_digest(derived_key, expected_key)
    except Exception:
        return False

def check_login_rate_limit(identifier: str):
    """Enforces rate limiting on consecutive failed logins."""
    now = datetime.now(timezone.utc).timestamp()
    attempts = _FAILED_LOGINS.get(identifier, [])
    # Filter attempts within the window
    attempts = [t for t in attempts if now - t < RATE_LIMIT_WINDOW_SECONDS]
    _FAILED_LOGINS[identifier] = attempts

    if len(attempts) >= RATE_LIMIT_MAX_ATTEMPTS:
        remaining = int(RATE_LIMIT_WINDOW_SECONDS - (now - attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {max(remaining, 1)} seconds."
        )

def record_failed_login(identifier: str):
    now = datetime.now(timezone.utc).timestamp()
    attempts = _FAILED_LOGINS.get(identifier, [])
    attempts.append(now)
    _FAILED_LOGINS[identifier] = attempts

def clear_failed_logins(identifier: str):
    if identifier in _FAILED_LOGINS:
        del _FAILED_LOGINS[identifier]

def hash_token(token: str) -> str:
    """Hashes the bearer session token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_session(conn, user_id: str, days_valid: int = 7) -> str:
    """Generates a cryptographically strong session token and records it in SQLite."""
    raw_token = secrets.token_hex(32)
    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=days_valid)).isoformat()

    conn.execute(
        """
        INSERT INTO sessions (token_hash, user_id, expires_at, created_at, is_revoked)
        VALUES (?, ?, ?, ?, 0);
        """,
        (token_hash, user_id, expires_at, now.isoformat())
    )
    return raw_token

def revoke_session(conn, token: str):
    """Revokes the given session token."""
    token_hash = hash_token(token)
    conn.execute(
        "UPDATE sessions SET is_revoked = 1 WHERE token_hash = ?;",
        (token_hash,)
    )

def log_audit_action(
    conn,
    user_id: Optional[str],
    username: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None
):
    """Appends an event to the audit_logs table."""
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO audit_logs (user_id, username, action, target_type, target_id, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """,
        (user_id, username, action, target_type, target_id, details, now)
    )

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """Authenticates the incoming bearer token and returns the active user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    token_hash = hash_token(token)
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT s.token_hash, s.user_id, s.expires_at, s.is_revoked,
                   u.id, u.username, u.email, u.role, u.full_name, u.is_active, u.created_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token_hash = ? AND s.is_revoked = 0 AND s.expires_at > ?;
            """,
            (token_hash, now_iso)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session is invalid or expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"}
            )

        if not row["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact an administrator."
            )

        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
            "full_name": row["full_name"],
            "is_active": bool(row["is_active"]),
            "created_at": row["created_at"],
            "raw_token": token
        }

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Returns the user if authenticated, else None."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None

def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Ensures the authenticated user has the 'admin' role."""
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrative role required."
        )
    return user
