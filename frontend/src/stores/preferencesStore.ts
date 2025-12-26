/**
 * Store Zustand pour les préférences utilisateur
 * Persisté dans localStorage
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ===== Types =====

interface UserPreferences {
  // Sidebar
  sidebarCollapsed: boolean;
  
  // Chat
  useWebSearch: boolean;
  showSources: boolean;
  forceRag: boolean;
  enableReflection: boolean;
  useStreaming: boolean;
  
  // Display
  compactMode: boolean;
  showRoutingInfo: boolean;
  
  // Notifications
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  
  // Provider settings
  preferredProvider: string | null;
  preferredModel: string | null;
}

interface PreferencesActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Chat
  setUseWebSearch: (enabled: boolean) => void;
  setShowSources: (show: boolean) => void;
  setForceRag: (enabled: boolean) => void;
  setEnableReflection: (enabled: boolean) => void;
  setUseStreaming: (enabled: boolean) => void;
  
  // Display
  setCompactMode: (enabled: boolean) => void;
  setShowRoutingInfo: (show: boolean) => void;
  
  // Notifications
  setSoundEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  // Provider
  setPreferredProvider: (provider: string | null) => void;
  setPreferredModel: (model: string | null) => void;
  
  // Reset
  resetPreferences: () => void;
}

type PreferencesStore = UserPreferences & PreferencesActions;

// ===== Default Values =====

const defaultPreferences: UserPreferences = {
  sidebarCollapsed: false,
  useWebSearch: true,
  showSources: true,
  forceRag: false,
  enableReflection: false,
  useStreaming: false,
  compactMode: false,
  showRoutingInfo: false,
  soundEnabled: true,
  notificationsEnabled: true,
  preferredProvider: null,
  preferredModel: null,
};

// ===== Store =====

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultPreferences,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      // Chat actions
      setUseWebSearch: (enabled) =>
        set({ useWebSearch: enabled }),
      setShowSources: (show) =>
        set({ showSources: show }),
      setForceRag: (enabled) =>
        set({ forceRag: enabled }),
      setEnableReflection: (enabled) =>
        set({ enableReflection: enabled }),
      setUseStreaming: (enabled) =>
        set({ useStreaming: enabled }),

      // Display actions
      setCompactMode: (enabled) =>
        set({ compactMode: enabled }),
      setShowRoutingInfo: (show) =>
        set({ showRoutingInfo: show }),

      // Notification actions
      setSoundEnabled: (enabled) =>
        set({ soundEnabled: enabled }),
      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),
      
      // Provider actions
      setPreferredProvider: (provider) =>
        set({ preferredProvider: provider }),
      setPreferredModel: (model) =>
        set({ preferredModel: model }),

      // Reset
      resetPreferences: () =>
        set(defaultPreferences),
    }),
    {
      name: "rag-agent-preferences",
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        useWebSearch: state.useWebSearch,
        showSources: state.showSources,
        forceRag: state.forceRag,
        enableReflection: state.enableReflection,
        useStreaming: state.useStreaming,
        compactMode: state.compactMode,
        showRoutingInfo: state.showRoutingInfo,
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
        preferredProvider: state.preferredProvider,
        preferredModel: state.preferredModel,
      }),
    }
  )
);

// ===== Selectors =====

export const useSidebarCollapsed = () =>
  usePreferencesStore((state) => state.sidebarCollapsed);

export const useToggleSidebar = () =>
  usePreferencesStore((state) => state.toggleSidebar);

export const useChatPreferences = () =>
  usePreferencesStore((state) => ({
    useWebSearch: state.useWebSearch,
    showSources: state.showSources,
  }));

export const useNotificationPreferences = () =>
  usePreferencesStore((state) => ({
    soundEnabled: state.soundEnabled,
    notificationsEnabled: state.notificationsEnabled,
  }));
