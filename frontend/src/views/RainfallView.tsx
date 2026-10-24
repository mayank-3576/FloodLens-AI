import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  CloudRain,
  Download,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Radio,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { Location, RainfallTrendsResponse, RainfallObservation } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface RainfallViewProps {
  locations: Location[];
  activeLocationId: string;
  onLocationChange: (id: string) => void;
}

export const RainfallView: React.FC<RainfallViewProps> = ({
  locations,
  activeLocationId,
  onLocationChange
}) => {
  const { isOnline } = useAuth();
  const [rangeType, setRangeType] = useState<'24h' | '7d' | '30d' | '1y'>('24h');
  const [trendsData, setTrendsData] = useState<RainfallTrendsResponse | null>(null);
  const [tableRecords, setTableRecords] = useState<RainfallObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [liveChecking, setLiveChecking] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const fetchTrends = async (checkLive: boolean = false) => {
    try {
      if (checkLive) setLiveChecking(true);
      else setLoading(true);

      const res = await api.getRainfallTrends(activeLocationId, rangeType, checkLive);
      setTrendsData(res);

      const obsRes = await api.getRainfallObservations({
        locationId: activeLocationId,
        limit: 100
      });
      setTableRecords(obsRes);
    } catch (err) {
      console.error('Error fetching rainfall trends:', err);
    } finally {
      setLoading(false);
      setLiveChecking(false);
    }
  };

  useEffect(() => {
    fetchTrends(false);
  }, [activeLocationId, rangeType]);

  const handleExportCSV = () => {
    window.open(`/api/rainfall/export/csv?location_id=${activeLocationId}`, '_blank');
  };

  const filteredRecords = tableRecords.filter(r =>
    r.timestamp.toLowerCase().includes(tableSearch.toLowerCase()) ||
    r.source_type.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = trendsData?.stats;

  const rangeLabels: Record<string, string> = {
    '24h': 'Past 24 Hours',
    '7d': 'Past 7 Days',
    '30d': 'Past 30 Days',
    '1y': 'Past 1 Year'
  };

  const formatXAxisTick = (t: string) => {
    if (!t) return '';
    if (rangeType === '24h') {
      return t.length >= 16 ? t.slice(11, 16) : t;
    }
    // Daily views (7d, 30d, 1y) -> formatted calendar date
    try {
      const parts = t.slice(0, 10).split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[mIdx] || parts[1]}`;
      }
    } catch (e) {}
    return t.slice(5, 10);
  };

  const getSourceBadge = (source: string) => {
    if (source === 'LIVE_API') {
      return {
        label: 'Real Live Telemetry',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        desc: 'Direct observation from meteorological sensor network'
      };
    }
    if (source.includes('OFFLINE')) {
      return {
        label: 'Cached Offline Intelligence',
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
        desc: 'Stored locally in browser cache'
      };
    }
    if (source === 'HISTORICAL_PUBLIC' || source === 'OFFICIAL_RECORD') {
      return {
        label: 'Official Historical Record',
        badgeClass: 'bg-teal-50 text-teal-900 border-teal-300 font-semibold',
        desc: 'Government meteorological registry'
      };
    }
    return {
      label: 'Synthetic Demonstration Baseline',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
      desc: 'Calibrated demonstration data (clearly distinguished from live observations)'
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          {/* Location Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select City or Area
            </label>
            <select
              value={activeLocationId}
              onChange={(e) => onLocationChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Observation Timeframe
            </label>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
              {(['24h', '7d', '30d', '1y'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRangeType(r); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-all ${
                    rangeType === r
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rangeLabels[r]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Weather Adapter Query & Export Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTrends(true)}
            disabled={liveChecking}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-all disabled:opacity-50"
            title="Probe Open-Meteo public live precipitation API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${liveChecking ? 'animate-spin text-teal-700' : 'text-teal-700'}`} />
            <span>{liveChecking ? 'Checking Weather API...' : 'Check Live Weather API'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
            title="Download rainfall records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Useful Summary Cards Above the Chart */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Reading</span>
            <div className="text-2xl font-bold text-slate-900 font-sans mt-1">
              {stats.latest_mm} <span className="text-xs font-normal text-slate-500">mm</span>
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-1 block">Most recent recorded step</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Peak Rainfall</span>
            <div className="text-2xl font-bold text-teal-800 font-sans mt-1">
              {stats.max_mm} <span className="text-xs font-normal text-slate-500">mm</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Maximum intensity in window</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rainfall</span>
            <div className="text-2xl font-bold text-slate-800 font-sans mt-1">
              {stats.avg_mm} <span className="text-xs font-normal text-slate-500">mm</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Across {stats.observation_count} observation points</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accumulation</span>
            <div className="text-2xl font-bold text-sky-800 font-sans mt-1">
              {stats.total_mm} <span className="text-xs font-normal text-slate-500">mm</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Total rainfall for period</span>
          </div>
        </div>
      )}

      {/* Offline Mode Alert */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> Displaying cached rainfall observations from local IndexedDB. Real-time weather API checks are disabled.
            </span>
          </div>
          <span className="font-semibold text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded border border-amber-300 text-[11px]">
            Cached Telemetry
          </span>
        </div>
      )}

      {/* Data Status & Integrity Note */}
      {stats && (() => {
        const badge = getSourceBadge(stats.data_provenance);
        return (
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${badge.badgeClass}`}>
            <div className="flex items-center gap-2.5">
              {stats.data_provenance === 'LIVE_API' ? (
                <Radio className="w-4 h-4 text-emerald-700 animate-pulse shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-900">{badge.label}</span>
                <span className="mx-2 text-slate-400">|</span>
                <span className="text-slate-600">
                  {badge.desc} &bull; Latest: <strong>{stats.latest_timestamp ? new Date(stats.latest_timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}</strong> ({stats.observation_count} readings in window)
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
              Metric Unit: Millimetres (mm)
            </span>
          </div>
        );
      })()}

      {/* Main Trends Chart */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-teal-700" />
              <span>Rainfall Evolution Curve</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Timeseries progression for {trendsData?.location_name || 'Selected Area'} ({rangeLabels[rangeType]}) &bull; All values in millimetres (mm)
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {trendsData?.trends.length || 0} readings plotted
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData?.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rfFillLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#64748B"
                fontSize={11}
                tickFormatter={formatXAxisTick}
              />
              <YAxis stroke="#64748B" fontSize={11} unit="mm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px'
                }}
                labelFormatter={(label) => {
                  try {
                    const d = new Date(label);
                    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                  } catch (e) {
                    return String(label);
                  }
                }}
                formatter={(value: any, name: string) => [`${value} mm`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="rainfall_mm"
                name="Rainfall (mm)"
                stroke="#0D9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#rfFillLight)"
              />
              {rangeType === '24h' && (
                <Line
                  type="monotone"
                  dataKey="accumulation_24h_mm"
                  name="24h Rolling Sum (mm)"
                  stroke="#0284C7"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Underlying Observations Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-700" />
              <span>Underlying Observation Registry</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect observation timestamps, measurement intervals, and source tags
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search timestamp or source..."
              value={tableSearch}
              onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 w-60"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Observation Time</th>
                <th className="py-2.5 px-3">Cadence</th>
                <th className="py-2.5 px-3">Rainfall (mm)</th>
                <th className="py-2.5 px-3">24h Sum (mm)</th>
                <th className="py-2.5 px-3">Data Origin</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => {
                  const b = getSourceBadge(r.source_type);
                  let formattedDate = r.timestamp;
                  try {
                    const d = new Date(r.timestamp);
                    formattedDate = d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                  } catch (e) {}

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{r.id}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{r.period}</td>
                      <td className="py-2.5 px-3 text-teal-800 font-bold">{r.rainfall_mm} mm</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {r.accumulation_24h_mm !== null && r.accumulation_24h_mm !== undefined
                          ? `${r.accumulation_24h_mm} mm`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border whitespace-nowrap ${b.badgeClass}`}>
                          {b.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.is_stale ? (
                          <span className="text-amber-700 flex items-center gap-1 text-[11px] font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Stale
                          </span>
                        ) : (
                          <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No matching rainfall records found for the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
