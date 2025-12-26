/**
 * Hook unifié pour le chat avec support du mode standard et streaming
 * Combine useChat et useStreamingChat selon les préférences utilisateur
 */

"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useChat } from "./useChat";
import { useStreamingChat } from "./useStreamingChat";
import { usePreferencesStore } from "@/stores";
import type { Message, StreamingStep, RoutingInfo } from "@/types/api";

// ===== Types =====

interface UnifiedChatState {
  messages: Message[];
  sessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  streamingThought: string;
  streamingSteps: StreamingStep[];
  routingInfo: RoutingInfo | null;
}

interface SendOptions {
  useWebSearch?: boolean;
  forceRag?: boolean;
  enableReflection?: boolean;
}

interface UseUnifiedChatOptions {
  onError?: (error: Error) => void;
  onComplete?: (message: Message) => void;
}

// ===== Helper =====

const generateId = () => Math.random().toString(36).substring(2, 15);

// ===== Hook =====

export function useUnifiedChat(options?: UseUnifiedChatOptions) {
  // Préférence de streaming depuis le store
  const useStreaming = usePreferencesStore((state) => state.useStreaming);
  
  // State pour les messages en mode streaming
  const [streamingMessages, setStreamingMessages] = useState<Message[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  // Hook standard (non-streaming)
  const standardChat = useChat({
    onError: options?.onError,
    onSuccess: (response) => {
      // Convertir la réponse en message si nécessaire
    },
  });

  // Hook streaming
  const streamingChat = useStreamingChat({
    onComplete: (message) => {
      // Ajouter le message complété à la liste
      setStreamingMessages(prev => {
        // Remplacer le dernier message "en cours" par le message complété
        const withoutLoading = prev.filter(m => !m.isLoading);
        return [...withoutLoading, message];
      });
      options?.onComplete?.(message);
    },
    onError: options?.onError,
  });

  /**
   * Envoie un message (via API standard ou streaming selon la config)
   */
  const sendMessage = useCallback(async (
    content: string,
    sendOptions?: SendOptions
  ) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Créer le message utilisateur
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmedContent,
      timestamp: new Date(),
    };

    if (useStreaming) {
      // Mode streaming
      setStreamingMessages(prev => [...prev, userMessage]);
      
      // Créer un message "loading" temporaire
      const loadingMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };
      setStreamingMessages(prev => [...prev, loadingMessage]);

      // Envoyer en streaming
      await streamingChat.sendStream(trimmedContent, {
        useWebSearch: sendOptions?.useWebSearch,
        forceRag: sendOptions?.forceRag,
        enableReflection: sendOptions?.enableReflection,
        sessionId: sessionIdRef.current || undefined,
      });
    } else {
      // Mode standard (non-streaming)
      await standardChat.sendMessage(trimmedContent, sendOptions);
    }
  }, [useStreaming, streamingChat, standardChat]);

  /**
   * Annule la requête en cours
   */
  const cancelRequest = useCallback(() => {
    if (useStreaming) {
      streamingChat.cancelStream();
      // Supprimer le message "loading"
      setStreamingMessages(prev => prev.filter(m => !m.isLoading));
    } else {
      standardChat.cancelRequest();
    }
  }, [useStreaming, streamingChat, standardChat]);

  /**
   * Nouvelle conversation
   */
  const newConversation = useCallback(() => {
    if (useStreaming) {
      setStreamingMessages([]);
      streamingChat.reset();
      sessionIdRef.current = null;
    } else {
      standardChat.newConversation();
    }
  }, [useStreaming, streamingChat, standardChat]);

  /**
   * Soumettre un feedback
   */
  const submitFeedback = useCallback(async (
    conversationId: string,
    score: number,
    comment?: string
  ) => {
    return standardChat.submitFeedback(conversationId, score, comment);
  }, [standardChat]);

  /**
   * Régénérer la dernière réponse
   */
  const regenerateLastResponse = useCallback(() => {
    if (useStreaming) {
      // Trouver le dernier message utilisateur
      const messages = streamingMessages;
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      
      if (lastUserMessage) {
        // Supprimer la dernière réponse
        setStreamingMessages(prev => prev.slice(0, -1));
        
        // Renvoyer le message
        sendMessage(lastUserMessage.content, {
          useWebSearch: true, // TODO: récupérer les options originales
        });
      }
    } else {
      standardChat.regenerateLastResponse();
    }
  }, [useStreaming, streamingMessages, sendMessage, standardChat]);

  // Computed state
  const state = useMemo<UnifiedChatState>(() => {
    if (useStreaming) {
      return {
        messages: streamingMessages,
        sessionId: sessionIdRef.current,
        isLoading: streamingChat.isStreaming,
        isStreaming: streamingChat.isStreaming,
        streamingContent: streamingChat.currentContent,
        streamingThought: streamingChat.currentThought,
        streamingSteps: streamingChat.steps,
        routingInfo: streamingChat.routingInfo,
      };
    } else {
      return {
        messages: standardChat.messages,
        sessionId: standardChat.sessionId,
        isLoading: standardChat.isLoading,
        isStreaming: false,
        streamingContent: "",
        streamingThought: "",
        streamingSteps: [],
        routingInfo: null,
      };
    }
  }, [
    useStreaming,
    streamingMessages,
    streamingChat.isStreaming,
    streamingChat.currentContent,
    streamingChat.currentThought,
    streamingChat.steps,
    streamingChat.routingInfo,
    standardChat.messages,
    standardChat.sessionId,
    standardChat.isLoading,
  ]);

  return {
    // State
    ...state,
    
    // Mode
    isStreamingMode: useStreaming,

    // Actions
    sendMessage,
    cancelRequest,
    newConversation,
    submitFeedback,
    regenerateLastResponse,

    // Helpers
    hasApiKey: standardChat.hasApiKey,
    canSend: !state.isLoading && standardChat.hasApiKey,
    messageCount: state.messages.length,
  };
}

export default useUnifiedChat;
