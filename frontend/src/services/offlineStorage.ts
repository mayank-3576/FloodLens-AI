import { SyncBundle, CommunityReport, User, UserSubscription } from '../types';

const DB_NAME = 'floodlens_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sync_bundle')) {
        db.createObjectStore('sync_bundle', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('offline_reports_queue')) {
        db.createObjectStore('offline_reports_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline_user_session')) {
        db.createObjectStore('offline_user_session', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('user_preferences')) {
        db.createObjectStore('user_preferences', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  async saveSyncBundle(bundle: SyncBundle): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_bundle', 'readwrite');
        const store = tx.objectStore('sync_bundle');
        store.put({ key: 'latest', ...bundle });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Failed to save sync bundle to IndexedDB:', e);
    }
  },

  async getSyncBundle(): Promise<SyncBundle | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_bundle', 'readonly');
        const store = tx.objectStore('sync_bundle');
        const request = store.get('latest');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('Failed to retrieve sync bundle from IndexedDB:', e);
      return null;
    }
  },

  async queueOfflineReport(report: any): Promise<string> {
    const id = report.id || `crep_offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const queuedItem = {
      ...report,
      id,
      status: 'pending',
      is_queued_offline: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_reports_queue', 'readwrite');
        const store = tx.objectStore('offline_reports_queue');
        store.put(queuedItem);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB unavailable; saving to localStorage:', e);
      const list = JSON.parse(localStorage.getItem('floodlens_offline_reports') || '[]');
      list.push(queuedItem);
      localStorage.setItem('floodlens_offline_reports', JSON.stringify(list));
      return id;
    }
  },

  async getQueuedReports(): Promise<CommunityReport[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_reports_queue', 'readonly');
        const store = tx.objectStore('offline_reports_queue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return JSON.parse(localStorage.getItem('floodlens_offline_reports') || '[]');
    }
  },

  async removeQueuedReport(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_reports_queue', 'readwrite');
        const store = tx.objectStore('offline_reports_queue');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('floodlens_offline_reports') || '[]');
      const filtered = list.filter((r: any) => r.id !== id);
      localStorage.setItem('floodlens_offline_reports', JSON.stringify(filtered));
    }
  },

  async saveOfflineSession(session: { user: User; token: string }): Promise<void> {
    try {
      localStorage.setItem('floodlens_auth_token', session.token);
      localStorage.setItem('floodlens_auth_user', JSON.stringify(session.user));
      const db = await openDB();
      const tx = db.transaction('offline_user_session', 'readwrite');
      tx.objectStore('offline_user_session').put({ key: 'active_session', ...session });
    } catch (e) {
      // localStorage already updated
    }
  },

  async getOfflineSession(): Promise<{ user: User; token: string } | null> {
    const token = localStorage.getItem('floodlens_auth_token');
    const userStr = localStorage.getItem('floodlens_auth_user');
    if (token && userStr) {
      try {
        return { token, user: JSON.parse(userStr) };
      } catch (e) {}
    }
    return null;
  },

  async clearOfflineSession(): Promise<void> {
    localStorage.removeItem('floodlens_auth_token');
    localStorage.removeItem('floodlens_auth_user');
    try {
      const db = await openDB();
      const tx = db.transaction('offline_user_session', 'readwrite');
      tx.objectStore('offline_user_session').delete('active_session');
    } catch (e) {}
  },

  async saveOfflineSubscriptions(sub: UserSubscription): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction('user_preferences', 'readwrite');
      tx.objectStore('user_preferences').put({ key: 'subscriptions', ...sub });
    } catch (e) {
      localStorage.setItem('floodlens_offline_subs', JSON.stringify(sub));
    }
  },

  async getOfflineSubscriptions(): Promise<UserSubscription | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('user_preferences', 'readonly');
        const req = tx.objectStore('user_preferences').get('subscriptions');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      const s = localStorage.getItem('floodlens_offline_subs');
      return s ? JSON.parse(s) : null;
    }
  }
};
