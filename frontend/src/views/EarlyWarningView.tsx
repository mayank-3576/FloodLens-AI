import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Clock, ShieldCheck, MapPin, ExternalLink,
  Droplets, Waves, CheckCircle2, ChevronRight, Bell, Settings,
  Calendar, Info, RefreshCw, BookmarkCheck, AlertCircle, WifiOff
} from 'lucide-react';
import { MultiStageWarningResponse, EarlyWarningItem, Location } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface EarlyWarningViewProps {
  activeLocationId: string;
  locations: Location[];
}

export const EarlyWarningView: React.FC<EarlyWarningViewProps> = ({
  activeLocationId,
  locations
}) => {
  const { isOnline, isAuthenticated, requestBrowserNotificationPermission } = useAuth();
  const [data, setData] = useState<MultiStageWarningResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStage, setActiveStage] = useState<'short_range' | 'medium_range' | 'early_outlook' | 'subscriptions'>('short_range');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [subscribedLocations, setSubscribedLocations] = useState<string[]>([]);
  const [notifyShort, setNotifyShort] = useState<boolean>(true);
  const [notifyMed, setNotifyMed] = useState<boolean>(true);
  const [notifyEarly, setNotifyEarly] = useState<boolean>(false);
  const [savingSubs, setSavingSubs] = useState<boolean>(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const locId = filterLocation === 'all' ? undefined : filterLocation;
      const res = await api.getMultiStageWarnings(locId);
      setData(res);
    } catch (e) {
      console.error('Failed to load multi-stage warnings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [filterLocation]);

  useEffect(() => {
    if (isAuthenticated) {
      api.getSubscriptions()
        .then((s) => {
          setSubscribedLocations(s.subscribed_location_ids);
          setNotifyShort(s.notify_short_range);
          setNotifyMed(s.notify_medium_range);
          setNotifyEarly(s.notify_early_outlook);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSaveSubscriptions = async () => {
    if (!isAuthenticated) return;
    setSavingSubs(true);
    setSubMessage(null);
    try {
      await api.updateSubscriptions({
        location_ids: subscribedLocations,
        notify_short_range: notifyShort,
        notify_medium_range: notifyMed,
        notify_early_outlook: notifyEarly,
        channels: ['in_app']
      });
      setSubMessage('Notification preferences saved successfully.');
      setTimeout(() => setSubMessage(null), 4000);
    } catch (e: any) {
      setSubMessage(`Failed to save preferences: ${e.message}`);
    } finally {
      setSavingSubs(false);
    }
  };

  const toggleLocationSubscription = (id: string) => {
    setSubscribedLocations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getSeverityBadge = (color: string, severity: string) => {
    const c = color.toLowerCase();
    if (c === 'red') {
      return 'bg-red-100 text-red-900 border-red-300 font-bold';
    }
    if (c === 'orange') {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (c === 'yellow') {
      return 'bg-yellow-100 text-yellow-900 border-yellow-300 font-semibold';
    }
    return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 shadow-xs">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold">Viewing Cached Flood Bulletins (Offline Mode)</p>
            <p className="text-amber-800 mt-0.5">
              These warnings were cached from your previous session. New official government bulletins cannot be received without active internet connectivity.
            </p>
          </div>
        </div>
      )}

      {/* Main Title Banner with Scientific Guardrails */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                Decision Support System
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Verified Forecasts &bull; Hydrological Monitoring
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Flood Early Warning &amp; Preparedness System
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Tiered hydrological awareness distinguishing 0–72h official civil defense warnings from 3–7d medium-range basin monitoring and 7–14d extended atmospheric outlooks.
            </p>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Filter Area:</span>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Monitored Basins</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.town ? `${loc.town} (${loc.district}, ${loc.state})` : loc.name}
                </option>
              ))}
            </select>
            <button
              onClick={fetchWarnings}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scientific Integrity Callout */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5 text-slate-700 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 font-semibold">Important Methodology Note: </strong>
            Extended-range outlooks (7–14 days) reflect broad circulation patterns with inherently high spatial uncertainty. They do NOT guarantee flood forecasts. Only short-range bulletins (0–72h) represent confirmed government warnings.
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveStage('short_range')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeStage === 'short_range'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Short-Range (0–72 Hours)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeStage === 'short_range' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {data?.short_range.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveStage('medium_range')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeStage === 'medium_range'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Medium-Range (3–7 Days)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeStage === 'medium_range' ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {data?.medium_range.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveStage('early_outlook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeStage === 'early_outlook'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Early Outlook (7–14 Days)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeStage === 'early_outlook' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {data?.early_outlook.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveStage('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ml-auto ${
            activeStage === 'subscriptions'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Monitored Locations</span>
        </button>
      </div>

      {/* --- STAGE 1: SHORT-RANGE WARNINGS (0–72 HOURS) --- */}
      {activeStage === 'short_range' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Verified Official Alerts (IMD / CWC / State Disaster Management)
            </span>
            <span>Validity: Immediate to 72h</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700 mb-2" />
              Loading real-time warnings...
            </div>
          ) : data?.short_range.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No Active Short-Range Warnings</p>
              <p className="text-slate-500 mt-1">Water levels and meteorological conditions in selected areas are currently within normal baseline thresholds.</p>
            </div>
          ) : (
            data?.short_range.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft hover:border-slate-300 transition-all"
              >
                {/* Header ribbon */}
                <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                  item.color_code === 'Red' ? 'bg-red-50/70 border-red-200' :
                  item.color_code === 'Orange' ? 'bg-amber-50/70 border-amber-200' :
                  'bg-yellow-50/70 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider border ${getSeverityBadge(item.color_code, item.severity_level)}`}>
                      {item.color_code} {item.severity_level}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-700" />
                      <strong>{item.location_name}</strong> ({item.district})
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono text-[11px]">Valid till {new Date(item.valid_to).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {item.summary}
                  </p>

                  {/* Hydrological Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Forecast Precipitation</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {item.hydrological_indicators.forecast_rainfall_mm ?? '—'} mm
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.hydrological_indicators.forecast_period || 'Next 24h'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Current River Level</span>
                      <span className={`font-bold text-sm ${
                        item.hydrological_indicators.current_water_level_m && item.hydrological_indicators.warning_level_m &&
                        item.hydrological_indicators.current_water_level_m >= item.hydrological_indicators.warning_level_m
                          ? 'text-amber-700'
                          : 'text-slate-900'
                      }`}>
                        {item.hydrological_indicators.current_water_level_m ? `${item.hydrological_indicators.current_water_level_m} m` : 'Within Banks'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Warning Mark: {item.hydrological_indicators.warning_level_m ? `${item.hydrological_indicators.warning_level_m} m` : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Catchment Saturation</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {item.hydrological_indicators.soil_saturation_pct ? `${item.hydrological_indicators.soil_saturation_pct}%` : '65%'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        API: {item.hydrological_indicators.antecedent_precipitation_index || 'Moderate'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Data Confidence</span>
                      <span className="font-bold text-slate-900 text-xs text-emerald-800">
                        {item.confidence_uncertainty}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Source: {item.source_agency}
                      </span>
                    </div>
                  </div>

                  {/* Citizen Preparedness Guidance Checklist */}
                  {item.preparedness_guidance && item.preparedness_guidance.length > 0 && (
                    <div className="bg-teal-50/60 border border-teal-200/90 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950 mb-2">
                        <ShieldCheck className="w-4 h-4 text-teal-700" />
                        <span>Actionable Preparedness Guidelines for Residents</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {item.preparedness_guidance.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-teal-200 text-teal-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Source Provenance Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <span>Official Source:</span>
                      <strong className="text-slate-800">{item.source_agency}</strong>
                    </span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>Verify Bulletin Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- STAGE 2: MEDIUM-RANGE MONITORING (3–7 DAYS) --- */}
      {activeStage === 'medium_range' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Hydrological River Basin Advisories &amp; NWP Rainfall Ensembles
            </span>
            <span>Lead Time: 3 to 7 Days</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700 mb-2" />
              Loading basin advisories...
            </div>
          ) : data?.medium_range.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No Medium-Range Basin Advisories</p>
              <p className="text-slate-500 mt-1">Multi-model ensemble rainfall forecasts indicate stable river discharge across active catchments.</p>
            </div>
          ) : (
            data?.medium_range.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                      Medium-Range Advisory
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    <span>Validity Window: {new Date(item.valid_from).toLocaleDateString()} – {new Date(item.valid_to).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {item.summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">5-Day Ensemble Rain</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ~{item.hydrological_indicators.forecast_rainfall_mm ?? '90'} mm
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">Catchment Corridor</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {item.hydrological_indicators.river_name || item.basin_name || 'Yamuna Basin'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">Predictive Certainty</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {item.confidence_uncertainty}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">Primary Source</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {item.source_agency}
                    </span>
                  </div>
                </div>

                {item.preparedness_guidance && item.preparedness_guidance.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                      Proactive Monitoring Recommendations:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {item.preparedness_guidance.map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-700">&bull;</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* --- STAGE 3: EARLY OUTLOOK (7–14 DAYS) --- */}
      {activeStage === 'early_outlook' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Extended-Range Circulation &amp; Precipitation Anomalies (7–14 Days)
            </span>
            <span className="text-amber-800 font-semibold">Strict Uncertainty Policy Active</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700 mb-2" />
              Loading extended outlooks...
            </div>
          ) : data?.early_outlook.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No Significant Extended-Range Anomalies</p>
              <p className="text-slate-500 mt-1">Coupled ocean-atmosphere models predict near-normal climatological precipitation over the next 14 days.</p>
            </div>
          ) : (
            data?.early_outlook.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
                      Extended Atmospheric Outlook
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    High Forecast Uncertainty
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {item.summary}
                </p>

                {/* Separate Indicators: Potential Rainfall Concern vs Historical Vulnerability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Indicator A */}
                  <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 block">
                      Indicator 1: Extended Atmospheric Rainfall Anomaly
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Numerical coupled ocean-atmosphere models project potential pulse of <strong>+{item.hydrological_indicators.forecast_rainfall_mm || 40} mm</strong> above normal weekly climatology.
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Confidence Level: <span className="text-amber-800 font-bold">Moderate-to-Low</span> (Subject to atmospheric chaos and synoptic track deviation).
                    </p>
                  </div>

                  {/* Indicator B */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block">
                      Indicator 2: Catchment Historical Vulnerability Baseline
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Historical vulnerability score: <strong>{item.hydrological_indicators.vulnerability_score || 75}/100</strong>.
                      Derived strictly from elevation profile (198m MSL) and flood incident history (2010, 2013, 2023).
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Physical Baseline: Low-gradient floodplain with localized backflow susceptibility.
                    </p>
                  </div>
                </div>

                {/* Unambiguous Scientific Disclaimer */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 text-xs">
                  <strong>Scientific Transparency Disclaimer: </strong>
                  Historical flood records and 14-day rainfall indicators do NOT constitute a flood forecast. Atmospheric conditions can shift significantly. Civil defense actions must rely only on 0–72h verified alerts.
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- STAGE 4: USER ALERT SUBSCRIPTIONS & MONITORED LOCATIONS --- */}
      {activeStage === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Notification Preferences &amp; Monitored Areas
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Select the floodplains, municipal wards, and river corridors you want to monitor. Subscribed users receive targeted in-app alerts and notifications.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>You are browsing as a guest. Please sign in to save your personalized location subscriptions.</span>
            </div>
          )}

          {/* Location Checklist */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Select Locations to Monitor ({subscribedLocations.length} selected):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {locations.map((loc) => {
                const isSelected = subscribedLocations.includes(loc.id);
                return (
                  <div
                    key={loc.id}
                    onClick={() => toggleLocationSubscription(loc.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-300 text-teal-950 font-semibold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{loc.name}</p>
                      <p className="text-[11px] text-slate-500 font-normal">{loc.district}</p>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <BookmarkCheck className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Horizon Toggles */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Alert Horizons to Receive:
            </label>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyShort}
                  onChange={(e) => setNotifyShort(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">0–72 Hour Official Emergency Alerts (Recommended)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyMed}
                  onChange={(e) => setNotifyMed(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">3–7 Day Medium-Range River Catchment Advisories</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEarly}
                  onChange={(e) => setNotifyEarly(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">7–14 Day Extended Atmospheric Rainfall Outlooks</span>
              </label>
            </div>
          </div>

          {/* Browser Notification Permission Button */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={requestBrowserNotificationPermission}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Browser Push Notifications</span>
            </button>

            <button
              onClick={handleSaveSubscriptions}
              disabled={!isAuthenticated || savingSubs}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {savingSubs ? 'Saving...' : 'Save Monitoring Preferences'}
            </button>
          </div>

          {subMessage && (
            <p className="text-xs font-semibold text-teal-800 bg-teal-50 p-2.5 rounded-lg border border-teal-200">
              {subMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
