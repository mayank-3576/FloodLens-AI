import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line
} from 'recharts';
import {
  CloudRain,
  History,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Compass,
  AlertTriangle,
  PhoneCall,
  CheckCircle,
  FilePlus,
  Radio,
  Send,
  X,
  Droplets,
  Info
} from 'lucide-react';
import { DashboardSummary, Location, FloodIncident, TownRiskResponse } from '../types';
import { MetricCard } from '../components/MetricCard';
import { MapComponent } from '../components/MapComponent';
import { CascadingLocationSelector } from '../components/CascadingLocationSelector';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

interface OverviewViewProps {
  summary: DashboardSummary | null;
  locations: Location[];
  incidents: FloodIncident[];
  referenceGeoJSON: any;
  onSelectLocation: (id: string) => void;
  onSelectIncident: (inc: FloodIncident) => void;
  onNavigateTab: (tab: any) => void;
  isLoading: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  summary,
  locations,
  incidents,
  referenceGeoJSON,
  onSelectLocation,
  onSelectIncident,
  onNavigateTab,
  isLoading
}) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [townRisk, setTownRisk] = useState<TownRiskResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  // Quick report form state
  const [reportWaterLevel, setReportWaterLevel] = useState<string>('0.3');
  const [reportSeverity, setReportSeverity] = useState<'Low' | 'Moderate' | 'High' | 'Critical'>('Moderate');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  const activeLocId = summary?.active_location?.id || 'delhi_yamuna';

  // Fetch town risk whenever active location changes
  useEffect(() => {
    let isMounted = true;
    const fetchRisk = async () => {
      if (!activeLocId) return;
      try {
        setRiskLoading(true);
        const risk = await api.getTownRisk(activeLocId);
        if (isMounted) setTownRisk(risk);
      } catch (e) {
        console.warn('Could not fetch town risk profile:', e);
      } finally {
        if (isMounted) setRiskLoading(false);
      }
    };
    fetchRisk();
    return () => { isMounted = false; };
  }, [activeLocId]);

  const handleQuickReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setReportSubmitting(true);
    try {
      await api.submitCommunityReport({
        location_id: activeLocId,
        location_name: summary?.active_location?.town || summary?.active_location?.name || 'Local Town',
        latitude: summary?.active_location?.latitude || 28.6,
        longitude: summary?.active_location?.longitude || 77.2,
        incident_date: new Date().toISOString().slice(0, 10),
        water_level_m: parseFloat(reportWaterLevel) || 0.2,
        severity: reportSeverity,
        description: reportDescription
      });
      setReportSuccessMsg('Report submitted successfully! Thank you for alerting your community.');
      setTimeout(() => {
        setReportSuccessMsg(null);
        setReportModalOpen(false);
        setReportDescription('');
      }, 2000);
    } catch (err: any) {
      alert(`Submission failed: ${err.message || 'Error occurred'}`);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Gathering local awareness data...</p>
      </div>
    );
  }

  const {
    metrics,
    rainfall_trend_24h,
    incidents_by_year,
    location_rainfall,
    monthly_rainfall_distribution,
    active_location
  } = summary;

  const currentTownName = active_location.town || active_location.name;

  // Determine risk badge color theme
  const getRiskStyles = (color?: string) => {
    switch (color) {
      case 'Red':
        return {
          bannerBg: 'bg-red-50 border-red-300 text-red-950',
          badgeBg: 'bg-red-600 text-white',
          accent: 'border-red-200 bg-red-100/50 text-red-900',
          dot: 'bg-red-500 animate-ping'
        };
      case 'Orange':
        return {
          bannerBg: 'bg-amber-50 border-amber-300 text-amber-950',
          badgeBg: 'bg-amber-600 text-white',
          accent: 'border-amber-200 bg-amber-100/50 text-amber-900',
          dot: 'bg-amber-500 animate-pulse'
        };
      case 'Yellow':
        return {
          bannerBg: 'bg-yellow-50 border-yellow-300 text-yellow-950',
          badgeBg: 'bg-yellow-600 text-white',
          accent: 'border-yellow-200 bg-yellow-100/50 text-yellow-900',
          dot: 'bg-yellow-500'
        };
      default:
        return {
          bannerBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          badgeBg: 'bg-emerald-600 text-white',
          accent: 'border-emerald-200 bg-emerald-100/50 text-emerald-900',
          dot: 'bg-emerald-500'
        };
    }
  };

  const riskStyles = getRiskStyles(townRisk?.risk_color);

  // Humanize metric card labels
  const humanizedMetrics = {
    latest_rainfall: {
      ...metrics.latest_rainfall,
      title: 'Recent Rainfall Reading',
      subtitle: `Recorded for ${currentTownName}`
    },
    accumulation_24h: {
      ...metrics.accumulation_24h,
      title: '24-Hour Rainfall Total',
      subtitle: `${townRisk?.rainfall_category || 'Rolling accumulation'}`
    },
    historical_incidents: {
      ...metrics.historical_incidents,
      title: 'Past Flood Events',
      subtitle: `Documented in ${active_location.district}`
    },
    monitored_locations: {
      ...metrics.monitored_locations,
      title: 'Towns Monitored',
      subtitle: `${locations.length} administrative stations`
    },
    dataset_freshness: {
      ...metrics.dataset_freshness,
      title: 'Data Integrity Status',
      subtitle: 'Verified telemetry & baseline'
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STATE -> DISTRICT -> TOWN CASCADING SELECTOR */}
      <CascadingLocationSelector
        locations={locations}
        activeLocationId={activeLocId}
        onSelectLocation={onSelectLocation}
      />

      {/* 2. TOWN-LEVEL FLOOD RISK INTELLIGENCE CARD */}
      <div className={`border rounded-2xl p-5 sm:p-6 shadow-soft transition-all ${riskStyles.bannerBg}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-black/10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${riskStyles.badgeBg} shadow-xs`}>
                <span className={`w-2 h-2 rounded-full ${riskStyles.dot}`} />
                {townRisk?.risk_level || 'Low'} Flood Risk
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                Focus Town: <strong>{currentTownName}</strong> ({active_location.district}, {active_location.state})
              </span>
              <span className="text-xs font-medium text-slate-600 bg-white/60 px-2.5 py-1 rounded-full">
                Basin: <strong>{active_location.basin_name || 'River Catchment'}</strong>
              </span>

              {/* Data Coverage & Micro-Gauge Presence Badge */}
              {townRisk?.has_dedicated_gauge ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-700" />
                  <span>Dedicated AWS Micro-Sensor</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1" title={townRisk?.data_coverage_note || 'District-level NWIC telemetry applied'}>
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  <span>District AWS Telemetry (No micro-gauge)</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-2">
              Estimated Risk Window: {townRisk?.estimated_risk_period || 'Normal - No impending flood hazard identified'}
            </h2>
            {townRisk && !townRisk.has_dedicated_gauge && townRisk.data_coverage_note && (
              <p className="text-xs text-amber-900 bg-amber-50/90 border border-amber-200/90 rounded-lg px-2.5 py-1 mt-1 font-medium">
                {townRisk.data_coverage_note}
              </p>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>{t('report_waterlogging', 'Report Local Flooding')}</span>
            </button>
            <button
              onClick={() => onNavigateTab('early-warning')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 shadow-2xs transition-colors"
            >
              View Multi-Stage Alerts
            </button>
          </div>
        </div>

        {/* Granular Town Indicators & Actionable Guidance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          {/* Col 1: Vulnerable Corridors */}
          <div className="bg-white/85 rounded-xl p-3.5 border border-black/5 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Low-Lying Corridors &amp; Pockets</span>
            </div>
            <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px] leading-relaxed">
              {townRisk?.affected_areas?.map((area, idx) => (
                <li key={idx}>{area}</li>
              )) || (
                <>
                  <li>Active riverbank buffer along {active_location.basin_name}</li>
                  <li>Underpasses and stormwater road culverts</li>
                </>
              )}
            </ul>
          </div>

          {/* Col 2: Actionable Safety Precautions */}
          <div className="bg-white/85 rounded-xl p-3.5 border border-black/5 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Safety Advice &amp; Action Protocol</span>
            </div>
            <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px] leading-relaxed">
              {townRisk?.safety_precautions?.slice(0, 3).map((prec, idx) => (
                <li key={idx}>{prec}</li>
              )) || (
                <>
                  <li>Keep battery lights and emergency survival go-bag ready.</li>
                  <li>Never attempt driving through waterlogged underpasses.</li>
                </>
              )}
            </ul>
          </div>

          {/* Col 3: Emergency Helplines & Assistance */}
          <div className="bg-white/85 rounded-xl p-3.5 border border-black/5 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>Official Emergency Helplines</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-50 text-red-900 font-bold text-xs border border-red-200">
                <span>Unified Emergency Helpline</span>
                <span className="font-mono text-sm px-2 py-0.5 bg-white rounded border border-red-300">112</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-slate-800 text-[11px] border border-slate-200">
                <span>NDMA Disaster Control</span>
                <span className="font-mono font-bold px-1.5 py-0.5 bg-white rounded border">1070</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-slate-800 text-[11px] border border-slate-200">
                <span>District Disaster Helpline</span>
                <span className="font-mono font-bold px-1.5 py-0.5 bg-white rounded border">1077</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <MetricCard
          card={humanizedMetrics.latest_rainfall}
          icon={<CloudRain className="w-4 h-4 text-sky-600" />}
        />
        <MetricCard
          card={humanizedMetrics.accumulation_24h}
          icon={<Clock className="w-4 h-4 text-teal-600" />}
        />
        <MetricCard
          card={humanizedMetrics.historical_incidents}
          icon={<History className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          card={humanizedMetrics.monitored_locations}
          icon={<MapPin className="w-4 h-4 text-slate-600" />}
        />
        <MetricCard
          card={humanizedMetrics.dataset_freshness}
          icon={<Layers className="w-4 h-4 text-teal-700" />}
        />
      </div>

      {/* 4. MAIN CHARTS & GEOSPATIAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 24h Rain Trend & Cross-Location Snapshot (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 24-Hour Rainfall Trend Chart */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-teal-700" />
                  <span>Recent Rainfall Evolution (Past 24 Hours)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hourly rainfall and cumulative accumulation recorded for {currentTownName}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('rainfall')}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full rainfall details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rainfall_trend_24h} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGradientLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="mm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string) => [`${value} mm`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="rainfall_mm"
                    name="Hourly Rain (mm)"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#rainGradientLight)"
                  />
                  <Line
                    type="monotone"
                    dataKey="accumulation_24h_mm"
                    name="24h Rolling Sum (mm)"
                    stroke="#0284C7"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cross-Location Rainfall Snapshot */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>Rainfall Comparison Across Monitored Areas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  24-hour accumulation snapshot across regional stations
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('compare')}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Compare locations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={location_rainfall.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} unit="mm" tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#334155" fontSize={11} width={80} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string) => [`${value} mm`, name]}
                  />
                  <Bar dataKey="accumulation_24h_mm" name="24h Total (mm)" fill="#0F766E" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Past Flood Events (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Map Preview Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-700" />
                  <span>Local Situational Map ({currentTownName})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rainfall observations, river corridors, and recorded events
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('map')}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full map</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <MapComponent
              locations={locations}
              activeLocation={active_location}
              incidents={incidents}
              rainfallSummaries={location_rainfall}
              referenceGeoJSON={referenceGeoJSON}
              onSelectLocation={onSelectLocation}
              onSelectIncident={onSelectIncident}
              heightClass="h-[280px]"
            />
          </div>

          {/* Past Flood Events by Year */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>Documented Past Flood Events by Year</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical inundations recorded in the knowledge base (2005–2024)
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Browse event records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidents_by_year} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string) => [`${value}`, name]}
                  />
                  <Bar dataKey="count" name="Documented Events" fill="#D97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 5. QUICK COMMUNITY REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <FilePlus className="w-5 h-5 text-teal-700" />
                <span>Report Local Waterlogging or Drain Blockage</span>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{reportSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleQuickReportSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                  <div><strong>Focus Locality:</strong> {currentTownName} ({active_location.district}, {active_location.state})</div>
                  <div className="text-[11px] text-slate-500">Your crowdsourced observations help neighbors and local emergency teams respond faster.</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Estimated Water Depth (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3.0"
                      value={reportWaterLevel}
                      onChange={(e) => setReportWaterLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Severity Assessment</label>
                    <select
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="Low">Low (Ankle deep)</option>
                      <option value="Moderate">Moderate (Knee deep / Road slow)</option>
                      <option value="High">High (Waist deep / Submerged cars)</option>
                      <option value="Critical">Critical (Inundating homes)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description &amp; Exact Landmarks</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Underpass near metro pillar 42 is impassable due to clogged drain grates..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{reportSubmitting ? 'Submitting...' : 'Submit Community Report'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
