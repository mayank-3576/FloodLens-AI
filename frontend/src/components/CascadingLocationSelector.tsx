import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronRight, Search, Building2, Navigation, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { Location, LocationHierarchyResponse, TownItem } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

interface CascadingLocationSelectorProps {
  locations: Location[];
  activeLocationId: string;
  onSelectLocation: (locationId: string) => void;
  compact?: boolean;
}

export const CascadingLocationSelector: React.FC<CascadingLocationSelectorProps> = ({
  locations,
  activeLocationId,
  onSelectLocation,
  compact = false
}) => {
  const { t } = useTranslation();
  const [hierarchyData, setHierarchyData] = useState<LocationHierarchyResponse | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Fetch full hierarchy on mount
  useEffect(() => {
    let isMounted = true;
    const fetchHierarchy = async () => {
      try {
        const data = await api.getHierarchy();
        if (isMounted) setHierarchyData(data);
      } catch (err) {
        console.warn('Failed to load server hierarchy, falling back to local locations list:', err);
      }
    };
    fetchHierarchy();
    return () => { isMounted = false; };
  }, []);

  // Sync selected state and district when activeLocationId changes
  useEffect(() => {
    const currentLoc = locations.find(l => l.id === activeLocationId);
    if (currentLoc) {
      setSelectedState(currentLoc.state);
      setSelectedDistrict(currentLoc.district);
    }
  }, [activeLocationId, locations]);

  // Derived state list
  const availableStates = useMemo(() => {
    if (hierarchyData?.states && hierarchyData.states.length > 0) {
      return hierarchyData.states.map(s => s.name);
    }
    const unique = new Set(locations.map(l => l.state));
    return Array.from(unique).sort();
  }, [hierarchyData, locations]);

  // Derived districts for selected state
  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    if (hierarchyData?.hierarchy?.[selectedState]) {
      return Object.keys(hierarchyData.hierarchy[selectedState]).sort();
    }
    const filtered = locations.filter(l => l.state.toLowerCase() === selectedState.toLowerCase());
    return Array.from(new Set(filtered.map(l => l.district))).sort();
  }, [selectedState, hierarchyData, locations]);

  // Derived towns for selected district
  const availableTowns = useMemo(() => {
    if (!selectedState || !selectedDistrict) return [];
    if (hierarchyData?.hierarchy?.[selectedState]?.[selectedDistrict]) {
      return hierarchyData.hierarchy[selectedState][selectedDistrict];
    }
    return locations
      .filter(l => 
        l.state.toLowerCase() === selectedState.toLowerCase() && 
        l.district.toLowerCase() === selectedDistrict.toLowerCase()
      )
      .map(l => ({
        id: l.id,
        name: l.name,
        town: l.town || l.name,
        district: l.district,
        state: l.state,
        latitude: l.latitude,
        longitude: l.longitude,
        risk_level: 'Low',
        risk_color: 'Green',
        active_warnings_count: 0
      } as TownItem));
  }, [selectedState, selectedDistrict, hierarchyData, locations]);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return locations.filter(l => 
      l.name.toLowerCase().includes(q) ||
      (l.town && l.town.toLowerCase().includes(q)) ||
      l.district.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, locations]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    // Auto-select first district in this state
    if (hierarchyData?.hierarchy?.[state]) {
      const firstDist = Object.keys(hierarchyData.hierarchy[state]).sort()[0];
      setSelectedDistrict(firstDist || '');
      if (firstDist && hierarchyData.hierarchy[state][firstDist]?.length > 0) {
        onSelectLocation(hierarchyData.hierarchy[state][firstDist][0].id);
      }
    } else {
      const match = locations.find(l => l.state === state);
      if (match) {
        setSelectedDistrict(match.district);
        onSelectLocation(match.id);
      }
    }
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    if (selectedState && hierarchyData?.hierarchy?.[selectedState]?.[district]?.length) {
      onSelectLocation(hierarchyData.hierarchy[selectedState][district][0].id);
    } else {
      const match = locations.find(l => l.state === selectedState && l.district === district);
      if (match) onSelectLocation(match.id);
    }
  };

  const activeLoc = locations.find(l => l.id === activeLocationId);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Compact State Select */}
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="bg-slate-50 border border-slate-300 hover:border-teal-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
          title="Filter by State"
        >
          {availableStates.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>

        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />

        {/* Compact District Select */}
        <select
          value={selectedDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className="bg-slate-50 border border-slate-300 hover:border-teal-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
          title="Filter by District"
        >
          {availableDistricts.map(dt => (
            <option key={dt} value={dt}>{dt}</option>
          ))}
        </select>

        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />

        {/* Compact Town Select */}
        <select
          value={activeLocationId}
          onChange={(e) => onSelectLocation(e.target.value)}
          className="bg-teal-50/80 border border-teal-300 hover:border-teal-600 rounded-lg px-2 py-1 text-xs font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          title="Select Town / Locality"
        >
          {availableTowns.map(t => (
            <option key={t.id} value={t.id}>
              {t.town || t.name} {t.risk_level && t.risk_level !== 'Low' ? `(${t.risk_level})` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      {/* Header bar with location indicator and quick search toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Administrative Cascading Selection
            </h2>
            <p className="text-[11px] text-slate-500">
              State <span className="text-slate-300">&rarr;</span> District <span className="text-slate-300">&rarr;</span> Town Granular Intelligence
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('search_placeholder', 'Search town, district, or state...')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(Boolean(e.target.value.trim()));
            }}
            onFocus={() => setIsSearching(Boolean(searchQuery.trim()))}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          />

          {/* Quick Search Dropdown Menu */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute right-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 max-h-60 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Matching Locations
              </div>
              {searchResults.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc.id);
                    setSelectedState(loc.state);
                    setSelectedDistrict(loc.district);
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{loc.town || loc.name}</div>
                    <div className="text-[10px] text-slate-500">{loc.district}, {loc.state}</div>
                  </div>
                  <Navigation className="w-3 h-3 text-teal-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 Cascading Select Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. STATE SELECT */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {t('select_state', '1. Select State / UT')}
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-teal-500 focus:border-teal-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-2xs"
            >
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. DISTRICT SELECT */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {t('select_district', '2. Select District')}
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-teal-500 focus:border-teal-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-2xs"
            >
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. TOWN / LOCALITY SELECT */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">
            {t('select_town', '3. Focus Town / City')}
          </label>
          <div className="relative">
            <select
              value={activeLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="w-full bg-teal-50 border border-teal-300 hover:border-teal-600 focus:border-teal-700 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-teal-950 focus:outline-none transition-all shadow-2xs"
            >
              {availableTowns.map(town => {
                const badge = town.risk_level && town.risk_level !== 'Low' ? ` [Risk: ${town.risk_level}]` : '';
                return (
                  <option key={town.id} value={town.id}>
                    {town.town || town.name} {badge}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Location Quick Breadcrumb Pill */}
      {activeLoc && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500">Active Focus:</span>
            <span className="font-bold text-slate-900">{activeLoc.town || activeLoc.name}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-600 font-medium">{activeLoc.district}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500">{activeLoc.state}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Elevation:</span>
            <span className="font-semibold text-slate-700">{activeLoc.elevation_m || 200} m</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Basin:</span>
            <span className="font-semibold text-teal-800">{activeLoc.basin_name || 'River Catchment'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
