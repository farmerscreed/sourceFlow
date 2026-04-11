import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SupplierCategory,
  SupplierStatus,
  VerificationStatus,
  PhotoTag,
  SupplierFilters,
  SupplierSort,
  CaptureFormState,
} from './types';

// ============================================================
// APP STATE STORE
// ============================================================

interface AppState {
  // Online status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Sync status
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  setPendingSyncCount: (count: number) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncAt: (date: string) => void;

  // Active tab (for bottom nav)
  activeTab: 'home' | 'capture' | 'suppliers' | 'compare' | 'more';
  setActiveTab: (tab: AppState['activeTab']) => void;

  // Supplier filters
  filters: SupplierFilters;
  setFilters: (filters: Partial<SupplierFilters>) => void;
  resetFilters: () => void;

  // Supplier sort
  sort: SupplierSort;
  setSort: (sort: SupplierSort) => void;

  // Compare selection
  compareCategory: SupplierCategory | null;
  compareSupplierIds: string[];
  setCompareCategory: (category: SupplierCategory | null) => void;
  addToCompare: (supplierId: string) => void;
  removeFromCompare: (supplierId: string) => void;
  clearCompare: () => void;
}

const defaultFilters: SupplierFilters = {
  category: 'all',
  status: 'all',
  verification: 'all',
  search: '',
};

const defaultSort: SupplierSort = {
  by: 'date',
  direction: 'desc',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Online status
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setIsOnline: (online) => set({ isOnline: online }),

      // Sync status
      pendingSyncCount: 0,
      isSyncing: false,
      lastSyncAt: null,
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      // Active tab
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Filters
      filters: defaultFilters,
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Sort
      sort: defaultSort,
      setSort: (sort) => set({ sort }),

      // Compare
      compareCategory: null,
      compareSupplierIds: [],
      setCompareCategory: (category) =>
        set({ compareCategory: category, compareSupplierIds: [] }),
      addToCompare: (supplierId) =>
        set((state) => {
          if (state.compareSupplierIds.length >= 3) return state;
          if (state.compareSupplierIds.includes(supplierId)) return state;
          return {
            compareSupplierIds: [...state.compareSupplierIds, supplierId],
          };
        }),
      removeFromCompare: (supplierId) =>
        set((state) => ({
          compareSupplierIds: state.compareSupplierIds.filter(
            (id) => id !== supplierId
          ),
        })),
      clearCompare: () => set({ compareSupplierIds: [], compareCategory: null }),
    }),
    {
      name: 'sourceflow-app-state',
      partialize: (state) => ({
        // Only persist these fields
        filters: state.filters,
        sort: state.sort,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// ============================================================
// CAPTURE FORM STORE (not persisted)
// ============================================================

interface CaptureState {
  form: CaptureFormState;
  isRecording: boolean;
  recordingDuration: number;

  // Form actions
  setCompanyName: (name: string) => void;
  setBoothNumber: (booth: string) => void;
  toggleCategory: (category: SupplierCategory) => void;
  setRating: (rating: number) => void;

  // Photo actions
  addPhoto: (photo: CaptureFormState['photos'][0]) => void;
  removePhoto: (localId: string) => void;

  // Voice note actions
  addVoiceNote: (note: CaptureFormState['voiceNotes'][0]) => void;
  removeVoiceNote: (localId: string) => void;

  // Recording state
  setIsRecording: (recording: boolean) => void;
  setRecordingDuration: (duration: number) => void;

  // Reset
  resetForm: () => void;
}

const defaultCaptureForm: CaptureFormState = {
  companyName: '',
  boothNumber: '',
  categories: [],
  rating: 0,
  photos: [],
  voiceNotes: [],
};

export const useCaptureStore = create<CaptureState>((set) => ({
  form: defaultCaptureForm,
  isRecording: false,
  recordingDuration: 0,

  setCompanyName: (name) =>
    set((state) => ({
      form: { ...state.form, companyName: name },
    })),

  setBoothNumber: (booth) =>
    set((state) => ({
      form: { ...state.form, boothNumber: booth },
    })),

  toggleCategory: (category) =>
    set((state) => {
      const current = state.form.categories;
      const newCategories = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return {
        form: { ...state.form, categories: newCategories },
      };
    }),

  setRating: (rating) =>
    set((state) => ({
      form: { ...state.form, rating },
    })),

  addPhoto: (photo) =>
    set((state) => ({
      form: { ...state.form, photos: [...state.form.photos, photo] },
    })),

  removePhoto: (localId) =>
    set((state) => ({
      form: {
        ...state.form,
        photos: state.form.photos.filter((p) => p.localId !== localId),
      },
    })),

  addVoiceNote: (note) =>
    set((state) => ({
      form: { ...state.form, voiceNotes: [...state.form.voiceNotes, note] },
    })),

  removeVoiceNote: (localId) =>
    set((state) => ({
      form: {
        ...state.form,
        voiceNotes: state.form.voiceNotes.filter((n) => n.localId !== localId),
      },
    })),

  setIsRecording: (recording) => set({ isRecording: recording }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),

  resetForm: () =>
    set({
      form: defaultCaptureForm,
      isRecording: false,
      recordingDuration: 0,
    }),
}));

// ============================================================
// TOAST STORE (for notifications)
// ============================================================

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration (default 3 seconds)
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));
