/**
 * Hooks personnalisés pour l'ingestion de documents
 * Utilise React Query mutations avec gestion d'erreurs améliorée
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { IngestResponse } from "@/types/api";
import { AxiosError } from "axios";

// ===== Types =====

interface TextIngestionData {
  content: string;
  title?: string;
}

interface GithubIngestionData {
  repository: string;
  branch?: string;
}

interface ApiErrorDetail {
  error?: string;
  message?: string;
  required_scope?: string;
  your_scopes?: string[];
}

// ===== Error Handling Helper =====

function getErrorMessage(error: unknown): { title: string; description: string } {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail as ApiErrorDetail | string;
    
    if (status === 401) {
      const msg = typeof detail === "object" ? detail?.message : detail;
      return {
        title: "Non autorisé",
        description: msg || "Clé API invalide ou manquante. Configurez votre clé dans Paramètres.",
      };
    }
    
    if (status === 403) {
      if (typeof detail === "object" && detail?.error === "insufficient_scope") {
        return {
          title: "Permissions insuffisantes",
          description: `Votre clé n'a pas le scope "${detail.required_scope}". Scopes actuels: ${detail.your_scopes?.join(", ") || "aucun"}.`,
        };
      }
      return {
        title: "Accès refusé",
        description: typeof detail === "string" ? detail : "Permissions insuffisantes pour cette action.",
      };
    }
    
    if (status === 429) {
      return {
        title: "Trop de requêtes",
        description: "Limite de requêtes atteinte. Veuillez patienter.",
      };
    }
    
    // Autres erreurs
    return {
      title: "Erreur serveur",
      description: typeof detail === "string" ? detail : (detail?.message || `Erreur ${status}`),
    };
  }
  
  if (error instanceof Error) {
    return {
      title: "Erreur",
      description: error.message,
    };
  }
  
  return {
    title: "Erreur",
    description: "Une erreur inattendue s'est produite.",
  };
}

// ===== Text Ingestion =====

export function useTextIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TextIngestionData): Promise<IngestResponse> => {
      return api.ingestText({
        content: data.content,
        source_id: `manual:${Date.now()}`,
        title: data.title,
      });
    },
    onMutate: () => {
      return {
        toastId: toast.loading("Ingestion en cours...", {
          description: "Traitement de votre texte",
        }),
      };
    },
    onSuccess: (data, variables, context) => {
      toast.success("Texte ingéré avec succès", {
        id: context?.toastId,
        description: data.message || `${variables.title || "Document"} ajouté à la base de connaissances`,
      });

      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error, _variables, context) => {
      const { title, description } = getErrorMessage(error);
      toast.error(title, {
        id: context?.toastId,
        description,
      });
    },
  });
}

// ===== PDF Ingestion =====

export function usePdfIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<IngestResponse> => {
      return api.ingestPdf(file);
    },
    onMutate: (file) => {
      return {
        toastId: toast.loading("Upload en cours...", {
          description: `Traitement de ${file.name}`,
        }),
        fileName: file.name,
      };
    },
    onSuccess: (data, _file, context) => {
      toast.success("PDF importé avec succès", {
        id: context?.toastId,
        description: data.message || `${context?.fileName} ajouté à la base de connaissances`,
      });

      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error, _file, context) => {
      const { title, description } = getErrorMessage(error);
      toast.error(title, {
        id: context?.toastId,
        description,
      });
    },
  });
}

// ===== GitHub Ingestion =====

export function useGithubIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GithubIngestionData): Promise<IngestResponse> => {
      return api.ingestGithub({
        repositories: [data.repository],
      });
    },
    onMutate: (data) => {
      return {
        toastId: toast.loading("Import GitHub en cours...", {
          description: `Indexation de ${data.repository}`,
        }),
        repository: data.repository,
      };
    },
    onSuccess: (data, _variables, context) => {
      toast.success("Repository importé", {
        id: context?.toastId,
        description: data.message || `${context?.repository} ajouté à la base de connaissances`,
      });

      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error, _variables, context) => {
      const { title, description } = getErrorMessage(error);
      toast.error(title, {
        id: context?.toastId,
        description,
      });
    },
  });
}

// ===== Combined Hook =====

/**
 * Hook combiné pour toutes les opérations d'ingestion
 */
export function useIngestion() {
  const textMutation = useTextIngestion();
  const pdfMutation = usePdfIngestion();
  const githubMutation = useGithubIngestion();

  return {
    ingestText: textMutation.mutateAsync,
    ingestPdf: pdfMutation.mutateAsync,
    ingestGithub: githubMutation.mutateAsync,
    isLoading: textMutation.isPending || pdfMutation.isPending || githubMutation.isPending,
    textStatus: textMutation,
    pdfStatus: pdfMutation,
    githubStatus: githubMutation,
  };
}
