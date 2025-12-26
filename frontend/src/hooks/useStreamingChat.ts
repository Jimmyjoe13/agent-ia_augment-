/**
 * Hook pour la gestion du streaming SSE (Server-Sent Events)
 * Permet de recevoir les réponses en temps réel avec indicateurs de progression
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { 
  Message, 
  Source, 
  StreamEventType, 
  StreamingStep, 
  RoutingInfo 
} from "@/types/api";

// ===== Types =====

interface StreamState {
  isStreaming: boolean;
  currentContent: string;
  currentThought: string;
  steps: StreamingStep[];
  routingInfo: RoutingInfo | null;
  error: string | null;
}

interface UseStreamingChatOptions {
  apiUrl?: string;
  onComplete?: (message: Message) => void;
  onError?: (error: Error) => void;
}

interface SendStreamOptions {
  useWebSearch?: boolean;
  forceRag?: boolean;
  enableReflection?: boolean;
  sessionId?: string;
}

// ===== Helpers =====

const generateId = () => Math.random().toString(36).substring(2, 15);

const getApiKey = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rag_api_key");
};

// ===== Hook =====

export function useStreamingChat(options?: UseStreamingChatOptions) {
  const apiUrl = options?.apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    currentContent: "",
    currentThought: "",
    steps: [],
    routingInfo: null,
    error: null,
  });

  // AbortController pour annuler le stream
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  /**
   * Initialise les étapes de progression
   */
  const initializeSteps = useCallback((enableReflection: boolean) => {
    const steps: StreamingStep[] = [
      { type: "routing", status: "pending", label: "Analyse de la requête" },
      { type: "search_rag", status: "pending", label: "Recherche dans vos documents" },
      { type: "search_web", status: "pending", label: "Consultation du web" },
      { type: "generating", status: "pending", label: enableReflection ? "Réflexion approfondie" : "Génération de la réponse" },
    ];
    return steps;
  }, []);

  /**
   * Met à jour une étape spécifique
   */
  const updateStep = useCallback((
    type: StreamingStep["type"],
    status: StreamingStep["status"],
    details?: string
  ) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.type === type ? { ...step, status, details } : step
      ),
    }));
  }, []);

  /**
   * Envoie une requête en streaming
   */
  const sendStream = useCallback(async (
    question: string,
    sendOptions?: SendStreamOptions
  ): Promise<Message | null> => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return null;

    // Vérifier la clé API
    const apiKey = getApiKey();
    if (!apiKey) {
      toast.error("Clé API manquante", {
        description: "Configurez votre clé API dans les paramètres",
      });
      return null;
    }

    // Reset state
    setState({
      isStreaming: true,
      currentContent: "",
      currentThought: "",
      steps: initializeSteps(sendOptions?.enableReflection || false),
      routingInfo: null,
      error: null,
    });

    // Créer AbortController
    abortControllerRef.current = new AbortController();

    try {
      // POST request avec fetch pour le streaming
      const response = await fetch(`${apiUrl}/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          session_id: sendOptions?.sessionId,
          use_web_search: sendOptions?.useWebSearch,
          use_rag: sendOptions?.forceRag,
          enable_reflection: sendOptions?.enableReflection,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Lire le stream SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullContent = "";
      let fullThought = "";
      let sources: Source[] = [];
      let conversationId: string | null = null;
      let routingInfo: RoutingInfo | null = null;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parser les événements SSE
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Garder la dernière ligne incomplète

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.substring(7).trim() as StreamEventType;
            continue;
          }
          
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              
              // Déterminer le type d'événement basé sur les données
              if (data.status === "started" && !data.intent) {
                // Routing started
                updateStep("routing", "in_progress");
              } 
              else if (data.intent) {
                // Routing completed
                updateStep("routing", "completed");
                routingInfo = {
                  intent: data.intent,
                  use_rag: data.use_rag,
                  use_web: data.use_web,
                  confidence: data.confidence || 0.8,
                  reasoning: data.reasoning || "",
                  latency_ms: data.latency_ms || 0,
                };
                setState(prev => ({ ...prev, routingInfo }));
                
                // Mettre à jour les étapes selon le routage
                if (!data.use_rag) {
                  updateStep("search_rag", "completed", "Non requis");
                }
                if (!data.use_web) {
                  updateStep("search_web", "completed", "Non requis");
                }
              }
              else if (data.type === "rag") {
                // Search RAG
                if (data.results !== undefined) {
                  updateStep("search_rag", "completed", `${data.results} documents`);
                } else {
                  updateStep("search_rag", "in_progress");
                }
              }
              else if (data.type === "web") {
                // Search Web
                if (data.found !== undefined) {
                  updateStep("search_web", "completed", data.found ? "Résultats trouvés" : "Aucun résultat");
                } else {
                  updateStep("search_web", "in_progress");
                }
              }
              else if (data.content !== undefined && !data.is_thought) {
                // Content chunk
                updateStep("generating", "in_progress");
                fullContent += data.content;
                setState(prev => ({ ...prev, currentContent: fullContent }));
              }
              else if (data.content !== undefined && data.is_thought) {
                // Thought chunk
                fullThought += data.content;
                setState(prev => ({ ...prev, currentThought: fullThought }));
              }
              else if (data.conversation_id !== undefined) {
                // Complete event
                updateStep("generating", "completed");
                conversationId = data.conversation_id;
                if (data.sources) {
                  sources = data.sources;
                }
              }
              else if (data.error) {
                // Error event
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignorer les erreurs de parsing pour les lignes incomplètes
              console.debug("SSE parse error:", parseError);
            }
          }
        }
      }

      // Créer le message final
      const message: Message = {
        id: generateId(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
        sources,
        conversationId: conversationId || undefined,
        thoughtProcess: fullThought || undefined,
        routingInfo: routingInfo || undefined,
      };

      setState(prev => ({
        ...prev,
        isStreaming: false,
      }));

      options?.onComplete?.(message);
      return message;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Gérer l'annulation
      if (err.name === "AbortError") {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: null,
        }));
        return null;
      }

      // Déterminer le message d'erreur
      let errorMessage = err.message;
      if (err.message.includes("401")) {
        errorMessage = "Clé API invalide ou expirée";
      } else if (err.message.includes("429")) {
        errorMessage = "Trop de requêtes. Réessayez dans quelques instants.";
      } else if (err.message.includes("Network") || err.message.includes("fetch")) {
        errorMessage = "Impossible de contacter le serveur";
      }

      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
      }));

      toast.error("Erreur de streaming", { description: errorMessage });
      options?.onError?.(err);
      return null;
    }
  }, [apiUrl, initializeSteps, updateStep, options]);

  /**
   * Annule le streaming en cours
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
    }));
    toast.info("Streaming annulé");
  }, []);

  /**
   * Reset l'état
   */
  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      currentContent: "",
      currentThought: "",
      steps: [],
      routingInfo: null,
      error: null,
    });
  }, []);

  return {
    // State
    isStreaming: state.isStreaming,
    currentContent: state.currentContent,
    currentThought: state.currentThought,
    steps: state.steps,
    routingInfo: state.routingInfo,
    error: state.error,

    // Actions
    sendStream,
    cancelStream,
    reset,
  };
}

export default useStreamingChat;
