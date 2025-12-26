/**
 * Store Zustand pour l'authentification et la configuration API
 * Gère la clé API et l'état de connexion
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ===== Types =====

interface AuthState {
  apiKey: string | null;
  isAuthenticated: boolean;
  lastVerifiedAt: Date | null;
}

interface AuthActions {
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setAuthenticated: (authenticated: boolean) => void;
  updateLastVerified: () => void;
}

type AuthStore = AuthState & AuthActions;

// ===== Store =====

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      apiKey: null,
      isAuthenticated: false,
      lastVerifiedAt: null,

      // Actions
      setApiKey: (key) => {
        // Stocker aussi dans localStorage pour l'API client legacy
        if (typeof window !== "undefined") {
          localStorage.setItem("rag_api_key", key);
        }
        set({
          apiKey: key,
          isAuthenticated: true,
          lastVerifiedAt: new Date(),
        });
      },

      clearApiKey: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("rag_api_key");
        }
        set({
          apiKey: null,
          isAuthenticated: false,
          lastVerifiedAt: null,
        });
      },

      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
      },

      updateLastVerified: () => {
        set({ lastVerifiedAt: new Date() });
      },
    }),
    {
      name: "rag-agent-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        isAuthenticated: state.isAuthenticated,
        lastVerifiedAt: state.lastVerifiedAt?.toISOString() ?? null,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lastVerifiedAt) {
          state.lastVerifiedAt = new Date(state.lastVerifiedAt as unknown as string);
        }
      },
    }
  )
);

// ===== Selectors =====

export const useApiKey = () => useAuthStore((state) => state.apiKey);

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

export const useAuthActions = () =>
  useAuthStore((state) => ({
    setApiKey: state.setApiKey,
    clearApiKey: state.clearApiKey,
  }));
