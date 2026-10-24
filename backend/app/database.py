import os
import sqlite3
from typing import Generator
from contextlib import contextmanager

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "girirakshak.db")

os.makedirs(DATA_DIR, exist_ok=True)

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes SQLite tables and indexes."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Locations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS locations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                district TEXT NOT NULL,
                state TEXT NOT NULL,
                town TEXT NOT NULL DEFAULT '',
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                elevation_m REAL,
                basin_name TEXT,
                has_dedicated_gauge INTEGER DEFAULT 1,
                data_coverage_note TEXT DEFAULT '',
                description TEXT,
                created_at TEXT NOT NULL
            );
        """)

        # Migration: Ensure 'town', 'has_dedicated_gauge', 'data_coverage_note' columns exist
        cursor.execute("PRAGMA table_info(locations);")
        columns = [row[1] for row in cursor.fetchall()]
        if "town" not in columns:
            cursor.execute("ALTER TABLE locations ADD COLUMN town TEXT DEFAULT '';")
        if "has_dedicated_gauge" not in columns:
            cursor.execute("ALTER TABLE locations ADD COLUMN has_dedicated_gauge INTEGER DEFAULT 1;")
        if "data_coverage_note" not in columns:
            cursor.execute("ALTER TABLE locations ADD COLUMN data_coverage_note TEXT DEFAULT '';")

        # 2. Data Sources
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS data_sources (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                source_url TEXT NOT NULL,
                coverage TEXT NOT NULL,
                date_range TEXT NOT NULL,
                last_retrieval TEXT NOT NULL,
                last_observation TEXT NOT NULL,
                data_type TEXT NOT NULL,
                units TEXT NOT NULL,
                update_frequency TEXT NOT NULL,
                limitations TEXT NOT NULL,
                status TEXT NOT NULL
            );
        """)

        # 3. Rainfall Observations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rainfall_observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                rainfall_mm REAL NOT NULL,
                period TEXT NOT NULL,
                accumulation_24h_mm REAL,
                source_type TEXT NOT NULL,
                data_source_id TEXT,
                is_stale INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
                FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
            );
        """)

        # 4. Flood Incidents
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flood_incidents (
                incident_id TEXT PRIMARY KEY,
                location_id TEXT NOT NULL,
                location_name TEXT NOT NULL,
                district TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                incident_date TEXT NOT NULL,
                year INTEGER NOT NULL,
                severity TEXT NOT NULL,
                event_description TEXT NOT NULL,
                reported_impact TEXT,
                water_level_m REAL,
                data_source TEXT NOT NULL,
                source_url TEXT NOT NULL,
                provenance_type TEXT NOT NULL,
                last_updated TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
            );
        """)

        # 5. Dataset Imports
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dataset_imports (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                records_count INTEGER NOT NULL,
                valid_records INTEGER NOT NULL,
                invalid_records INTEGER NOT NULL,
                status TEXT NOT NULL,
                error_summary TEXT,
                imported_at TEXT NOT NULL
            );
        """)

        # 6. Users (Admin and Common Man / Citizen)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'citizen')),
                full_name TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # 7. Sessions (Secure expiring authentication tokens)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                is_revoked INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 8. Community Flood Reports (Crowdsourced citizen reports with deduplication)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_reports (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                reporter_name TEXT NOT NULL,
                location_id TEXT,
                location_name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                incident_date TEXT NOT NULL,
                water_level_m REAL,
                severity TEXT NOT NULL CHECK(severity IN ('Low', 'Moderate', 'High', 'Critical')),
                description TEXT NOT NULL,
                photo_data TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
                admin_notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 9. Audit Logs (Administrative and security action trails)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                username TEXT NOT NULL,
                action TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id TEXT,
                details TEXT,
                timestamp TEXT NOT NULL
            );
        """)

        # 10. Multi-Stage Flood Early Warnings & Advisories
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS early_warnings (
                id TEXT PRIMARY KEY,
                stage TEXT NOT NULL CHECK(stage IN ('short_range', 'medium_range', 'early_outlook')),
                location_id TEXT NOT NULL,
                location_name TEXT NOT NULL,
                district TEXT NOT NULL,
                basin_name TEXT,
                severity_level TEXT NOT NULL,
                color_code TEXT NOT NULL CHECK(color_code IN ('Green', 'Yellow', 'Orange', 'Red')),
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                hydrological_indicators TEXT NOT NULL,
                preparedness_guidance TEXT NOT NULL,
                source_agency TEXT NOT NULL,
                source_url TEXT NOT NULL,
                provenance_type TEXT NOT NULL,
                confidence_uncertainty TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                valid_from TEXT NOT NULL,
                valid_to TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
            );
        """)

        # 11. User Alert Subscriptions (Location monitoring preferences)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_alert_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                location_id TEXT NOT NULL,
                notify_short_range INTEGER DEFAULT 1,
                notify_medium_range INTEGER DEFAULT 1,
                notify_early_outlook INTEGER DEFAULT 0,
                channels TEXT DEFAULT '["in_app"]',
                created_at TEXT NOT NULL,
                UNIQUE(user_id, location_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
            );
        """)

        # 12. User Notifications (In-app alert delivery and history)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                warning_id TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                severity_level TEXT NOT NULL,
                stage TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                delivery_channel TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (warning_id) REFERENCES early_warnings(id) ON DELETE CASCADE
            );
        """)

        # 13. Data Provider Sync Logs (Freshness and health monitor)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS provider_sync_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_name TEXT NOT NULL,
                sync_type TEXT NOT NULL,
                status TEXT NOT NULL,
                records_ingested INTEGER NOT NULL,
                error_message TEXT,
                duration_ms INTEGER,
                synced_at TEXT NOT NULL
            );
        """)

        # Create Indexes for high-performance geospatial, time-series, auth, and warning queries
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rainfall_loc_time ON rainfall_observations(location_id, timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_loc ON flood_incidents(location_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_year ON flood_incidents(year);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_severity ON flood_incidents(severity);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_locations_district ON locations(district);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_locations_hierarchy ON locations(state, district, town);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_community_reports_user ON community_reports(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_warnings_stage ON early_warnings(stage);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_warnings_location ON early_warnings(location_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_warnings_active ON early_warnings(is_active);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_alert_subscriptions(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sync_logs_provider ON provider_sync_logs(provider_name);")

if __name__ == "__main__":
    init_db()
    print("Database schema successfully initialized.")
