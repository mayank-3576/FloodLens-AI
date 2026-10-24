import React, { useState, useEffect } from 'react';
import {
  FileText, Send, MapPin, Calendar, Droplets, AlertTriangle,
  CheckCircle2, Clock, XCircle, Image as ImageIcon, WifiOff,
  RefreshCw, Info
} from 'lucide-react';
import { CommunityReport, Location } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CommunityReportsViewProps {
  locations: Location[];
  activeLocationId: string;
}

export const CommunityReportsView: React.FC<CommunityReportsViewProps> = ({
  locations,
  activeLocationId
}) => {
  const { isAuthenticated, isOnline, user } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form state
  const [locationId, setLocationId] = useState<string>(activeLocationId || 'delhi_yamuna');
  const [locationName, setLocationName] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [waterLevelM, setWaterLevelM] = useState<string>('');
  const [severity, setSeverity] = useState<'Low' | 'Moderate' | 'High' | 'Critical'>('Moderate');
  const [description, setDescription] = useState<string>('');
  const [photoData, setPhotoData] = useState<string | null>(null);

  // Update locationName when locationId changes
  useEffect(() => {
    const loc = locations.find((l) => l.id === locationId);
    if (loc) {
      setLocationName(loc.name);
    }
  }, [locationId, locations]);

  const loadMyReports = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const myReports = await api.getMyCommunityReports();
      setReports(myReports);
    } catch (e) {
      console.warn('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReports();
  }, [isAuthenticated]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.length < 5) {
      setStatusMessage({ text: 'Please provide a descriptive explanation of the observed flooding (at least 5 characters).', type: 'error' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const clientUUID = `crep_c_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const payload: Partial<CommunityReport> = {
      id: clientUUID,
      location_id: locationId,
      location_name: locationName || 'Local Neighborhood',
      latitude: locations.find((l) => l.id === locationId)?.latitude || 28.6139,
      longitude: locations.find((l) => l.id === locationId)?.longitude || 77.2090,
      incident_date: incidentDate,
      water_level_m: waterLevelM ? parseFloat(waterLevelM) : undefined,
      severity,
      description: description.trim(),
      photo_data: photoData || undefined
    };

    try {
      const result = await api.submitCommunityReport(payload);
      if (result.is_queued_offline) {
        setStatusMessage({
          text: 'Report saved locally (Offline Mode). It will automatically sync to disaster authorities once internet is restored.',
          type: 'info'
        });
      } else {
        setStatusMessage({
          text: 'Report submitted successfully! It will appear publicly on the interactive map once approved by an administrator.',
          type: 'success'
        });
      }

      // Reset form
      setDescription('');
      setWaterLevelM('');
      setPhotoData(null);
      loadMyReports();
    } catch (err: any) {
      setStatusMessage({ text: `Submission error: ${err.message}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, isOffline?: boolean) => {
    if (isOffline) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
          <WifiOff className="w-3 h-3 text-slate-500" />
          Queued Offline
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Approved &bull; Live on Map
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
          <XCircle className="w-3 h-3 text-rose-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600" />
        Under Review
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                Citizen Reporting Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Offline-First Ground Intelligence
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Community Flood Incident Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Submit observations regarding road waterlogging, drainage overflow, and riverbank ingress. Validated reports assist neighboring citizens and municipal response units.
            </p>
          </div>

          {!isOnline && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 shrink-0">
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span>Offline Mode Active</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Report Submission Form (Citizen Only) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Submit New Incident Report</h2>
          </div>

          {!isAuthenticated ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-center space-y-2">
              <p className="font-semibold text-slate-800">Authentication Required</p>
              <p>Please sign in as a Citizen or Admin to submit verified community reports.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Location */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Observation Area *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Specific Street / Landmark */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Specific Landmark / Crossroad *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Underpass near Sector 62 metro station"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              {/* Date & Water Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Est. Depth (Metres)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="e.g. 0.45"
                    value={waterLevelM}
                    onChange={(e) => setWaterLevelM(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Observed Severity Level *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Low', 'Moderate', 'High', 'Critical'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-1.5 rounded-lg border font-bold text-[11px] transition-all ${
                        severity === lvl
                          ? lvl === 'Critical'
                            ? 'bg-red-700 text-white border-red-700'
                            : lvl === 'High'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Incident Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe drainage condition, whether vehicles can pass, or if water is entering homes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Optional Photo Evidence</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                {photoData && (
                  <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                    <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoData(null)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Report...' : 'Submit Incident Report'}</span>
              </button>

              {statusMessage && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                  statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' :
                  statusMessage.type === 'info' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                  'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {statusMessage.text}
                </div>
              )}
            </form>
          )}
        </div>

        {/* My Submitted Reports List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Your Submitted Reports &amp; Status
            </h2>
            <button
              onClick={loadMyReports}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
              Sign in to track the review status of your community submissions.
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No Reports Submitted Yet</p>
              <p className="mt-1">When you submit local flooding observations, you can track their official review status here.</p>
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{r.location_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.severity === 'Critical' ? 'bg-red-100 text-red-900' :
                      r.severity === 'High' ? 'bg-amber-100 text-amber-900' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {r.severity}
                    </span>
                  </div>
                  <div>{getStatusBadge(r.status, r.is_queued_offline)}</div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {r.description}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Incident Date: {r.incident_date}</span>
                  {r.water_level_m && (
                    <span>Water Level: <strong>{r.water_level_m} m</strong></span>
                  )}
                  <span>Submitted: {new Date(r.created_at).toLocaleDateString()}</span>
                </div>

                {r.admin_notes && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                    <strong className="text-slate-900">Official Review Note: </strong>
                    {r.admin_notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
