from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Location Models ---
class LocationBase(BaseModel):
    name: str
    district: str
    state: str
    town: Optional[str] = None
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    basin_name: Optional[str] = None
    has_dedicated_gauge: Optional[bool] = True
    data_coverage_note: Optional[str] = None
    description: Optional[str] = None

class LocationResponse(LocationBase):
    id: str
    created_at: str

class TownItem(BaseModel):
    id: str
    name: str
    town: str
    district: str
    state: str
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    basin_name: Optional[str] = None
    has_dedicated_gauge: bool = True
    data_coverage_note: Optional[str] = None
    risk_level: str = "Low"  # Low, Moderate, High, Critical
    risk_color: str = "Green" # Green, Yellow, Orange, Red
    latest_rainfall_mm: Optional[float] = None
    accumulation_24h_mm: Optional[float] = None
    active_warnings_count: int = 0

class DistrictItem(BaseModel):
    name: str
    state: str
    towns_count: int
    highest_risk: str = "Low"

class StateItem(BaseModel):
    name: str
    districts_count: int
    towns_count: int
    highest_risk: str = "Low"

class LocationHierarchyResponse(BaseModel):
    states: List[StateItem]
    hierarchy: Dict[str, Dict[str, List[TownItem]]] # state -> district -> towns

class TownRiskResponse(BaseModel):
    location_id: str
    town: str
    district: str
    state: str
    risk_level: str  # Low, Moderate, High, Critical
    risk_color: str  # Green, Yellow, Orange, Red
    estimated_risk_period: str
    affected_areas: List[str]
    rainfall_1h_mm: float
    accumulation_24h_mm: float
    rainfall_category: str
    active_advisories: List[Dict[str, Any]]
    safety_precautions: List[str]
    emergency_contacts: List[Dict[str, str]]
    has_dedicated_gauge: bool = True
    data_coverage_note: Optional[str] = None
    confidence_rating: str
    last_updated: str

# --- Rainfall Models ---
class RainfallObservation(BaseModel):
    id: int
    location_id: str
    timestamp: str
    rainfall_mm: float
    period: str
    accumulation_24h_mm: Optional[float] = None
    source_type: str
    data_source_id: Optional[str] = None
    is_stale: bool = False

class RainfallStats(BaseModel):
    total_mm: float
    max_mm: float
    avg_mm: float
    latest_mm: float
    latest_timestamp: Optional[str] = None
    observation_count: int
    stale_warning: bool
    data_provenance: str

class RainfallTrendPoint(BaseModel):
    timestamp: str
    date: str
    rainfall_mm: float
    accumulation_24h_mm: Optional[float] = None
    source_type: str

class RainfallTrendsResponse(BaseModel):
    location_id: str
    location_name: str
    district: str
    period: str
    stats: RainfallStats
    trends: List[RainfallTrendPoint]

# --- Flood Incident Models ---
class FloodIncident(BaseModel):
    incident_id: str
    location_id: str
    location_name: str
    district: str
    latitude: float
    longitude: float
    incident_date: str
    year: int
    severity: str
    event_description: str
    reported_impact: Optional[str] = None
    water_level_m: Optional[float] = None
    data_source: str
    source_url: str
    provenance_type: str
    last_updated: str

class FloodIncidentFilterResponse(BaseModel):
    total: int
    items: List[FloodIncident]
    available_years: List[int]
    available_districts: List[str]
    available_severities: List[str]

# --- Location Comparison Models ---
class LocationComparisonItem(BaseModel):
    location_id: str
    location_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    basin_name: Optional[str] = None
    latest_rainfall_mm: Optional[float] = None
    latest_rainfall_timestamp: Optional[str] = None
    accumulation_24h_mm: Optional[float] = None
    total_incidents: int
    incidents_by_severity: Dict[str, int]
    incidents_by_year: Dict[int, int]
    record_coverage_pct: float
    data_freshness_status: str
    has_missing_data: bool
    provenance: str

class LocationComparisonResponse(BaseModel):
    time_window: str
    locations: List[LocationComparisonItem]
    methodology_note: str

# --- Data Source Models ---
class DataSource(BaseModel):
    id: str
    name: str
    provider: str
    source_url: str
    coverage: str
    date_range: str
    last_retrieval: str
    last_observation: str
    data_type: str
    units: str
    update_frequency: str
    limitations: str
    status: str

# --- AI Assistant Models ---
class ChatMessage(BaseModel):
    role: str
    content: str

class Citation(BaseModel):
    title: str
    source_name: str
    url: Optional[str] = None
    timestamp: Optional[str] = None
    type: str

class AssistantChatRequest(BaseModel):
    message: str
    location_id: Optional[str] = None
    language: Optional[str] = "en"
    history: Optional[List[ChatMessage]] = []

class AssistantChatResponse(BaseModel):
    reply: str
    mode: str  # "llm" or "grounded_rule_engine"
    citations: List[Citation]
    grounded_metrics: Optional[Dict[str, Any]] = None
    disclaimer: str

# --- Import Models ---
class ValidationErrorDetail(BaseModel):
    row: int
    field: str
    value: Any
    message: str

class ImportSummaryResponse(BaseModel):
    import_id: str
    filename: str
    file_type: str
    total_records: int
    accepted_records: int
    rejected_records: int
    status: str
    errors: List[ValidationErrorDetail]

# --- Dashboard Summary ---
class MetricCard(BaseModel):
    title: str
    value: str
    unit: Optional[str] = None
    subtitle: Optional[str] = None
    badge: Optional[str] = None
    badge_variant: Optional[str] = None

class YearlyIncidentCount(BaseModel):
    year: int
    count: int

class LocationRainfallSummary(BaseModel):
    location_id: str
    name: str
    district: str
    rainfall_mm: float
    accumulation_24h_mm: float
    provenance: str

class DashboardSummaryResponse(BaseModel):
    metrics: Dict[str, MetricCard]
    rainfall_trend_24h: List[Dict[str, Any]]
    incidents_by_year: List[YearlyIncidentCount]
    location_rainfall: List[LocationRainfallSummary]
    monthly_rainfall_distribution: List[Dict[str, Any]]
    active_location: LocationResponse
    total_locations: int
    data_freshness: str
    disclaimer: str

# --- Auth Models ---
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)

class UserLoginRequest(BaseModel):
    identifier: str
    password: str
    selected_role: Optional[str] = None  # Validated against actual role on server

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    full_name: str
    is_active: bool
    created_at: str

class AuthTokenResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    user: UserResponse
    message: str

# --- Community Report Models ---
class CommunityReportCreate(BaseModel):
    client_id: Optional[str] = None  # Client UUID for offline idempotency / deduplication
    location_id: Optional[str] = None
    location_name: str = Field(..., min_length=2)
    latitude: float
    longitude: float
    incident_date: str
    water_level_m: Optional[float] = None
    severity: str = "Moderate"
    description: str = Field(..., min_length=5)
    photo_data: Optional[str] = None

class CommunityReportResponse(BaseModel):
    id: str
    user_id: str
    reporter_name: str
    location_id: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    incident_date: str
    water_level_m: Optional[float] = None
    severity: str
    description: str
    photo_data: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: str
    updated_at: str

class ReportStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|approved|rejected)$")
    admin_notes: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    username: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: str

class AdminRainfallCreate(BaseModel):
    location_id: str
    timestamp: str
    rainfall_mm: float
    period: str = "1h"
    accumulation_24h_mm: Optional[float] = None
    source_type: str = "MANUAL_ENTRY"
    data_source_id: Optional[str] = "imd_rainfall_network"

class AdminFloodIncidentCreate(BaseModel):
    location_id: str
    location_name: str
    district: str
    latitude: float
    longitude: float
    incident_date: str
    year: int
    severity: str = "Moderate"
    event_description: str
    reported_impact: Optional[str] = None
    water_level_m: Optional[float] = None
    data_source: str = "Administrative Entry"
    source_url: str = "https://floodlens.local/records"
    provenance_type: str = "OFFICIAL_RECORD"

# --- Multi-Stage Early Warning & Alert Models ---
class EarlyWarningItem(BaseModel):
    id: str
    stage: str  # 'short_range' | 'medium_range' | 'early_outlook'
    location_id: str
    location_name: str
    district: str
    basin_name: Optional[str] = None
    severity_level: str
    color_code: str  # 'Green' | 'Yellow' | 'Orange' | 'Red'
    title: str
    summary: str
    hydrological_indicators: Dict[str, Any]
    preparedness_guidance: List[str]
    source_agency: str
    source_url: str
    provenance_type: str
    confidence_uncertainty: str
    issued_at: str
    valid_from: str
    valid_to: str
    is_active: bool
    is_expired: bool = False

class MultiStageWarningResponse(BaseModel):
    short_range: List[EarlyWarningItem]
    medium_range: List[EarlyWarningItem]
    early_outlook: List[EarlyWarningItem]
    methodology_notes: Dict[str, str]
    last_synced_at: str

class UserSubscriptionUpdate(BaseModel):
    location_ids: List[str]
    notify_short_range: bool = True
    notify_medium_range: bool = True
    notify_early_outlook: bool = False
    channels: List[str] = Field(default_factory=lambda: ["in_app"])

class UserSubscriptionResponse(BaseModel):
    user_id: str
    subscribed_location_ids: List[str]
    notify_short_range: bool
    notify_medium_range: bool
    notify_early_outlook: bool
    channels: List[str]

class UserNotificationItem(BaseModel):
    id: str
    user_id: str
    warning_id: str
    title: str
    message: str
    severity_level: str
    stage: str
    is_read: bool
    delivery_channel: str
    created_at: str

class EarlyWarningCreate(BaseModel):
    stage: str
    location_id: str
    severity_level: str
    color_code: str
    title: str
    summary: str
    hydrological_indicators: Dict[str, Any]
    preparedness_guidance: List[str]
    source_agency: str
    source_url: str
    provenance_type: str
    confidence_uncertainty: str
    valid_from: str
    valid_to: str

class ProviderStatusItem(BaseModel):
    provider_name: str
    status: str
    source_type: str
    coverage: str
    last_sync: str
    records_count: int
    configured_in_env: bool
    status_details: str

# --- Admin Health & Analytics Models ---
class DataQualityResponse(BaseModel):
    total_observations: int
    valid_observations: int
    stale_observations: int
    missing_readings_rate_pct: float
    completeness_score_pct: float
    distribution_by_source: Dict[str, int]
    last_observation_timestamp: Optional[str] = None
    health_status: str  # Excellent, Good, Degraded

class ModelLeadTimeMetric(BaseModel):
    stage: str
    horizon_name: str
    lead_time_hours: str
    confidence_level: str
    accuracy_pct: float
    active_advisories: int
    uncertainty_description: str

class ModelPerformanceResponse(BaseModel):
    overall_lead_time_score: float
    verification_accuracy_pct: float
    lead_time_horizons: List[ModelLeadTimeMetric]
    evaluation_period: str
    false_alert_rate_pct: float

class LocationCoverageItem(BaseModel):
    state: str
    district: str
    towns_count: int
    stations_count: int
    active_warnings: int
    coverage_status: str

class LocationCoverageResponse(BaseModel):
    total_states: int
    total_districts: int
    total_towns: int
    coverage_matrix: List[LocationCoverageItem]
