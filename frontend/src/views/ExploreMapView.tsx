import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  CloudRain,
  History,
  RotateCcw,
  Search,
  Filter,
  Info,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Location, FloodIncident, LocationRainfallSummary } from '../types';
import { MapComponent } from '../components/MapComponent';
import { CascadingLocationSelector } from '../components/CascadingLocationSelector';

interface ExploreMapViewProps {
  locations: Location[];
  activeLocation?: Location;
  incidents: FloodIncident[];
  rainfallSummaries: LocationRainfallSummary[];
  referenceGeoJSON: any;
  onSelectLocation: (id: string) => void;
  onSelectIncident: (inc: FloodIncident) => void;
}

export const ExploreMapView: React.FC<ExploreMapViewProps> = ({
  locations,
  activeLocation,
  incidents,
  rainfallSummaries,
  referenceGeoJSON,
  onSelectLocation,
  onSelectIncident
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
    (l.town && l.town.toLowerCase().includes(searchLocation.toLowerCase())) ||
    l.district.toLowerCase().includes(searchLocation.toLowerCase())
  );

  const filteredIncidents = severityFilter
    ? incidents.filter(i => i.severity.toLowerCase() === severityFilter.toLowerCase())
    : incidents;

  return (
    <div className="space-y-4">
      {/* State -> District -> Town Cascading Location Selector */}
      <CascadingLocationSelector
        locations={locations}
        activeLocationId={activeLocation?.id || locations[0]?.id || 'delhi_yamuna'}
        onSelectLocation={onSelectLocation}
      />

      {/* Search & Map Filters Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5 flex-1">
          {/* Quick Location Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search city, district, or river basin..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Quick Focus Area Dropdown */}
          <div className="relative">
            <select
              value={activeLocation?.id || ''}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Choose Area to Center</option>
              {filteredLocations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Incident Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">All Past Incident Severities</option>
              <option value="Critical">Critical Only (Historic Breaches)</option>
              <option value="Severe">Severe Inundations</option>
              <option value="Moderate">Moderate Waterlogging</option>
              <option value="Minor">Minor Runoff</option>
            </select>
          </div>
        </div>

        {/* Guidance disclaimer tag */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Info className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>Interactive map with OpenStreetMap &amp; optional MapTiler cartography</span>
        </div>
      </div>

      {/* Main Map: Centerpiece of this view */}
      <MapComponent
        locations={locations}
        activeLocation={activeLocation}
        incidents={filteredIncidents}
        rainfallSummaries={rainfallSummaries}
        referenceGeoJSON={referenceGeoJSON}
        onSelectLocation={onSelectLocation}
        onSelectIncident={onSelectIncident}
        heightClass="h-[640px]"
      />

      {/* Quick Location Selection Cards */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Quickly Pan to Monitored Areas:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {locations.map((loc) => {
            const isSelected = activeLocation?.id === loc.id;
            const locRain = rainfallSummaries.find(r => r.location_id === loc.id);

            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-300 shadow-soft ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">{loc.name.split(' (')[0]}</span>
                  <span className="text-[11px] text-teal-700 font-mono font-semibold">
                    {locRain ? `${locRain.accumulation_24h_mm} mm` : '0 mm'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{loc.basin_name || loc.district}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
