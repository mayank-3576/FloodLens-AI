import React, { useState } from 'react';
import {
  Shield, ChevronDown, Info, MapPin, Wifi, WifiOff,
  RefreshCw, Bell, User as UserIcon, LogOut, CheckCheck,
  CheckCircle, Globe
} from 'lucide-react';
import { Location } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';

interface HeaderProps {
  locations: Location[];
  activeLocationId: string;
  onLocationChange: (id: string) => void;
  dataFreshness?: string;
  provenanceType?: string;
  onOpenDisclaimerModal?: () => void;
  onNavigateToLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  locations,
  activeLocationId,
  onLocationChange,
  provenanceType = 'DEMO_SYNTHETIC',
  onOpenDisclaimerModal,
  onNavigateToLogin
}) => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    role,
    logout,
    isOnline,
    lastSyncedAt,
    isSyncing,
    syncNow,
    notifications,
    unreadCount,
    refreshNotifications
  } = useAuth();

  const { language, setLanguage, supportedLanguages, currentLanguageOption, t } = useTranslation();

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getStatusBadge = (type: string) => {
    if (type === 'LIVE_API') {
      return {
        label: 'Live Weather Telemetry',
        dotClass: 'bg-emerald-500 animate-pulse',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    }
    if (type === 'HISTORICAL_PUBLIC') {
      return {
        label: 'Public Historical Records',
        dotClass: 'bg-teal-500',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200'
      };
    }
    return {
      label: 'Demonstration Baseline Data',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  };

  const status = getStatusBadge(provenanceType);

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Not synced yet';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Recent';
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await refreshNotifications();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await refreshNotifications();
    } catch (e) {}
  };

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 lg:px-7 py-3 sticky top-0 z-30 shadow-soft">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
            <Shield className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1">
                <span>FloodLens</span>
                <span className="text-teal-700 font-extrabold">AI</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                Early Warning &amp; Preparedness
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden xs:block">
              Multi-Stage Flood Intelligence &amp; Community Awareness
            </p>
          </div>
        </div>

        {/* Center / Right: Location Selector, Online/Offline, Sync, Notifications & Auth */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 ml-auto">
          {/* Location Dropdown */}
          <div className="relative">
            <label htmlFor="location-select" className="sr-only">Focus Location</label>
            <div className="flex items-center bg-slate-50 border border-slate-300 hover:border-teal-500 rounded-lg px-2.5 py-1.5 transition-all text-xs focus-within:ring-2 focus-within:ring-teal-500/20">
              <MapPin className="w-3.5 h-3.5 text-teal-700 mr-1.5 shrink-0" />
              <select
                id="location-select"
                value={activeLocationId}
                onChange={(e) => onLocationChange(e.target.value)}
                className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer pr-4 appearance-none text-xs max-w-[170px] sm:max-w-xs truncate"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-white text-slate-900">
                    {loc.town ? `${loc.town} (${loc.district}, ${loc.state})` : loc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-3" />
            </div>
          </div>

          {/* Multilingual Selector (13 Indian Languages) */}
          <div className="relative">
            <label htmlFor="language-select" className="sr-only">Select Language</label>
            <div className="flex items-center bg-teal-50/70 border border-teal-200 hover:border-teal-500 rounded-lg px-2.5 py-1.5 transition-all text-xs focus-within:ring-2 focus-within:ring-teal-500/20">
              <Globe className="w-3.5 h-3.5 text-teal-700 mr-1.5 shrink-0" />
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-teal-900 font-bold focus:outline-none cursor-pointer pr-4 appearance-none text-xs"
                title="Select Language (Bhashini AI / Offline Localized)"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white text-slate-900">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-teal-600 pointer-events-none -ml-3" />
            </div>
          </div>

          {/* Online / Offline Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title={isOnline ? 'Connected to live platform servers' : 'Offline Mode: Operating from local IndexedDB cache'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden md:inline font-semibold">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold">Offline Cache</span>
              </>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={() => syncNow()}
            disabled={!isOnline || isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              isSyncing
                ? 'bg-teal-50 text-teal-800 border-teal-300 cursor-wait'
                : isOnline
                ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300 hover:text-slate-900'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title={`Last synced: ${formatLastSync(lastSyncedAt)}. Click to refresh offline cache.`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline text-[11px]">
              {isSyncing ? 'Syncing...' : `Sync (${formatLastSync(lastSyncedAt)})`}
            </span>
          </button>

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
              title="Flood Warnings & Alert Center"
              aria-label="Notification center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifDrawer && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-teal-700" />
                    <span className="font-semibold text-xs text-slate-900">Alert Center &amp; Notifications</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                      No new alerts or warnings for your monitored locations.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.is_read
                            ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                            : 'bg-amber-50/60 border-amber-200 text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-[11px] text-amber-900">
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-semibold tracking-wider text-teal-700">
                            {n.stage.replace('_', ' ')}
                          </span>
                          <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account & Role Badge */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  isAdmin ? 'bg-indigo-700' : 'bg-teal-700'
                }`}>
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="font-semibold text-slate-900 hidden sm:inline max-w-[100px] truncate">
                  {user?.full_name}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                    : 'bg-teal-100 text-teal-900 border border-teal-200'
                }`}>
                  {isAdmin ? 'Admin' : 'Citizen'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                    <p className="text-[10px] text-teal-700 font-semibold mt-0.5 capitalize">
                      Role: {role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Methodology / Information Button */}
          {onOpenDisclaimerModal && (
            <button
              onClick={onOpenDisclaimerModal}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200 transition-colors"
              title="Methodology, uncertainty disclaimers & emergency guidelines"
              aria-label="Information & disclaimer"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
