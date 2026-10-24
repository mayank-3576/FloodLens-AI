import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  RotateCcw,
  Crosshair,
  CloudRain,
  AlertTriangle,
  Info,
  Map as MapIcon,
  Check,
  Key,
  ExternalLink
} from 'lucide-react';
import { Location, FloodIncident, LocationRainfallSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { WifiOff } from 'lucide-react';

// Humanistic Custom Map Marker Icons with clear contrast
const createCustomIcon = (bgColor: string, symbol: string, borderColor: string = '#FFFFFF') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid ${borderColor};
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const locationIcon = createCustomIcon('#0F766E', '📍'); // Muted Teal
const rainIcon = createCustomIcon('#0284C7', '💧'); // Water Blue
const minorIncidentIcon = createCustomIcon('#0284C7', '1');
const moderateIncidentIcon = createCustomIcon('#D97706', '2');
const severeIncidentIcon = createCustomIcon('#EA580C', '3');
const criticalIncidentIcon = createCustomIcon('#DC2626', '4');

interface MapComponentProps {
  locations: Location[];
  activeLocation?: Location;
  incidents?: FloodIncident[];
  rainfallSummaries?: LocationRainfallSummary[];
  referenceGeoJSON?: any;
  onSelectLocation?: (locationId: string) => void;
  onSelectIncident?: (incident: FloodIncident) => void;
  heightClass?: string;
}

// Subcomponent to smoothly pan/zoom to active location
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Subcomponent to capture and display coordinates
const CoordinatesTracker: React.FC<{ onCoordsChange: (coords: { lat: number; lng: number }) => void }> = ({
  onCoordsChange
}) => {
  const map = useMap();
  useEffect(() => {
    const handleMove = (e: L.LeafletMouseEvent) => {
      onCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('mousemove', handleMove);
    return () => {
      map.off('mousemove', handleMove);
    };
  }, [map, onCoordsChange]);
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  locations,
  activeLocation,
  incidents = [],
  rainfallSummaries = [],
  referenceGeoJSON,
  onSelectLocation,
  onSelectIncident,
  heightClass = 'h-[520px]'
}) => {
  const { isOnline } = useAuth();
  const defaultCenter: [number, number] = activeLocation
    ? [activeLocation.latitude, activeLocation.longitude]
    : [28.5355, 77.3910]; // Default Noida
  
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState<number>(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: defaultCenter[0], lng: defaultCenter[1] });

  // Map Provider & Tile Styling Configuration
  // Checks environment variable VITE_MAPTILER_API_KEY
  const envMapTilerKey = (import.meta.env.VITE_MAPTILER_API_KEY || '').trim();
  const hasValidMapTilerKey = envMapTilerKey.length > 5 && !envMapTilerKey.includes('placeholder') && !envMapTilerKey.includes('your_');

  // Tile styles available
  const [selectedStyle, setSelectedStyle] = useState<string>(hasValidMapTilerKey ? 'maptiler-streets' : 'osm');
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);
  const [showKeyHelpModal, setShowKeyHelpModal] = useState<boolean>(false);

  // Layer Visibility Toggles
  const [showLocations, setShowLocations] = useState(true);
  const [showRainfall, setShowRainfall] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showGeoJSONBuffers, setShowGeoJSONBuffers] = useState(true);

  // Update center when activeLocation changes
  useEffect(() => {
    if (activeLocation) {
      setCenter([activeLocation.latitude, activeLocation.longitude]);
      setZoom(11);
    }
  }, [activeLocation]);

  const handleReset = () => {
    if (activeLocation) {
      setCenter([activeLocation.latitude, activeLocation.longitude]);
      setZoom(11);
    } else {
      setCenter([28.5355, 77.3910]);
      setZoom(9);
    }
  };

  const getIncidentIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return criticalIncidentIcon;
      case 'severe': return severeIncidentIcon;
      case 'moderate': return moderateIncidentIcon;
      default: return minorIncidentIcon;
    }
  };

  // Configure tile layer URL and attribution based on selected provider
  const getTileLayerConfig = () => {
    if (selectedStyle === 'maptiler-streets' && hasValidMapTilerKey) {
      return {
        url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${envMapTilerKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        providerLabel: 'MapTiler Streets (Active Key)'
      };
    }
    if (selectedStyle === 'maptiler-outdoor' && hasValidMapTilerKey) {
      return {
        url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${envMapTilerKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        providerLabel: 'MapTiler Outdoor (Active Key)'
      };
    }
    if (selectedStyle === 'carto') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        providerLabel: 'CartoDB Voyager (OSM Data)'
      };
    }
    // Default fallback: Standard OpenStreetMap (no key required)
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      providerLabel: 'OpenStreetMap Standard (Free Baseline)'
    };
  };

  const activeTileConfig = getTileLayerConfig();

  const geoJsonStyle = () => ({
    fillColor: '#0D9488',
    weight: 2,
    opacity: 0.85,
    color: '#0F766E',
    dashArray: '4, 4',
    fillOpacity: 0.18
  });

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200/90 bg-slate-50 shadow-soft`}>
      {/* Top Map Control Bar: Layers & Tile Provider Switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-2">
        {/* Layer Visibility Toggles */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-1.5 flex items-center gap-1.5 shadow-soft text-xs">
          <button
            onClick={() => setShowLocations(!showLocations)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              showLocations ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle Monitored Areas"
          >
            📍 Areas
          </button>
          <button
            onClick={() => setShowRainfall(!showRainfall)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              showRainfall ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle Rainfall Observations"
          >
            💧 Rainfall
          </button>
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              showIncidents ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle Past Flood Events"
          >
            ⚠️ Past Events
          </button>
          <button
            onClick={() => setShowGeoJSONBuffers(!showGeoJSONBuffers)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              showGeoJSONBuffers ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle River Drainage Buffers"
          >
            🌊 River Buffers
          </button>
        </div>

        {/* Map Provider Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="bg-white/95 hover:bg-slate-50 backdrop-blur-xs border border-slate-200/90 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium shadow-soft flex items-center gap-1.5 transition-colors"
            title="Select Base Map Provider"
          >
            <MapIcon className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">Tiles</span>
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-card p-2 w-56 text-xs space-y-1 z-[1100]">
              <div className="font-semibold text-slate-800 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                <span>Map Provider</span>
                {hasValidMapTilerKey ? (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Key Active</span>
                ) : (
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">No Key Needed</span>
                )}
              </div>

              {/* OpenStreetMap Standard */}
              <button
                onClick={() => { setSelectedStyle('osm'); setShowStyleMenu(false); }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  selectedStyle === 'osm' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>OpenStreetMap (Free Default)</span>
                {selectedStyle === 'osm' && <Check className="w-3.5 h-3.5 text-teal-700" />}
              </button>

              {/* CartoDB Voyager */}
              <button
                onClick={() => { setSelectedStyle('carto'); setShowStyleMenu(false); }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  selectedStyle === 'carto' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>CartoDB Voyager (OSM)</span>
                {selectedStyle === 'carto' && <Check className="w-3.5 h-3.5 text-teal-700" />}
              </button>

              {/* MapTiler Streets */}
              <button
                onClick={() => {
                  if (hasValidMapTilerKey) {
                    setSelectedStyle('maptiler-streets');
                    setShowStyleMenu(false);
                  } else {
                    setShowKeyHelpModal(true);
                  }
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  selectedStyle === 'maptiler-streets'
                    ? 'bg-teal-50 text-teal-800 font-bold'
                    : hasValidMapTilerKey ? 'hover:bg-slate-50 text-slate-700' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>MapTiler Streets-v2</span>
                {hasValidMapTilerKey ? (
                  selectedStyle === 'maptiler-streets' && <Check className="w-3.5 h-3.5 text-teal-700" />
                ) : (
                  <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 rounded">Key required</span>
                )}
              </button>

              {/* MapTiler Outdoor */}
              <button
                onClick={() => {
                  if (hasValidMapTilerKey) {
                    setSelectedStyle('maptiler-outdoor');
                    setShowStyleMenu(false);
                  } else {
                    setShowKeyHelpModal(true);
                  }
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  selectedStyle === 'maptiler-outdoor'
                    ? 'bg-teal-50 text-teal-800 font-bold'
                    : hasValidMapTilerKey ? 'hover:bg-slate-50 text-slate-700' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>MapTiler Outdoor-v2</span>
                {hasValidMapTilerKey ? (
                  selectedStyle === 'maptiler-outdoor' && <Check className="w-3.5 h-3.5 text-teal-700" />
                ) : (
                  <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 rounded">Key required</span>
                )}
              </button>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => { setShowStyleMenu(false); setShowKeyHelpModal(true); }}
                  className="w-full text-left px-2 py-1 text-[11px] text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  <span>How to add a MapTiler Key</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Map Button */}
        <button
          onClick={handleReset}
          className="bg-white/95 hover:bg-slate-50 backdrop-blur-xs border border-slate-200/90 rounded-lg p-2 text-slate-700 shadow-soft transition-colors"
          title="Reset View to Focus Area"
          aria-label="Reset Map"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>

      {/* Offline Mode Overlay Notice */}
      {!isOnline && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-xs border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-amber-900 shadow-soft flex items-center gap-2 whitespace-nowrap">
          <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span><strong>Offline Mode:</strong> Cached flood markers &amp; locations loaded. Map street tiles may have limited coverage.</span>
        </div>
      )}

      {/* Coordinate & Active Provider Status Bar */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 font-mono shadow-soft flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-teal-700" />
          <span>{coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E</span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="text-[10px] text-slate-500 font-sans">{activeTileConfig.providerLabel}</span>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <ChangeView center={center} zoom={zoom} />
        <CoordinatesTracker onCoordsChange={setCoords} />

        {/* Dynamic Tile Layer (OpenStreetMap baseline or MapTiler enhanced) */}
        <TileLayer
          key={selectedStyle}
          attribution={activeTileConfig.attribution}
          url={activeTileConfig.url}
          maxZoom={19}
        />

        {/* 1. GeoJSON Hydrological Reference Buffers */}
        {showGeoJSONBuffers && referenceGeoJSON && (
          <GeoJSON
            data={referenceGeoJSON}
            style={geoJsonStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; color: #0F172A; max-width: 250px;">
                  <strong style="color: #0F766E; font-size: 13px;">${p.name || 'Riparian Drainage Corridor'}</strong>
                  <p style="margin: 4px 0; color: #475569;">${p.basin_type || 'Hydrological Reference Buffer'}</p>
                  <p style="margin: 4px 0; font-size: 11px;">
                    <strong>Danger Level:</strong> ${p.danger_level_m || 'N/A'}m | <strong>Warning Level:</strong> ${p.warning_level_m || 'N/A'}m
                  </p>
                  <p style="margin: 4px 0; font-size: 10px; color: #64748B;"><em>${p.disclaimer || 'Reference geometry for situational context.'}</em></p>
                </div>
              `);
            }}
          />
        )}

        {/* 2. Monitored Location Markers */}
        {showLocations && locations.map((loc) => (
          <Marker
            key={`loc-${loc.id}`}
            position={[loc.latitude, loc.longitude]}
            icon={locationIcon}
            eventHandlers={{
              click: () => onSelectLocation && onSelectLocation(loc.id)
            }}
          >
            <Popup>
              <div className="font-sans text-xs text-slate-800 p-1">
                <h4 className="font-bold text-sm text-teal-800">{loc.name}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">District: {loc.district}, {loc.state}</p>
                <p className="text-[11px] text-slate-600">Basin: {loc.basin_name || 'Inland Drainage'}</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Elev: {loc.elevation_m || 'N/A'}m</span>
                  {onSelectLocation && (
                    <button
                      onClick={() => onSelectLocation(loc.id)}
                      className="text-[10px] bg-teal-700 hover:bg-teal-800 text-white font-medium px-2 py-0.5 rounded shadow-xs"
                    >
                      Focus Area
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Rainfall Observation Markers */}
        {showRainfall && rainfallSummaries.map((rf) => {
          const matchedLoc = locations.find(l => l.id === rf.location_id);
          if (!matchedLoc) return null;
          // Offset slightly so it does not collide with district center marker
          const pos: [number, number] = [matchedLoc.latitude + 0.005, matchedLoc.longitude + 0.005];

          return (
            <Marker
              key={`rf-${rf.location_id}`}
              position={pos}
              icon={rainIcon}
            >
              <Popup>
                <div className="font-sans text-xs text-slate-800 p-1">
                  <div className="flex items-center gap-1.5 text-sky-800 font-bold">
                    <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                    <span>{rf.name} (Recent Rain)</span>
                  </div>
                  <div className="my-1.5 space-y-0.5">
                    <p className="text-xs">Latest Step: <strong>{rf.rainfall_mm} mm</strong></p>
                    <p className="text-xs">24h Sum: <strong>{rf.accumulation_24h_mm} mm</strong></p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Source: {rf.provenance}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Past Flood Event Markers */}
        {showIncidents && incidents.map((inc) => (
          <Marker
            key={`inc-${inc.incident_id}`}
            position={[inc.latitude, inc.longitude]}
            icon={getIncidentIcon(inc.severity)}
            eventHandlers={{
              click: () => onSelectIncident && onSelectIncident(inc)
            }}
          >
            <Popup>
              <div className="font-sans text-xs text-slate-900 p-1 max-w-[240px]">
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-900">{inc.incident_id}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    inc.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    inc.severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                    inc.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                    'bg-sky-100 text-sky-800'
                  }`}>
                    {inc.severity}
                  </span>
                </div>
                <h5 className="font-semibold text-slate-800 mt-1">{inc.location_name} ({inc.year})</h5>
                <p className="text-[11px] text-slate-600 line-clamp-3 mt-1 leading-relaxed">{inc.event_description}</p>
                <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Date: {inc.incident_date}</span>
                  {onSelectIncident && (
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="text-teal-700 font-semibold hover:underline"
                    >
                      View Dossier &rarr;
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-2.5 shadow-card text-[11px] space-y-1.5 hidden md:block max-w-[210px]">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
          <span>Map Elements</span>
          <span className="text-[10px] font-normal text-slate-500">Legend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-teal-700 inline-block shadow-xs"></span>
          <span className="text-slate-700 text-xs font-medium">Monitored Area</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-sky-600 inline-block shadow-xs"></span>
          <span className="text-slate-700 text-xs font-medium">Rainfall Reading</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-xs"></span>
          <span className="text-slate-700 text-xs font-medium">Past Flood Event</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-2 border border-dashed border-teal-700 bg-teal-600/20 inline-block"></span>
          <span className="text-slate-700 text-xs font-medium">Riparian River Buffer</span>
        </div>
      </div>

      {/* MapTiler Key Information Modal */}
      {showKeyHelpModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800">
                <Key className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">Configuring a MapTiler Key</h3>
              </div>
              <button
                onClick={() => setShowKeyHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Free OpenStreetMap Baseline Active:</strong> GIRIRAKSHAK AI works out of the box with OpenStreetMap without requiring any API keys.
              </p>
              <p>
                To enable high-definition MapTiler tiles (Streets-v2 and Outdoor-v2):
              </p>
              <ol className="list-decimal ml-4 space-y-1 font-mono text-[11px] text-slate-700">
                <li>Create a free account at <a href="https://www.maptiler.com/" target="_blank" rel="noreferrer" className="text-teal-700 underline font-sans">maptiler.com</a></li>
                <li>Copy your API key from the dashboard</li>
                <li>Add it to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-sans">frontend/.env</code>:</li>
              </ol>
              <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">
                VITE_MAPTILER_API_KEY=your_key_here
              </pre>
              <p className="text-[11px] text-slate-500">
                After saving, restart your frontend development server with <code className="bg-slate-100 px-1 rounded font-mono text-slate-700">npm run dev</code>.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <a
                href="https://www.maptiler.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Visit MapTiler</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowKeyHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
