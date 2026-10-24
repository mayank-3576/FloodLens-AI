import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  GitCompare,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  CloudRain,
  History,
  Layers,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { Location, LocationComparisonResponse } from '../types';
import { api } from '../services/api';
import { MapComponent } from '../components/MapComponent';

interface CompareLocationsViewProps {
  locations: Location[];
}

export const CompareLocationsView: React.FC<CompareLocationsViewProps> = ({ locations }) => {
  // Default compare Noida, Ghaziabad, and Central Delhi
  const [selectedIds, setSelectedIds] = useState<string[]>(['noida', 'ghaziabad', 'delhi_yamuna']);
  const [comparisonData, setComparisonData] = useState<LocationComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchComparison = async () => {
    if (selectedIds.length < 2) return;
    try {
      setLoading(true);
      const res = await api.compareLocations(selectedIds);
      setComparisonData(res);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedIds]);

  const toggleLocation = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  // Prepare grouped bar chart data: Rainfall vs Incidents
  const chartData = comparisonData?.locations.map(loc => ({
    name: loc.location_name.split(' (')[0],
    'Latest Rain (mm)': loc.latest_rainfall_mm || 0,
    '24h Total (mm)': loc.accumulation_24h_mm || 0,
    'Past Events': loc.total_incidents
  })) || [];

  const comparedLocationObjects = locations.filter(l => selectedIds.includes(l.id));

  return (
    <div className="space-y-6">
      {/* Header and Selection Chips */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-teal-700" />
              <span>Compare Multiple Locations</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select 2 to 4 locations side-by-side to understand relative rainfall, drainage context, and past event history
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {selectedIds.length} of 4 Selected
          </span>
        </div>

        {/* Location Selector Chips */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {locations.map((loc) => {
            const isSelected = selectedIds.includes(loc.id);
            return (
              <button
                key={loc.id}
                onClick={() => toggleLocation(loc.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5" />}
                <span>{loc.town || loc.name.split(' (')[0]} ({loc.district})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transparent Methodology Guidance */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-soft flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900">TRANSPARENT COMPARISON NOTE:</span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Comparative metrics use synchronized 24-hour rainfall windows and documented historical incident logs (2005–2024).
            Differences in incident counts reflect river basin proximity, local elevation, and municipal reporting history rather than an arbitrary risk score.
          </p>
        </div>
      </div>

      {/* Summary Cards for Selected Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {comparisonData?.locations.map((item) => (
          <div
            key={item.location_id}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                  {item.state}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.has_missing_data ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {item.has_missing_data ? 'Data Gaps' : 'Continuous Log'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {item.location_name}
              </h3>
              <p className="text-xs text-slate-500">{item.basin_name || item.district}</p>
            </div>

            {/* Metrics List */}
            <div className="space-y-2 py-2.5 border-y border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" /> Latest Rain:
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {item.latest_rainfall_mm !== null && item.latest_rainfall_mm !== undefined
                    ? `${item.latest_rainfall_mm} mm`
                    : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-700" /> 24h Rainfall:
                </span>
                <span className="font-bold text-teal-800 font-mono">
                  {item.accumulation_24h_mm !== null && item.accumulation_24h_mm !== undefined
                    ? `${item.accumulation_24h_mm} mm`
                    : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-600" /> Past Events:
                </span>
                <span className="font-bold text-amber-800 font-mono">
                  {item.total_incidents}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> 48h Coverage:
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {item.record_coverage_pct}%
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Freshness: <span className="font-medium text-slate-700">{item.data_freshness_status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Grouped Chart & Focused Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Comparative Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Synchronized Comparative Chart</h3>
              <p className="text-xs text-slate-500">Comparing 24h total rainfall alongside recorded past flood events</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="24h Total (mm)" fill="#0F766E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Latest Rain (mm)" fill="#0284C7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Past Events" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highlight Map (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Comparative Geographic Context</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Locations currently selected in comparison
            </p>
          </div>

          <MapComponent
            locations={comparedLocationObjects}
            heightClass="h-[260px]"
          />
        </div>
      </div>

      {/* Side-by-Side Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Standardized Comparison Matrix
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Location Attribute</th>
                {comparisonData?.locations.map(loc => (
                  <th key={loc.location_id} className="py-2.5 px-3 text-teal-900 font-bold">
                    {loc.location_name.split(' (')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">District &amp; State</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 text-slate-800">
                    {l.district}, {l.state}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">River Basin Context</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 text-slate-700">
                    {l.basin_name || 'Inland Drainage'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Geographic Coordinates</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 font-mono text-slate-700">
                    {l.latitude.toFixed(4)}°N, {l.longitude.toFixed(4)}°E
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Latest Rain Reading</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 font-bold text-teal-800 font-mono">
                    {l.latest_rainfall_mm ?? 'N/A'} mm
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">24h Rainfall Total</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                    {l.accumulation_24h_mm ?? 'N/A'} mm
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Documented Past Events</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 font-bold text-amber-800 font-mono">
                    {l.total_incidents} recorded
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Severe / Critical Events</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 font-bold text-rose-700 font-mono">
                    {(l.incidents_by_severity?.['Critical'] || 0) + (l.incidents_by_severity?.['Severe'] || 0)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Data Completeness</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3 text-slate-700 font-mono">
                    {l.record_coverage_pct}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Quality &amp; Continuity</td>
                {comparisonData?.locations.map(l => (
                  <td key={l.location_id} className="py-2.5 px-3">
                    {l.has_missing_data ? (
                      <span className="text-amber-800 flex items-center gap-1 text-[11px] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Data Gaps
                      </span>
                    ) : (
                      <span className="text-emerald-800 flex items-center gap-1 text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Continuous
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
