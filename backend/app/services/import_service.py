import csv
import io
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Tuple
from ..database import get_db
from ..models import ImportSummaryResponse, ValidationErrorDetail

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB safe limit

class ImportService:
    @staticmethod
    def validate_and_import_csv(filename: str, content: bytes, dataset_type: str = "rainfall") -> ImportSummaryResponse:
        import_id = f"imp_{uuid.uuid4().hex[:8]}"
        now_str = datetime.now().isoformat()
        
        if len(content) > MAX_FILE_SIZE_BYTES:
            return ImportSummaryResponse(
                import_id=import_id,
                filename=filename,
                file_type="csv",
                total_records=0,
                accepted_records=0,
                rejected_records=0,
                status="failed",
                errors=[ValidationErrorDetail(row=0, field="file_size", value=len(content), message="File exceeds 5MB upload limit.")]
            )

        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                text = content.decode("latin-1")
            except Exception as e:
                return ImportSummaryResponse(
                    import_id=import_id,
                    filename=filename,
                    file_type="csv",
                    total_records=0,
                    accepted_records=0,
                    rejected_records=0,
                    status="failed",
                    errors=[ValidationErrorDetail(row=0, field="encoding", value=None, message="File must be UTF-8 encoded text.")]
                )

        reader = csv.DictReader(io.StringIO(text))
        headers = [h.strip().lower() for h in (reader.fieldnames or [])]
        
        errors: List[ValidationErrorDetail] = []
        valid_rows: List[Dict[str, Any]] = []
        total_rows = 0

        # Required columns check
        if dataset_type == "rainfall":
            required_fields = ["location_id", "timestamp", "rainfall_mm"]
            for rf in required_fields:
                if rf not in headers:
                    errors.append(ValidationErrorDetail(row=0, field=rf, value=None, message=f"Missing required header column '{rf}'"))
            if errors:
                return ImportSummaryResponse(
                    import_id=import_id,
                    filename=filename,
                    file_type="csv",
                    total_records=0,
                    accepted_records=0,
                    rejected_records=0,
                    status="failed",
                    errors=errors
                )

            with get_db() as conn:
                existing_locs = {r[0] for r in conn.execute("SELECT id FROM locations").fetchall()}

            seen_keys = set()
            for row_idx, row in enumerate(reader, start=2):
                total_rows += 1
                row_clean = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                
                loc_id = row_clean.get("location_id", "")
                ts_str = row_clean.get("timestamp", "")
                rf_str = row_clean.get("rainfall_mm", "")

                # 1. Location check
                if not loc_id or loc_id not in existing_locs:
                    errors.append(ValidationErrorDetail(
                        row=row_idx, field="location_id", value=loc_id,
                        message=f"Location '{loc_id}' is not recognized in registered locations."
                    ))
                    continue

                # 2. Timestamp check
                try:
                    # Accepts ISO or YYYY-MM-DD HH:MM
                    dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    norm_ts = dt.strftime("%Y-%m-%dT%H:%M:%S")
                except Exception:
                    errors.append(ValidationErrorDetail(
                        row=row_idx, field="timestamp", value=ts_str,
                        message="Invalid date/time format. Must be ISO 8601 (e.g. 2026-10-24T12:00:00)."
                    ))
                    continue

                # 3. Numeric rainfall check
                try:
                    rf_val = float(rf_str)
                    if rf_val < 0.0 or rf_val > 1500.0:
                        errors.append(ValidationErrorDetail(
                            row=row_idx, field="rainfall_mm", value=rf_str,
                            message="Rainfall mm must be between 0.0 and 1500.0 mm."
                        ))
                        continue
                except ValueError:
                    errors.append(ValidationErrorDetail(
                        row=row_idx, field="rainfall_mm", value=rf_str,
                        message="Rainfall mm must be a valid numeric floating-point value."
                    ))
                    continue

                # 4. Duplicate record check
                dup_key = (loc_id, norm_ts)
                if dup_key in seen_keys:
                    errors.append(ValidationErrorDetail(
                        row=row_idx, field="timestamp", value=ts_str,
                        message=f"Duplicate observation detected for location '{loc_id}' at '{norm_ts}'."
                    ))
                    continue
                seen_keys.add(dup_key)

                period = row_clean.get("period", "1h")
                accum = float(row_clean.get("accumulation_24h_mm", rf_val)) if row_clean.get("accumulation_24h_mm") else rf_val
                valid_rows.append({
                    "location_id": loc_id,
                    "timestamp": norm_ts,
                    "rainfall_mm": rf_val,
                    "period": period,
                    "accumulation_24h_mm": accum,
                    "source_type": "USER_CSV_IMPORT",
                    "data_source_id": "girirakshak_demo",
                    "created_at": now_str
                })

            # Insert valid rows into database
            if valid_rows:
                with get_db() as conn:
                    conn.executemany("""
                        INSERT INTO rainfall_observations (
                            location_id, timestamp, rainfall_mm, period,
                            accumulation_24h_mm, source_type, data_source_id,
                            is_stale, created_at
                        ) VALUES (:location_id, :timestamp, :rainfall_mm, :period,
                                  :accumulation_24h_mm, :source_type, :data_source_id,
                                  0, :created_at);
                    """, valid_rows)

        # Log import into dataset_imports table
        status = "completed" if len(errors) == 0 else "partially_valid" if valid_rows else "failed"
        with get_db() as conn:
            conn.execute("""
                INSERT INTO dataset_imports (
                    id, filename, file_type, records_count, valid_records,
                    invalid_records, status, error_summary, imported_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                import_id, filename, "csv", total_rows, len(valid_rows),
                len(errors), status, json.dumps([e.model_dump() for e in errors[:10]]), now_str
            ))

        return ImportSummaryResponse(
            import_id=import_id,
            filename=filename,
            file_type="csv",
            total_records=total_rows,
            accepted_records=len(valid_rows),
            rejected_records=len(errors),
            status=status,
            errors=errors[:50]  # Cap returned errors to 50
        )

    @staticmethod
    def validate_and_import_geojson(filename: str, content: bytes) -> ImportSummaryResponse:
        import_id = f"imp_{uuid.uuid4().hex[:8]}"
        now_str = datetime.now().isoformat()

        if len(content) > MAX_FILE_SIZE_BYTES:
            return ImportSummaryResponse(
                import_id=import_id,
                filename=filename,
                file_type="geojson",
                total_records=0,
                accepted_records=0,
                rejected_records=0,
                status="failed",
                errors=[ValidationErrorDetail(row=0, field="file_size", value=len(content), message="File exceeds 5MB upload limit.")]
            )

        try:
            data = json.loads(content.decode("utf-8"))
        except Exception as e:
            return ImportSummaryResponse(
                import_id=import_id,
                filename=filename,
                file_type="geojson",
                total_records=0,
                accepted_records=0,
                rejected_records=0,
                status="failed",
                errors=[ValidationErrorDetail(row=0, field="json", value=None, message=f"Invalid JSON syntax: {str(e)}")]
            )

        if data.get("type") != "FeatureCollection":
            return ImportSummaryResponse(
                import_id=import_id,
                filename=filename,
                file_type="geojson",
                total_records=0,
                accepted_records=0,
                rejected_records=0,
                status="failed",
                errors=[ValidationErrorDetail(row=0, field="type", value=data.get("type"), message="GeoJSON root must be a 'FeatureCollection'.")]
            )

        features = data.get("features", [])
        errors: List[ValidationErrorDetail] = []
        valid_features = []

        for idx, feat in enumerate(features, start=1):
            if feat.get("type") != "Feature":
                errors.append(ValidationErrorDetail(row=idx, field="type", value=feat.get("type"), message="Item is not a valid GeoJSON Feature."))
                continue

            geom = feat.get("geometry")
            if not geom or not isinstance(geom, dict):
                errors.append(ValidationErrorDetail(row=idx, field="geometry", value=None, message="Feature missing 'geometry' object."))
                continue

            geom_type = geom.get("type")
            coords = geom.get("coordinates")
            if geom_type not in ["Point", "LineString", "Polygon", "MultiPolygon"]:
                errors.append(ValidationErrorDetail(row=idx, field="geometry.type", value=geom_type, message=f"Unsupported geometry type '{geom_type}'."))
                continue

            # Validate coordinate bounds
            coord_valid, err_msg = ImportService._validate_coords(coords, geom_type)
            if not coord_valid:
                errors.append(ValidationErrorDetail(row=idx, field="coordinates", value=None, message=err_msg))
                continue

            valid_features.append(feat)

        status = "completed" if len(errors) == 0 else "partially_valid" if valid_features else "failed"
        
        with get_db() as conn:
            conn.execute("""
                INSERT INTO dataset_imports (
                    id, filename, file_type, records_count, valid_records,
                    invalid_records, status, error_summary, imported_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                import_id, filename, "geojson", len(features), len(valid_features),
                len(errors), status, json.dumps([e.model_dump() for e in errors[:10]]), now_str
            ))

        return ImportSummaryResponse(
            import_id=import_id,
            filename=filename,
            file_type="geojson",
            total_records=len(features),
            accepted_records=len(valid_features),
            rejected_records=len(errors),
            status=status,
            errors=errors[:50]
        )

    @staticmethod
    def _validate_coords(coords: Any, geom_type: str) -> Tuple[bool, str]:
        def check_pt(pt):
            if not isinstance(pt, (list, tuple)) or len(pt) < 2:
                return False, "Point coordinate must have at least [longitude, latitude]."
            lon, lat = pt[0], pt[1]
            if not isinstance(lon, (int, float)) or not isinstance(lat, (int, float)):
                return False, f"Coordinates must be numeric. Found {type(lon)} and {type(lat)}."
            if not (-180.0 <= lon <= 180.0):
                return False, f"Longitude {lon} out of range [-180, 180]."
            if not (-90.0 <= lat <= 90.0):
                return False, f"Latitude {lat} out of range [-90, 90]."
            return True, ""

        if geom_type == "Point":
            return check_pt(coords)
        elif geom_type == "LineString":
            if not isinstance(coords, list) or len(coords) < 2:
                return False, "LineString requires at least 2 coordinate pairs."
            for p in coords:
                ok, err = check_pt(p)
                if not ok: return False, err
        elif geom_type == "Polygon":
            if not isinstance(coords, list) or len(coords) < 1:
                return False, "Polygon requires at least 1 ring."
            for ring in coords:
                if not isinstance(ring, list) or len(ring) < 4:
                    return False, "Polygon ring requires at least 4 coordinate pairs (closed ring)."
                for p in ring:
                    ok, err = check_pt(p)
                    if not ok: return False, err
        return True, ""
