/**
 * Hook pour gérer les conversations avec le RAG
 */

"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Message, QueryResponse, Source } from "@/types/api";

// Génère un ID unique
const generateId = () => Math.random().toString(36).substring(2, 15);

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mutation pour envoyer un message
  const sendMutation = useMutation({
    mutationFn: async ({ question, useWeb }: { question: string; useWeb: boolean }) => {
      return api.query({
        question,
        session_id: sessionId || undefined,
        use_web_search: useWeb,
      });
    },
    onSuccess: (data: QueryResponse) => {
      // Mettre à jour le session ID
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
        conversationId: data.conversation_id,
      };

      setMessages((prev) => {
        // Remplacer le message "loading" par la vraie réponse
        const filtered = prev.filter((m) => !m.isLoading);
        return [...filtered, assistantMessage];
      });
    },
    onError: (error: Error) => {
      // Supprimer le message "loading" et ajouter un message d'erreur
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [
          ...filtered,
          {
            id: generateId(),
            role: "assistant",
            content: `Erreur: ${error.message}. Vérifiez votre clé API.`,
            timestamp: new Date(),
          },
        ];
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Envoyer un message
  const sendMessage = useCallback(
    async (content: string, useWeb = false) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);

      // Ajouter le message utilisateur
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Ajouter un message "loading" pour l'assistant
      const loadingMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);

      // Envoyer la requête
      sendMutation.mutate({ question: content.trim(), useWeb });
    },
    [isLoading, sendMutation]
  );

  // Nouvelle conversation
  const newConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  // Soumettre un feedback
  const submitFeedback = useCallback(
    async (conversationId: string, score: number, comment?: string) => {
      try {
        await api.submitFeedback({
          conversation_id: conversationId,
          score,
          comment,
          flag_for_training: score >= 4,
        });
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    newConversation,
    submitFeedback,
    hasApiKey: api.hasApiKey(),
  };
}

export default useChat;
