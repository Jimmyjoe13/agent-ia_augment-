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
  
  // Display
  compactMode: boolean;
  
  // Notifications
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface PreferencesActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Chat
  setUseWebSearch: (enabled: boolean) => void;
  setShowSources: (show: boolean) => void;
  
  // Display
  setCompactMode: (enabled: boolean) => void;
  
  // Notifications
  setSoundEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  // Reset
  resetPreferences: () => void;
}

type PreferencesStore = UserPreferences & PreferencesActions;

// ===== Default Values =====

const defaultPreferences: UserPreferences = {
  sidebarCollapsed: false,
  useWebSearch: true,
  showSources: true,
  compactMode: false,
  soundEnabled: true,
  notificationsEnabled: true,
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

      // Display actions
      setCompactMode: (enabled) =>
        set({ compactMode: enabled }),

      // Notification actions
      setSoundEnabled: (enabled) =>
        set({ soundEnabled: enabled }),
      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),

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
        compactMode: state.compactMode,
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
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
