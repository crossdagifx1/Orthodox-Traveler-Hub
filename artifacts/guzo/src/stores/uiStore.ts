import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  // Command palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Global loading states
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  
  // Sidebar/mobile navigation
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  
  // Toast notifications queue
  toastQueue: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Active modals/drawers
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  // Search
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Breadcrumbs
  breadcrumbs: Array<{ label: string; href?: string }>;
  setBreadcrumbs: (crumbs: Array<{ label: string; href?: string }>) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Command palette
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      
      // Page loading
      isPageLoading: false,
      setPageLoading: (loading) => set({ isPageLoading: loading }),
      
      // Mobile nav
      isMobileNavOpen: false,
      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
      
      // Toasts
      toastQueue: [],
      addToast: (message, type) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toastQueue: [...state.toastQueue, { id, message, type }],
        }));
        // Auto-remove after 5 seconds
        setTimeout(() => get().removeToast(id), 5000);
      },
      removeToast: (id) => {
        set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== id),
        }));
      },
      
      // Modals
      activeModal: null,
      setActiveModal: (modal) => set({ activeModal: modal }),
      
      // Search
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Breadcrumbs
      breadcrumbs: [],
      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
    }),
    { name: 'ui-store' }
  )
);
