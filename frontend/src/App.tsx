import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';
import {
  Location,
  DashboardSummary,
  FloodIncident
} from './types';
import { api } from './services/api';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { NoticeBanner } from './components/NoticeBanner';

import { OverviewView } from './views/OverviewView';
import { EarlyWarningView } from './views/EarlyWarningView';
import { RainfallView } from './views/RainfallView';
import { FloodHistoryView } from './views/FloodHistoryView';
import { ExploreMapView } from './views/ExploreMapView';
import { CompareLocationsView } from './views/CompareLocationsView';
import { CommunityReportsView } from './views/CommunityReportsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AssistantView } from './views/AssistantView';
import { DataSourcesView } from './views/DataSourcesView';
import { LoginView } from './views/LoginView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [activeLocationId, setActiveLocationId] = useState<string>('delhi_yamuna');
  const [locations, setLocations] = useState<Location[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<FloodIncident[]>([]);
  const [referenceGeoJSON, setReferenceGeoJSON] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<FloodIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [disclaimerModalOpen, setDisclaimerModalOpen] = useState<boolean>(false);

  // Initial data loading
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        const [locList, geojson, incs] = await Promise.all([
          api.getLocations(),
          api.getReferenceGeoJSON().catch(() => null),
          api.getFloodIncidents().catch(() => ({ items: [] }))
        ]);
        setLocations(locList);
        setReferenceGeoJSON(geojson);
        setIncidents(incs.items);

        // Fetch dashboard summary for default location
        const sum = await api.getDashboardSummary(activeLocationId);
        setSummary(sum);
      } catch (err) {
        console.error('Failed to initialize FloodLens AI application:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // Update summary when activeLocationId changes
  useEffect(() => {
    const updateLocation = async () => {
      try {
        const sum = await api.getDashboardSummary(activeLocationId);
        setSummary(sum);
      } catch (err) {
        console.error('Failed to update location summary:', err);
      }
    };
    if (locations.length > 0) {
      updateLocation();
    }
  }, [activeLocationId]);

  const activeLocation = locations.find(l => l.id === activeLocationId);
  const activeProvenance = summary?.metrics?.dataset_freshness?.badge || 'DEMO_SYNTHETIC';

  const tabTitles: Record<NavTab, string> = {
    overview: 'Overview Dashboard',
    'early-warning': 'Early Warning & Alerts (Multi-Stage)',
    rainfall: 'Recent Rainfall',
    history: 'Past Flood Events',
    map: 'Explore Your Area',
    compare: 'Compare Locations',
    'community-reports': 'Community Flood Reports',
    admin: 'Admin Center',
    assistant: 'FloodLens AI Helper',
    datasources: 'Data Sources & Reliability',
    login: 'Portal Sign In'
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-800 flex flex-col font-sans">
      {/* Unobtrusive Humanistic Notice Banner */}
      <NoticeBanner message="FloodLens AI supports community awareness & multi-stage preparedness. Extended outlooks (7–14d) convey potential atmospheric moisture; confirmed emergency actions must rely strictly on official 0–72h warnings." />

      {/* Header */}
      <Header
        locations={locations}
        activeLocationId={activeLocationId}
        onLocationChange={setActiveLocationId}
        dataFreshness={summary?.data_freshness}
        provenanceType={activeProvenance}
        onOpenDisclaimerModal={() => setDisclaimerModalOpen(true)}
        onNavigateToLogin={() => setCurrentTab('login')}
      />

      {/* Mobile Menu Action Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 text-teal-800 font-semibold py-1 px-2.5 rounded-lg bg-teal-50 border border-teal-200"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
        <span className="font-bold text-slate-800">
          {tabTitles[currentTab]}
        </span>
      </div>

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-canvas">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <OverviewView
                summary={summary}
                locations={locations}
                incidents={incidents}
                referenceGeoJSON={referenceGeoJSON}
                onSelectLocation={setActiveLocationId}
                onSelectIncident={setSelectedIncident}
                onNavigateTab={setCurrentTab}
                isLoading={loading}
              />
            )}

            {currentTab === 'early-warning' && (
              <EarlyWarningView
                activeLocationId={activeLocationId}
                locations={locations}
              />
            )}

            {currentTab === 'rainfall' && (
              <RainfallView
                locations={locations}
                activeLocationId={activeLocationId}
                onLocationChange={setActiveLocationId}
              />
            )}

            {currentTab === 'history' && (
              <FloodHistoryView
                locations={locations}
                onSelectIncident={setSelectedIncident}
                selectedIncident={selectedIncident}
                onCloseIncidentModal={() => setSelectedIncident(null)}
              />
            )}

            {currentTab === 'map' && (
              <ExploreMapView
                locations={locations}
                activeLocation={activeLocation}
                incidents={incidents}
                rainfallSummaries={summary?.location_rainfall || []}
                referenceGeoJSON={referenceGeoJSON}
                onSelectLocation={setActiveLocationId}
                onSelectIncident={setSelectedIncident}
              />
            )}

            {currentTab === 'compare' && (
              <CompareLocationsView
                locations={locations}
              />
            )}

            {currentTab === 'community-reports' && (
              <CommunityReportsView
                locations={locations}
                activeLocationId={activeLocationId}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboardView
                locations={locations}
              />
            )}

            {currentTab === 'assistant' && (
              <AssistantView
                locations={locations}
                activeLocationId={activeLocationId}
              />
            )}

            {currentTab === 'datasources' && (
              <DataSourcesView />
            )}

            {currentTab === 'login' && (
              <LoginView
                onSuccess={() => setCurrentTab('overview')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Methodology & Safety Modal */}
      {disclaimerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">FloodLens AI Information &amp; Warning Guide</h3>
              </div>
              <button
                onClick={() => setDisclaimerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Multi-Stage Early Warning Architecture:</strong> FloodLens AI structures hazard information across 3 distinct operational horizons:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div>&bull; <strong>0–72 Hours:</strong> Short-Range Warnings from IMD &amp; CWC with actionable civil defense instructions.</div>
                <div>&bull; <strong>3–7 Days:</strong> Medium-Range River Catchment Monitoring with upstream barrage discharge data.</div>
                <div>&bull; <strong>7–14 Days:</strong> Extended Atmospheric Outlooks indicating potential circulation moisture patterns with explicit uncertainty metrics.</div>
              </div>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <strong>Important Distinction:</strong> Historical flood records and 14-day rainfall outlooks do <em>NOT</em> constitute a guaranteed flood forecast.
              </div>
              <p className="text-[11px] text-slate-500">
                For official warnings and evacuation directives, always follow the <strong>Central Water Commission (CWC)</strong>, <strong>India Meteorological Department (IMD)</strong>, and local <strong>State Disaster Management Authorities (SDMA)</strong>.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setDisclaimerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
