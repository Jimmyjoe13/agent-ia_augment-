/**
 * Store Zustand pour la session de chat
 * Gère l'historique des conversations et la session active
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Message, Source } from "@/types/api";

// ===== Types =====

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // Session active
  activeSessionId: string | null;
  sessions: ChatSession[];
  
  // État courant
  isLoading: boolean;
  
  // Messages de la session active
  currentMessages: Message[];
}

interface ChatActions {
  // Session management
  createSession: (title?: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;
  clearAllSessions: () => void;
  
  // Message management
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, sources?: Source[], conversationId?: string) => void;
  removeLoadingMessage: () => void;
  clearCurrentMessages: () => void;
  
  // Loading state
  setIsLoading: (loading: boolean) => void;
  
  // Session sync
  saveCurrentSession: () => void;
}

type ChatStore = ChatState & ChatActions;

// ===== Helpers =====

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const createNewSession = (title?: string): ChatSession => ({
  id: generateSessionId(),
  title: title || `Conversation ${new Date().toLocaleDateString("fr-FR")}`,
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ===== Store =====

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeSessionId: null,
      sessions: [],
      isLoading: false,
      currentMessages: [],

      // Session management
      createSession: (title) => {
        const newSession = createNewSession(title);
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
          currentMessages: [],
        }));
        return newSession.id;
      },

      switchSession: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          // Sauvegarder d'abord la session actuelle
          get().saveCurrentSession();
          
          set({
            activeSessionId: sessionId,
            currentMessages: session.messages,
          });
        }
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== sessionId);
          const isActiveSession = state.activeSessionId === sessionId;
          
          return {
            sessions: newSessions,
            activeSessionId: isActiveSession
              ? newSessions[0]?.id ?? null
              : state.activeSessionId,
            currentMessages: isActiveSession
              ? newSessions[0]?.messages ?? []
              : state.currentMessages,
          };
        });
      },

      renameSession: (sessionId, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title, updatedAt: new Date() } : s
          ),
        }));
      },

      clearAllSessions: () => {
        set({
          sessions: [],
          activeSessionId: null,
          currentMessages: [],
        });
      },

      // Message management
      addMessage: (message) => {
        set((state) => ({
          currentMessages: [...state.currentMessages, message],
        }));
      },

      updateLastMessage: (content, sources, conversationId) => {
        set((state) => {
          const messages = [...state.currentMessages];
          const lastIndex = messages.length - 1;
          
          if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content,
              sources,
              conversationId,
              isLoading: false,
            };
          }
          
          return { currentMessages: messages };
        });
      },

      removeLoadingMessage: () => {
        set((state) => ({
          currentMessages: state.currentMessages.filter((m) => !m.isLoading),
        }));
      },

      clearCurrentMessages: () => {
        set({ currentMessages: [] });
      },

      // Loading state
      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Session sync
      saveCurrentSession: () => {
        const { activeSessionId, currentMessages, sessions } = get();
        
        if (activeSessionId && currentMessages.length > 0) {
          set({
            sessions: sessions.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: currentMessages, updatedAt: new Date() }
                : s
            ),
          });
        }
      },
    }),
    {
      name: "rag-agent-chat",
      storage: createJSONStorage(() => localStorage),
      // Serialization pour les dates
      partialize: (state) => ({
        sessions: state.sessions.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          messages: s.messages.map((m) => ({
            ...m,
            timestamp: m.timestamp instanceof Date 
              ? m.timestamp.toISOString() 
              : m.timestamp,
          })),
        })),
        activeSessionId: state.activeSessionId,
      }),
      // Migration pour reconvertir les strings en dates
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sessions = state.sessions.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messages: s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }));
          
          // Restaurer les messages de la session active
          const activeSession = state.sessions.find(
            (s: ChatSession) => s.id === state.activeSessionId
          );
          if (activeSession) {
            state.currentMessages = activeSession.messages;
          }
        }
      },
    }
  )
);

// ===== Selectors =====

export const useActiveSession = () =>
  useChatStore((state) => {
    if (!state.activeSessionId) return null;
    return state.sessions.find((s) => s.id === state.activeSessionId) ?? null;
  });

export const useChatSessions = () =>
  useChatStore((state) => state.sessions);

export const useChatMessages = () =>
  useChatStore((state) => state.currentMessages);

export const useChatIsLoading = () =>
  useChatStore((state) => state.isLoading);

export const useCreateSession = () =>
  useChatStore((state) => state.createSession);
