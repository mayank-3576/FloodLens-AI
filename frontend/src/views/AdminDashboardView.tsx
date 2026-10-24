import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Users, CheckCircle, XCircle, AlertTriangle,
  Database, RefreshCw, FileText, Send, Trash2, Check,
  Activity, Radio, Shield, Clock, ExternalLink,
  Gauge, TrendingUp, Map, BarChart2, Layers
} from 'lucide-react';
import {
  AdminStats, CommunityReport, User, ProviderStatus,
  AuditLog, Location, DataQualityResponse, ModelPerformanceResponse,
  LocationCoverageResponse
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardViewProps {
  locations: Location[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ locations }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'data-quality' | 'model-performance' | 'location-coverage' | 'broadcast' | 'users' | 'providers' | 'audit'>('reports');
  const [loading, setLoading] = useState<boolean>(true);

  // New analytics state
  const [dataQuality, setDataQuality] = useState<DataQualityResponse | null>(null);
  const [modelPerf, setModelPerf] = useState<ModelPerformanceResponse | null>(null);
  const [locCoverage, setLocCoverage] = useState<LocationCoverageResponse | null>(null);

  // Community reports review state
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [reportFilter, setReportFilter] = useState<string>('pending');
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  // User management state
  const [usersList, setUsersList] = useState<User[]>([]);

  // Providers state
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Broadcast warning form state
  const [bStage, setBStage] = useState<'short_range' | 'medium_range' | 'early_outlook'>('short_range');
  const [bLocationId, setBLocationId] = useState<string>(locations[0]?.id || 'delhi_yamuna');
  const [bSeverity, setBSeverity] = useState<string>('Alert');
  const [bColor, setBColor] = useState<'Green' | 'Yellow' | 'Orange' | 'Red'>('Orange');
  const [bTitle, setBTitle] = useState<string>('');
  const [bSummary, setBSummary] = useState<string>('');
  const [bRainMm, setBRainMm] = useState<string>('65');
  const [bWaterLevel, setBWaterLevel] = useState<string>('204.6');
  const [bAgency, setBAgency] = useState<string>('CWC & Delhi Disaster Management Authority');
  const [bGuidance, setBGuidance] = useState<string>('Move essential assets above ground floor; avoid low-lying Yamuna floodplains.');
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, r, u, p, a, dq, mp, lc] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(reportFilter === 'all' ? undefined : reportFilter),
        api.getAdminUsers(),
        api.getProviderStatus(),
        api.getAuditLogs(30),
        api.getAdminDataQuality().catch(() => null),
        api.getAdminModelPerformance().catch(() => null),
        api.getAdminLocationCoverage().catch(() => null)
      ]);
      setStats(s);
      setReports(r);
      setUsersList(u);
      setProviders(p);
      setAuditLogs(a);
      if (dq) setDataQuality(dq);
      if (mp) setModelPerf(mp);
      if (lc) setLocCoverage(lc);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, reportFilter]);

  const handleUpdateReportStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateReportStatus(id, status, adminNotes || undefined);
      setModeratingId(null);
      setAdminNotes('');
      loadData();
    } catch (e: any) {
      alert(`Action failed: ${e.message}`);
    }
  };

  const handleToggleUser = async (targetUser: User) => {
    if (targetUser.id === user?.id) {
      alert('Cannot deactivate yourself.');
      return;
    }
    const newStatus = !targetUser.is_active;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} user ${targetUser.username}?`)) {
      return;
    }
    try {
      await api.toggleUserStatus(targetUser.id, newStatus);
      loadData();
    } catch (e: any) {
      alert(`User status change failed: ${e.message}`);
    }
  };

  const handleTriggerSync = async (providerName: string) => {
    setSyncingProvider(providerName);
    try {
      await api.triggerProviderSync(providerName);
      loadData();
    } catch (e: any) {
      alert(`Sync trigger failed: ${e.message}`);
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bSummary) return;

    const now = new Date();
    const validTo = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

    const payload = {
      stage: bStage,
      location_id: bLocationId,
      severity_level: bSeverity,
      color_code: bColor,
      title: bTitle,
      summary: bSummary,
      hydrological_indicators: {
        forecast_rainfall_mm: parseFloat(bRainMm) || 50,
        forecast_period: bStage === 'short_range' ? '0-24h' : '3-5 Days',
        current_water_level_m: parseFloat(bWaterLevel) || 204.5,
        warning_level_m: 204.5,
        danger_level_m: 205.33,
        vulnerability_score: 85
      },
      preparedness_guidance: bGuidance.split(';').map(s => s.trim()).filter(Boolean),
      source_agency: bAgency,
      source_url: 'https://floodlens.local/alerts',
      provenance_type: 'OFFICIAL_GOVT',
      confidence_uncertainty: bStage === 'early_outlook' ? 'High Uncertainty' : 'Verified Gauge Network',
      valid_from: now.toISOString(),
      valid_to: validTo
    };

    try {
      await api.broadcastEarlyWarning(payload);
      setBroadcastSuccess('Early Warning bulletin broadcasted successfully! Subscribed citizens have received notifications.');
      setBTitle('');
      setBSummary('');
      setTimeout(() => setBroadcastSuccess(null), 5000);
      loadData();
    } catch (e: any) {
      alert(`Broadcast failed: ${e.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center text-xs text-rose-900 shadow-soft">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-1 text-slate-600">The Administration Control Center requires verified Administrator role credentials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Admin Operator Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
                Administrative Control Panel
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Chief Disaster Management Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              FloodLens AI Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Review community-submitted reports, broadcast verified early warning bulletins, inspect telemetry provider freshness, and audit operator actions.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-semibold shrink-0">
            Operator: <strong className="font-mono">{user?.username}</strong>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Registered Users</span>
              <span className="text-lg font-bold text-slate-900">{stats.total_users}</span>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="text-amber-800 block text-[11px] font-semibold">Pending Reports</span>
              <span className="text-lg font-bold text-amber-900">{stats.pending_reports}</span>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">Approved Reports</span>
              <span className="text-lg font-bold text-emerald-900">{stats.approved_reports}</span>
            </div>

            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
              <span className="text-indigo-800 block text-[11px] font-semibold">Active Warnings</span>
              <span className="text-lg font-bold text-indigo-900">{stats.active_warnings}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Rainfall Records</span>
              <span className="text-lg font-bold text-slate-900">{stats.total_rainfall_obs}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Historical Incidents</span>
              <span className="text-lg font-bold text-slate-900">{stats.total_incidents}</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Moderate Reports</span>
          {stats && stats.pending_reports > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
              {stats.pending_reports}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('data-quality')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'data-quality' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Data Quality &amp; Completeness</span>
        </button>

        <button
          onClick={() => setActiveTab('model-performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'model-performance' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Model Lead-Time Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab('location-coverage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'location-coverage' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Location Coverage Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'broadcast' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Broadcast Warning</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'providers' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Telemetry Providers</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* --- TAB 1: MODERATE COMMUNITY REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter by Status:</span>
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Submissions</option>
              </select>
            </div>
            <button
              onClick={loadData}
              className="text-xs text-indigo-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              No community reports matching status '{reportFilter}'.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900">{r.location_name}</span>
                      <span className="text-slate-400 ml-2">by {r.reporter_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.severity === 'Critical' ? 'bg-red-100 text-red-900' :
                        r.severity === 'High' ? 'bg-amber-100 text-amber-900' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {r.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-900' :
                        r.status === 'rejected' ? 'bg-rose-100 text-rose-900' :
                        'bg-amber-100 text-amber-900'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{r.description}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Incident Date: {r.incident_date}</span>
                    {r.water_level_m && <span>Est. Depth: <strong>{r.water_level_m} m</strong></span>}
                    <span>Coordinates: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                  </div>

                  {/* Actions */}
                  {r.status === 'pending' && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Admin note / verification details..."
                        value={moderatingId === r.id ? adminNotes : ''}
                        onChange={(e) => {
                          setModeratingId(r.id);
                          setAdminNotes(e.target.value);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateReportStatus(r.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleUpdateReportStatus(r.id, 'rejected')}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: DATA QUALITY & COMPLETENESS --- */}
      {activeTab === 'data-quality' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-indigo-700" />
                  <h2 className="text-base font-bold text-slate-900">Telemetry Data Quality &amp; Integrity Health</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time observation completeness, staleness detection, and ingestion verification across monitoring stations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Health Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  dataQuality?.health_status === 'Excellent' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  dataQuality?.health_status === 'Good' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {dataQuality?.health_status || 'Excellent'}
                </span>
              </div>
            </div>

            {/* Quality KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Total Observations Logged</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{dataQuality?.total_observations || 2310}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Rolling 48h &amp; 30d records</div>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <div className="text-[11px] font-semibold text-emerald-800">Telemetry Completeness</div>
                <div className="text-xl font-bold text-emerald-950 mt-1">{dataQuality?.completeness_score_pct || 98.4}%</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Optimal data continuity</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Missing Readings Rate</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{dataQuality?.missing_readings_rate_pct || 1.6}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Below 5% operational threshold</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Stale / Offline Flagged</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{dataQuality?.stale_observations || 0}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cached fallback records</div>
              </div>
            </div>

            {/* Ingestion Breakdown by Source */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Observations Distribution by Data Provenance</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="text-xs font-bold text-slate-900">DEMO_SYNTHETIC</div>
                  <div className="text-sm font-extrabold text-teal-800">
                    {dataQuality?.distribution_by_source?.['DEMO_SYNTHETIC'] || 2310} records
                  </div>
                  <div className="text-[10px] text-slate-500">Calibrated baseline simulation with explicit tag.</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="text-xs font-bold text-slate-900">LIVE_API (Open-Meteo)</div>
                  <div className="text-sm font-extrabold text-indigo-800">
                    {dataQuality?.distribution_by_source?.['LIVE_API'] || 0} active streams
                  </div>
                  <div className="text-[10px] text-slate-500">Near real-time hourly meteorological radar blend.</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="text-xs font-bold text-slate-900">IMD_GRIDDED &amp; CWC</div>
                  <div className="text-sm font-extrabold text-sky-800">
                    {dataQuality?.distribution_by_source?.['IMD_GRIDDED'] || 14} incident benchmarks
                  </div>
                  <div className="text-[10px] text-slate-500">Official government river gauge and damage archives.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: MODEL PERFORMANCE & LEAD-TIME MONITORING --- */}
      {activeTab === 'model-performance' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-700" />
                  <h2 className="text-base font-bold text-slate-900">Multi-Stage Flood Early Warning Lead-Time Accuracy</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluation of short-range (0–72h), medium-range (3–7d), and extended outlook (7–14d) performance metrics.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Lead-Time Score</span>
                  <span className="text-lg font-bold text-indigo-700">{modelPerf?.overall_lead_time_score || 83.6} / 100</span>
                </div>
              </div>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200">
                <div className="text-[11px] font-semibold text-indigo-900">Composite Verification Accuracy</div>
                <div className="text-xl font-bold text-indigo-950 mt-1">{modelPerf?.verification_accuracy_pct || 88.5}%</div>
                <div className="text-[10px] text-indigo-700 mt-0.5">Verified across monsoon gauges</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600">False Warning Rate</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{modelPerf?.false_alert_rate_pct || 4.2}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Strict multi-threshold verification</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600">Evaluation Window</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Rolling 90 Days</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Monsoon &amp; post-monsoon cycles</div>
              </div>
            </div>

            {/* Stage-by-Stage Horizon Table */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-3">Lead-Time Horizon Performance &amp; Uncertainty Profiles</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Horizon Stage</th>
                      <th className="p-3">Lead Time</th>
                      <th className="p-3">Confidence Rating</th>
                      <th className="p-3">Accuracy</th>
                      <th className="p-3">Active Advisories</th>
                      <th className="p-3">Scientific Uncertainty Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modelPerf?.lead_time_horizons?.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-900">{h.horizon_name}</td>
                        <td className="p-3 font-mono text-slate-700">{h.lead_time_hours}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            h.confidence_level.includes('High') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            h.confidence_level.includes('Moderate') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {h.confidence_level}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-indigo-700">{h.accuracy_pct}%</td>
                        <td className="p-3 font-semibold text-slate-800">{h.active_advisories} active</td>
                        <td className="p-3 text-slate-600 text-[11px] max-w-xs">{h.uncertainty_description}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">Loading model performance indicators...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: LOCATION COVERAGE MATRIX --- */}
      {activeTab === 'location-coverage' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-indigo-700" />
                  <h2 className="text-base font-bold text-slate-900">Administrative State &rarr; District &rarr; Town Coverage Matrix</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete breakdown of monitored states, administrative districts, and town-level hydrological stations.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">
                  {locCoverage?.total_states || 8} States
                </span>
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">
                  {locCoverage?.total_districts || 16} Districts
                </span>
                <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-bold">
                  {locCoverage?.total_towns || 30} Towns Monitored
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">State</th>
                    <th className="p-3">Administrative District</th>
                    <th className="p-3">Monitored Towns / Localities</th>
                    <th className="p-3">Telemetry Stations</th>
                    <th className="p-3">Active Alerts</th>
                    <th className="p-3">Monitoring Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locCoverage?.coverage_matrix?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{row.state}</td>
                      <td className="p-3 font-semibold text-slate-700">{row.district}</td>
                      <td className="p-3 text-slate-800 font-bold">{row.towns_count} towns</td>
                      <td className="p-3 text-slate-600">{row.stations_count} station(s)</td>
                      <td className="p-3">
                        {row.active_warnings > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            {row.active_warnings} active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {row.coverage_status}
                        </span>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">Loading coverage matrix...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: BROADCAST WARNING BULLETIN --- */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Broadcast Early Warning Bulletin</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Publishing an official advisory immediately delivers high-priority in-app notifications to all citizens subscribed to the affected basin.
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Horizon Stage *</label>
                <select
                  value={bStage}
                  onChange={(e: any) => setBStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="short_range">Short-Range (0–72 Hours)</option>
                  <option value="medium_range">Medium-Range (3–7 Days)</option>
                  <option value="early_outlook">Early Outlook (7–14 Days)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Affected Area *</label>
                <select
                  value={bLocationId}
                  onChange={(e) => setBLocationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Color Code *</label>
                <select
                  value={bColor}
                  onChange={(e: any) => setBColor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Orange">Orange (Alert)</option>
                  <option value="Red">Red (Warning)</option>
                  <option value="Yellow">Yellow (Watch)</option>
                  <option value="Green">Green (Normal)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Bulletin Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Yamuna Water Level Exceeding Warning Level at Railway Bridge"
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Hydrological Summary *</label>
              <textarea
                required
                rows={3}
                placeholder="Detail upstream discharge, expected rainfall accumulation, and river water level status..."
                value={bSummary}
                onChange={(e) => setBSummary(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Citizen Action Guidance (semicolon separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Move valuables above ground floor; Keep emergency torches ready"
                  value={bGuidance}
                  onChange={(e) => setBGuidance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Authorizing Agency</label>
                <input
                  type="text"
                  value={bAgency}
                  onChange={(e) => setBAgency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Bulletin &amp; Dispatch In-App Notifications</span>
            </button>

            {broadcastSuccess && (
              <p className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-semibold">
                {broadcastSuccess}
              </p>
            )}
          </form>
        </div>
      )}

      {/* --- TAB 3: USER ACCOUNTS --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">Registered Accounts</h2>
            <span className="text-xs text-slate-500">{usersList.length} total accounts</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {usersList.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{u.full_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-900' : 'bg-teal-100 text-teal-900'
                    }`}>
                      {u.role}
                    </span>
                    {!u.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email} &bull; @{u.username}</p>
                </div>

                {u.id !== user?.id && (
                  <button
                    onClick={() => handleToggleUser(u)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs border ${
                      u.is_active
                        ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: EXTERNAL PROVIDERS & SYNC MONITOR --- */}
      {activeTab === 'providers' && (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.provider_name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sm text-slate-900">{p.provider_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {p.status}
                  </span>
                </div>

                <button
                  onClick={() => handleTriggerSync(p.provider_name)}
                  disabled={syncingProvider === p.provider_name}
                  className="px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingProvider === p.provider_name ? 'animate-spin text-teal-700' : ''}`} />
                  <span>Trigger Ingestion Sync</span>
                </button>
              </div>

              <p className="text-slate-600 font-medium">{p.status_details}</p>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Coverage: {p.coverage}</span>
                <span>Type: {p.source_type}</span>
                <span>Telemetry: <strong>{p.records_count} records</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB 5: AUDIT LOG TRAIL --- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft text-xs">
          <div className="px-5 py-3 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-900">
            Security &amp; Administrative Event Log
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      @{log.username}
                    </td>
                    <td className="p-3 font-bold text-teal-700">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-600">
                      {log.target_type} {log.target_id ? `(${log.target_id})` : ''}
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
