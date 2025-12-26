/**
 * Export centralisé de tous les stores Zustand
 */

// Preferences
export {
  usePreferencesStore,
  useSidebarCollapsed,
  useToggleSidebar,
  useChatPreferences,
  useNotificationPreferences,
} from "./preferencesStore";

// Chat
export {
  useChatStore,
  useActiveSession,
  useChatSessions,
  useChatMessages,
  useChatIsLoading,
  useCreateSession,
} from "./chatStore";

// Auth
export {
  useAuthStore,
  useApiKey,
  useIsAuthenticated,
  useAuthActions,
} from "./authStore";
