import React from 'react';
import {
  LayoutDashboard,
  CloudRain,
  History,
  GitCompare,
  Bot,
  Database,
  ShieldCheck,
  Compass,
  AlertTriangle,
  FileText,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 
  | 'overview'
  | 'early-warning'
  | 'rainfall'
  | 'history'
  | 'map'
  | 'compare'
  | 'community-reports'
  | 'admin'
  | 'assistant'
  | 'datasources'
  | 'login';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile
}) => {
  const { isAuthenticated, isAdmin } = useAuth();

  const publicNavItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'early-warning',
      label: 'Early Warning & Alerts',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      badge: 'Multi-Stage',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
    },
    { id: 'rainfall', label: 'Recent Rainfall', icon: <CloudRain className="w-4 h-4" /> },
    { id: 'history', label: 'Past Flood Events', icon: <History className="w-4 h-4" /> },
    { id: 'map', label: 'Explore Your Area', icon: <Compass className="w-4 h-4" /> },
    { id: 'compare', label: 'Compare Locations', icon: <GitCompare className="w-4 h-4" /> },
    {
      id: 'community-reports',
      label: 'Community Reports',
      icon: <FileText className="w-4 h-4" />,
      badge: 'Citizen Intel',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-200'
    },
    { id: 'assistant', label: 'FloodLens AI Helper', icon: <Bot className="w-4 h-4" />, badge: 'AI Assistant' },
    { id: 'datasources', label: 'Data Sources & Reliability', icon: <Database className="w-4 h-4" /> },
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-3.5 border-b border-slate-100 lg:hidden flex justify-between items-center bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-2">
            Disaster Intelligence
          </div>

          {publicNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-semibold border border-teal-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`${isActive ? 'text-teal-700' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${
                    item.badgeColor || 'bg-teal-100 text-teal-800 border-teal-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Navigation (Only visible when user is Admin) */}
          {isAdmin && (
            <div className="pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 px-3 pb-2">
                Administration
              </div>
              <button
                onClick={() => handleSelect('admin')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200 shadow-xs'
                    : 'text-indigo-950 hover:bg-indigo-50/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-700" />
                  <span className="font-semibold text-indigo-950">Admin Center</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Officer
                </span>
              </button>
            </div>
          )}

          {/* Sign In Link if not authenticated */}
          {!isAuthenticated && (
            <div className="pt-3">
              <button
                onClick={() => handleSelect('login')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'login'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200'
                    : 'text-teal-800 hover:bg-teal-50 border border-transparent'
                }`}
              >
                <LogIn className="w-4 h-4 text-teal-700" />
                <span>Citizen / Admin Sign In</span>
              </button>
            </div>
          )}
        </nav>

        {/* Community Info Card */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 m-3 rounded-xl border">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="text-xs font-bold text-slate-900">Safety &amp; Reliability</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Extended outlooks (7–14d) convey potential atmospheric moisture patterns. Always defer to official civil warnings (0–72h).
          </p>
        </div>
      </aside>
    </>
  );
};
