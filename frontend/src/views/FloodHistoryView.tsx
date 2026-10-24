import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  History,
  Search,
  Download,
  ExternalLink,
  AlertTriangle,
  X,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { FloodIncident, FloodIncidentFilterResponse, Location } from '../types';
import { api } from '../services/api';
import { MapComponent } from '../components/MapComponent';

interface FloodHistoryViewProps {
  locations: Location[];
  onSelectIncident: (inc: FloodIncident) => void;
  selectedIncident: FloodIncident | null;
  onCloseIncidentModal: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  Minor: '#0284C7',
  Moderate: '#D97706',
  Severe: '#EA580C',
  Critical: '#DC2626'
};

export const FloodHistoryView: React.FC<FloodHistoryViewProps> = ({
  locations,
  onSelectIncident,
  selectedIncident,
  onCloseIncidentModal
}) => {
  const [data, setData] = useState<FloodIncidentFilterResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getFloodIncidents({
        district: districtFilter || undefined,
        severity: severityFilter || undefined,
        yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
        yearTo: yearTo ? parseInt(yearTo) : undefined,
        search: searchTerm || undefined
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch flood incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [districtFilter, severityFilter, yearFrom, yearTo, searchTerm]);

  const handleExportCSV = () => {
    const q = new URLSearchParams();
    if (districtFilter) q.append('district', districtFilter);
    if (severityFilter) q.append('severity', severityFilter);
    window.open(`/api/flood-incidents/export/csv?${q.toString()}`, '_blank');
  };

  // Prepare chart data: Incidents by severity
  const severityBreakdown = ['Minor', 'Moderate', 'Severe', 'Critical'].map(sev => ({
    name: sev,
    count: data?.items.filter(i => i.severity.toLowerCase() === sev.toLowerCase()).length || 0,
    color: SEVERITY_COLORS[sev]
  })).filter(s => s.count > 0);

  // Prepare chart data: Incidents by year
  const yearlyCounts: Record<number, number> = {};
  data?.items.forEach(i => {
    yearlyCounts[i.year] = (yearlyCounts[i.year] || 0) + 1;
  });
  const yearChartData = Object.keys(yearlyCounts)
    .map(Number)
    .sort((a, b) => a - b)
    .map(y => ({ year: y, count: yearlyCounts[y] }));

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Past Flood Events Archive</h2>
              <p className="text-xs text-slate-500">Explore documented inundations, barrage discharges, and historical river breaches (2005–2024)</p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search description, impact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* District Filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">All Monitored Districts</option>
              {data?.available_districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">All Severity Levels</option>
              {data?.available_severities.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year Range Filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="From (e.g. 2015)"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
            <input
              type="number"
              placeholder="To (e.g. 2024)"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={() => {
                setDistrictFilter('');
                setSeverityFilter('');
                setYearFrom('');
                setYearTo('');
                setSearchTerm('');
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Analytics: Incidents by Year & Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Annual Incident Frequency</h3>
          <p className="text-xs text-slate-500 mb-4">Historical record volume for current filter selection</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                />
                <Bar dataKey="count" name="Documented Events" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Severity Distribution</h3>
            <p className="text-xs text-slate-500 mb-2">Classified flood impact levels</p>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {severityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {['Minor', 'Moderate', 'Severe', 'Critical'].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s] }} />
                <span className="text-slate-700 font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map of Filtered Incidents */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Geospatial Distribution of Past Events</h3>
            <p className="text-xs text-slate-500">Click any marker to open its full event dossier</p>
          </div>
          <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-semibold border border-slate-200">
            {data?.items.length || 0} events mapped
          </span>
        </div>
        <MapComponent
          locations={locations}
          incidents={data?.items || []}
          onSelectIncident={onSelectIncident}
          heightClass="h-[320px]"
        />
      </div>

      {/* Incident Records Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Past Flood Event Records ({data?.total || 0})
          </h3>
          <span className="text-xs text-slate-500">
            Click on any row to inspect historical impact details
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Location &amp; District</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Event Summary</th>
                <th className="py-2.5 px-3">Documented Source</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data && data.items.length > 0 ? (
                data.items.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-semibold text-teal-800">
                      {inc.incident_id}
                    </td>
                    <td className="py-3 px-3 text-slate-900">
                      <div className="font-semibold">{inc.location_name}</div>
                      <div className="text-[11px] text-slate-500">{inc.district}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {inc.incident_date}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.severity === 'Critical' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        inc.severity === 'Severe' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                        inc.severity === 'Moderate' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                      {inc.event_description}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 truncate max-w-[140px]">
                      {inc.data_source}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 hover:text-teal-700">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="w-6 h-6 text-slate-400" />
                      <p className="font-medium text-slate-700">No past flood events found</p>
                      <p className="text-xs text-slate-400 max-w-sm">No historical records match your current filter settings. Try adjusting the district, year, or severity.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-800">
                    {selectedIncident.incident_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedIncident.severity === 'Critical' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                    selectedIncident.severity === 'Severe' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                    selectedIncident.severity === 'Moderate' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-sky-50 text-sky-800 border border-sky-200'
                  }`}>
                    {selectedIncident.severity}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedIncident.location_name}
                </h3>
              </div>
              <button
                onClick={onCloseIncidentModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Incident Date</span>
                  <span className="text-slate-900 font-semibold font-mono">{selectedIncident.incident_date}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Coordinates</span>
                  <span className="text-teal-800 font-semibold font-mono">{selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">River Level / Gauge</span>
                  <span className="text-amber-800 font-semibold font-mono">{selectedIncident.water_level_m ? `${selectedIncident.water_level_m} m` : 'Unrecorded'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Event Description &amp; Hydrological Context
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedIncident.event_description}
                </p>
              </div>

              {selectedIncident.reported_impact && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Documented Impact &amp; Municipal Response
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {selectedIncident.reported_impact}
                  </p>
                </div>
              )}

              {/* Data Provenance & URL */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Documented Data Source:</span>
                  <span className="text-slate-900 font-medium">{selectedIncident.data_source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Provenance Type:</span>
                  <span className="font-mono text-teal-800 font-semibold">{selectedIncident.provenance_type}</span>
                </div>
                {selectedIncident.source_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Source Agency Reference:</span>
                    <a
                      href={selectedIncident.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-800 flex items-center gap-1 font-mono font-medium"
                    >
                      <span>Open Source Documentation</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={onCloseIncidentModal}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
