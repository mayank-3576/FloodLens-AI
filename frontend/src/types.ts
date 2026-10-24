export interface Location {
  id: string;
  name: string;
  district: string;
  state: string;
  town?: string;
  latitude: float;
  longitude: float;
  elevation_m?: number;
  basin_name?: string;
  has_dedicated_gauge?: boolean;
  data_coverage_note?: string;
  description?: string;
  created_at: string;
}

export interface TownItem {
  id: string;
  name: string;
  town: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  basin_name?: string;
  has_dedicated_gauge?: boolean;
  data_coverage_note?: string;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  risk_color: 'Green' | 'Yellow' | 'Orange' | 'Red' | string;
  latest_rainfall_mm?: number;
  accumulation_24h_mm?: number;
  active_warnings_count: number;
}

export interface DistrictItem {
  name: string;
  state: string;
  towns_count: number;
  highest_risk: string;
}

export interface StateItem {
  name: string;
  districts_count: number;
  towns_count: number;
  highest_risk: string;
}

export interface LocationHierarchyResponse {
  states: StateItem[];
  hierarchy: Record<string, Record<string, TownItem[]>>;
}

export interface TownRiskResponse {
  location_id: string;
  town: string;
  district: string;
  state: string;
  risk_level: string;
  risk_color: string;
  estimated_risk_period: string;
  affected_areas: string[];
  rainfall_1h_mm: number;
  accumulation_24h_mm: number;
  rainfall_category: string;
  active_advisories: any[];
  safety_precautions: string[];
  emergency_contacts: Array<{ name: string; number: string }>;
  has_dedicated_gauge?: boolean;
  data_coverage_note?: string;
  confidence_rating: string;
  last_updated: string;
}

export type float = number;

export interface MetricCardData {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  badge?: string;
  badge_variant?: 'cyan' | 'teal' | 'amber' | 'red' | string;
}

export interface YearlyIncidentCount {
  year: number;
  count: number;
}

export interface LocationRainfallSummary {
  location_id: string;
  name: string;
  district: string;
  rainfall_mm: number;
  accumulation_24h_mm: number;
  provenance: string;
}

export interface DashboardSummary {
  metrics: Record<string, MetricCardData>;
  rainfall_trend_24h: Array<{
    timestamp: string;
    full_timestamp: string;
    rainfall_mm: number;
    accumulation_24h_mm: number;
    source_type: string;
  }>;
  incidents_by_year: YearlyIncidentCount[];
  location_rainfall: LocationRainfallSummary[];
  monthly_rainfall_distribution: Array<{
    month: string;
    avg_rainfall_mm: number;
    monsoon_phase: string;
  }>;
  active_location: Location;
  total_locations: number;
  data_freshness: string;
  disclaimer: string;
}

export interface RainfallObservation {
  id: number;
  location_id: string;
  timestamp: string;
  rainfall_mm: number;
  period: string;
  accumulation_24h_mm?: number;
  source_type: string;
  data_source_id?: string;
  is_stale: boolean;
}

export interface RainfallStats {
  total_mm: number;
  max_mm: number;
  avg_mm: number;
  latest_mm: number;
  latest_timestamp?: string;
  observation_count: number;
  stale_warning: boolean;
  data_provenance: string;
}

export interface RainfallTrendPoint {
  timestamp: string;
  date: string;
  rainfall_mm: number;
  accumulation_24h_mm?: number;
  source_type: string;
}

export interface RainfallTrendsResponse {
  location_id: string;
  location_name: string;
  district: string;
  period: string;
  stats: RainfallStats;
  trends: RainfallTrendPoint[];
}

export interface FloodIncident {
  incident_id: string;
  location_id: string;
  location_name: string;
  district: string;
  latitude: number;
  longitude: number;
  incident_date: string;
  year: number;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical' | string;
  event_description: string;
  reported_impact?: string;
  water_level_m?: number;
  data_source: string;
  source_url: string;
  provenance_type: string;
  last_updated: string;
}

export interface FloodIncidentFilterResponse {
  total: number;
  items: FloodIncident[];
  available_years: number[];
  available_districts: string[];
  available_severities: string[];
}

export interface LocationComparisonItem {
  location_id: string;
  location_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  basin_name?: string;
  latest_rainfall_mm?: number;
  latest_rainfall_timestamp?: string;
  accumulation_24h_mm?: number;
  total_incidents: number;
  incidents_by_severity: Record<string, number>;
  incidents_by_year: Record<number, number>;
  record_coverage_pct: number;
  data_freshness_status: string;
  has_missing_data: boolean;
  provenance: string;
}

export interface LocationComparisonResponse {
  time_window: string;
  locations: LocationComparisonItem[];
  methodology_note: string;
}

export interface DataSource {
  id: string;
  name: string;
  provider: string;
  source_url: string;
  coverage: string;
  date_range: string;
  last_retrieval: string;
  last_observation: string;
  data_type: string;
  units: string;
  update_frequency: string;
  limitations: string;
  status: string;
}

export interface Citation {
  title: string;
  source_name: string;
  url?: string;
  timestamp?: string;
  type: string;
}

export interface AssistantChatResponse {
  reply: string;
  mode: string;
  citations: Citation[];
  grounded_metrics?: Record<string, any>;
  disclaimer: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportSummaryResponse {
  import_id: string;
  filename: string;
  file_type: string;
  total_records: number;
  accepted_records: number;
  rejected_records: number;
  status: string;
  errors: ImportValidationError[];
}

// --- Auth & User Types ---
export type UserRole = 'admin' | 'citizen';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  token: string;
  token_type: string;
  user: User;
  message: string;
}

// --- Community Flood Reports ---
export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface CommunityReport {
  id: string;
  user_id: string;
  reporter_name: string;
  location_id?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  incident_date: string;
  water_level_m?: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  description: string;
  photo_data?: string;
  status: ReportStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  is_queued_offline?: boolean;
}

// --- Multi-Stage Early Warnings ---
export type WarningStage = 'short_range' | 'medium_range' | 'early_outlook';

export interface HydrologicalIndicators {
  forecast_rainfall_mm?: number;
  forecast_period?: string;
  river_name?: string;
  current_water_level_m?: number;
  warning_level_m?: number;
  danger_level_m?: number;
  antecedent_precipitation_index?: number;
  soil_saturation_pct?: number;
  vulnerability_score?: number;
}

export interface EarlyWarningItem {
  id: string;
  stage: WarningStage;
  location_id: string;
  location_name: string;
  district: string;
  basin_name?: string;
  severity_level: string;
  color_code: 'Green' | 'Yellow' | 'Orange' | 'Red';
  title: string;
  summary: string;
  hydrological_indicators: HydrologicalIndicators;
  preparedness_guidance: string[];
  source_agency: string;
  source_url: string;
  provenance_type: string;
  confidence_uncertainty: string;
  issued_at: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  is_expired?: boolean;
}

export interface MultiStageWarningResponse {
  short_range: EarlyWarningItem[];
  medium_range: EarlyWarningItem[];
  early_outlook: EarlyWarningItem[];
  methodology_notes: Record<string, string>;
  last_synced_at: string;
}

// --- Subscriptions & Notifications ---
export interface UserSubscription {
  user_id: string;
  subscribed_location_ids: string[];
  notify_short_range: boolean;
  notify_medium_range: boolean;
  notify_early_outlook: boolean;
  channels: string[];
}

export interface UserNotification {
  id: string;
  user_id: string;
  warning_id: string;
  title: string;
  message: string;
  severity_level: string;
  stage: WarningStage;
  is_read: boolean;
  delivery_channel: string;
  created_at: string;
}

// --- Admin Controls ---
export interface AdminStats {
  total_users: number;
  pending_reports: number;
  approved_reports: number;
  active_warnings: number;
  total_rainfall_obs: number;
  total_incidents: number;
  recent_syncs: Array<{
    provider_name: string;
    sync_type: string;
    status: string;
    records_ingested: number;
    duration_ms: number;
    synced_at: string;
  }>;
  admin_operator: string;
}

export interface ProviderStatus {
  provider_name: string;
  status: string;
  source_type: string;
  coverage: string;
  last_sync: string;
  records_count: number;
  configured_in_env: boolean;
  status_details: string;
}

export interface AuditLog {
  id: number;
  user_id?: string;
  username: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: string;
  timestamp: string;
}

// --- Offline Sync Bundle ---
export interface SyncBundle {
  synced_at: string;
  offline_mode_ready: boolean;
  locations: Location[];
  data_sources: DataSource[];
  recent_rainfall: RainfallObservation[];
  incidents: FloodIncident[];
  community_reports: CommunityReport[];
  early_warnings: EarlyWarningItem[];
  offline_disclaimer: string;
}

// --- Admin Analytics & Data Quality ---
export interface DataQualityResponse {
  total_observations: number;
  valid_observations: number;
  stale_observations: number;
  missing_readings_rate_pct: number;
  completeness_score_pct: number;
  distribution_by_source: Record<string, number>;
  last_observation_timestamp?: string;
  health_status: 'Excellent' | 'Good' | 'Degraded' | string;
}

export interface ModelLeadTimeMetric {
  stage: string;
  horizon_name: string;
  lead_time_hours: string;
  confidence_level: string;
  accuracy_pct: number;
  active_advisories: number;
  uncertainty_description: string;
}

export interface ModelPerformanceResponse {
  overall_lead_time_score: number;
  verification_accuracy_pct: number;
  lead_time_horizons: ModelLeadTimeMetric[];
  evaluation_period: string;
  false_alert_rate_pct: number;
}

export interface LocationCoverageItem {
  state: string;
  district: string;
  towns_count: number;
  stations_count: number;
  active_warnings: number;
  coverage_status: string;
}

export interface LocationCoverageResponse {
  total_states: number;
  total_districts: number;
  total_towns: number;
  coverage_matrix: LocationCoverageItem[];
}
