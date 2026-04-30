import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

interface AppState extends UserPreferences {
  // User preferences
  setTheme: (theme: UserPreferences['theme']) => void;
  setLanguage: (lang: string) => void;
  setFontSize: (size: UserPreferences['fontSize']) => void;
  setReducedMotion: (reduced: boolean) => void;
  setHighContrast: (high: boolean) => void;
  
  // Offline state
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  pendingSyncCount: number;
  incrementPendingSync: () => void;
  decrementPendingSync: () => void;
  
  // Feature flags
  featureFlags: Record<string, boolean>;
  setFeatureFlag: (key: string, value: boolean) => void;
  
  // App version
  appVersion: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...DEFAULT_PREFERENCES,
        
        // Preference setters
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setFontSize: (fontSize) => set({ fontSize }),
        setReducedMotion: (reducedMotion) => set({ reducedMotion }),
        setHighContrast: (highContrast) => set({ highContrast }),
        
        // Offline state
        isOnline: navigator?.onLine ?? true,
        setIsOnline: (isOnline) => set({ isOnline }),
        pendingSyncCount: 0,
        incrementPendingSync: () => set((s) => ({ pendingSyncCount: s.pendingSyncCount + 1 })),
        decrementPendingSync: () => set((s) => ({ pendingSyncCount: Math.max(0, s.pendingSyncCount - 1) })),
        
        // Feature flags
        featureFlags: {},
        setFeatureFlag: (key, value) => set((s) => ({
          featureFlags: { ...s.featureFlags, [key]: value },
        })),
        
        // App version
        appVersion: '1.0.0',
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          fontSize: state.fontSize,
          reducedMotion: state.reducedMotion,
          highContrast: state.highContrast,
          featureFlags: state.featureFlags,
        }),
      }
    ),
    { name: 'app-store' }
  )
);
