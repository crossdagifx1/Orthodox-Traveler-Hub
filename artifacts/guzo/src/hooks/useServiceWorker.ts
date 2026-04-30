import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isActivated: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  waitingWorker: ServiceWorker | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isActivated: false,
    isOnline: true,
    updateAvailable: false,
    waitingWorker: null,
  });

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    // Register service worker
    registerServiceWorker();

    // Listen for online/offline status
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setState((prev) => ({ ...prev, isRegistered: true }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({
                ...prev,
                updateAvailable: true,
                waitingWorker: newWorker,
              }));
            }
          });
        }
      });

      // Check if already activated
      if (navigator.serviceWorker.controller) {
        setState((prev) => ({ ...prev, isActivated: true }));
      }

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (state.waitingWorker) {
      state.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setState((prev) => ({ ...prev, waitingWorker: null }));
    }
  }, [state.waitingWorker]);

  const unregisterServiceWorker = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      setState((prev) => ({ ...prev, isRegistered: false, isActivated: false }));
    }
  }, []);

  return {
    ...state,
    updateServiceWorker,
    unregisterServiceWorker,
  };
}

// Hook for offline mutation queue
interface QueuedMutation {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToQueue = useCallback(async (mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) => {
    const item: QueuedMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    // Store in IndexedDB
    await storeMutation(item);
    setQueue((prev) => [...prev, item]);
  }, []);

  const syncQueue = useCallback(async () => {
    setIsSyncing(true);
    const mutations = await getQueuedMutations();
    
    for (const mutation of mutations) {
      try {
        await fetch(mutation.url, {
          method: mutation.method,
          headers: mutation.headers,
          body: mutation.body,
        });
        await removeMutation(mutation.id);
        setQueue((prev) => prev.filter((m) => m.id !== mutation.id));
      } catch (error) {
        console.error('Failed to sync mutation:', error);
      }
    }
    
    setIsSyncing(false);
  }, []);

  return {
    queue,
    isSyncing,
    addToQueue,
    syncQueue,
  };
}

// IndexedDB helpers
const DB_NAME = 'guzo-offline';
const DB_VERSION = 1;
const STORE_NAME = 'mutations';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function storeMutation(mutation: QueuedMutation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(mutation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as QueuedMutation[]);
    request.onerror = () => reject(request.error);
  });
}

async function removeMutation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
