/**
 * Store Zustand pour la gestion locale des Clés API
 * Utilisé principalement pour le Playground et les tests
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ===== Types =====

interface PlaygroundState {
  // Clé API active utilisée pour le playground
  activeApiKey: string | null;
  // Nom de la clé active (pour affichage)
  activeKeyName: string | null;
}

interface PlaygroundActions {
  setActiveApiKey: (key: string, name?: string) => void;
  clearActiveApiKey: () => void;
}

type PlaygroundStore = PlaygroundState & PlaygroundActions;

// ===== Store =====

export const usePlaygroundStore = create<PlaygroundStore>()(
  persist(
    (set) => ({
      // Initial state
      activeApiKey: null,
      activeKeyName: null,

      // Actions
      setActiveApiKey: (key, name) => {
        set({
          activeApiKey: key,
          activeKeyName: name || "Clé temporaire",
        });
      },

      clearActiveApiKey: () => {
        set({
          activeApiKey: null,
          activeKeyName: null,
        });
      },
    }),
    {
      name: "rag-playground-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ===== Selectors =====

export const useActiveApiKey = () => usePlaygroundStore((state) => state.activeApiKey);
export const useActiveKeyName = () => usePlaygroundStore((state) => state.activeKeyName);
export const useIsAuthenticated = () => usePlaygroundStore((state) => !!state.activeApiKey);
export const usePlaygroundActions = () => {
  const setActiveApiKey = usePlaygroundStore((state) => state.setActiveApiKey);
  const clearActiveApiKey = usePlaygroundStore((state) => state.clearActiveApiKey);
  return { setActiveApiKey, clearActiveApiKey };
};
