import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserNotification } from '../types';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  notifications: UserNotification[];
  unreadCount: number;
  login: (identifier: string, password: string, selectedRole?: string) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestBrowserNotificationPermission: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  // Initialize session & offline bundle
  useEffect(() => {
    const initSession = async () => {
      // 1. Load active session
      const savedSession = await offlineStorage.getOfflineSession();
      if (savedSession) {
        setToken(savedSession.token);
        setUser(savedSession.user);
        if (navigator.onLine) {
          try {
            const freshUser = await api.getMe();
            setUser(freshUser);
            await offlineStorage.saveOfflineSession({ user: freshUser, token: savedSession.token });
          } catch (e) {
            console.warn('Session verification failed; using cached offline profile:', e);
          }
        }
      }

      // 2. Check cached sync bundle timestamp
      const cachedBundle = await offlineStorage.getSyncBundle();
      if (cachedBundle?.synced_at) {
        setLastSyncedAt(cachedBundle.synced_at);
      } else if (navigator.onLine) {
        // Initial silent sync
        try {
          const fresh = await api.getSyncBundle();
          setLastSyncedAt(fresh.synced_at);
        } catch (e) {}
      }
    };

    initSession();
  }, []);

  // Notifications loader
  const refreshNotifications = useCallback(async () => {
    if (!token || !isOnline) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (e) {
      console.warn('Failed to refresh notifications:', e);
    }
  }, [token, isOnline]);

  useEffect(() => {
    if (token && isOnline) {
      refreshNotifications();
    }
  }, [token, isOnline, refreshNotifications]);

  // Sync Engine (syncs offline reports & fetches fresh bundle)
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return;
    }
    setIsSyncing(true);
    try {
      // 1. Sync any offline queued reports
      await api.syncOfflineQueue();

      // 2. Refresh local data bundle
      const bundle = await api.getSyncBundle();
      setLastSyncedAt(bundle.synced_at);

      // 3. Refresh notifications
      if (token) {
        await refreshNotifications();
      }
    } catch (e) {
      console.error('Manual sync encountered an error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, token, refreshNotifications]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync upon reconnection
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  const login = async (identifier: string, password: string, selectedRole?: string) => {
    const res = await api.login(identifier, password, selectedRole);
    setToken(res.token);
    setUser(res.user);
    if (isOnline) {
      syncNow();
    }
  };

  const register = async (payload: { username: string; email: string; password: string; full_name: string }) => {
    const res = await api.registerCitizen(payload);
    setToken(res.token);
    setUser(res.user);
    if (isOnline) {
      syncNow();
    }
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const requestBrowserNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        console.warn('Browser notification permission request failed:', e);
        return false;
      }
    }
    return false;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isOnline,
        lastSyncedAt,
        isSyncing,
        notifications,
        unreadCount,
        login,
        register,
        logout,
        syncNow,
        refreshNotifications,
        requestBrowserNotificationPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
