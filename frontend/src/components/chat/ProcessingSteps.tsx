/**
 * Composant d'indicateurs de progression pour le chat
 * Affiche les étapes de traitement en temps réel
 */

"use client";

import { cn } from "@/lib/utils";
import { Search, Globe, Cpu, Check, Loader2, Brain, Sparkles } from "lucide-react";
import type { StreamingStep, RoutingInfo } from "@/types/api";

interface ProcessingStepsProps {
  steps: StreamingStep[];
  routingInfo?: RoutingInfo;
  className?: string;
}

const stepIcons: Record<StreamingStep["type"], React.ReactNode> = {
  routing: <Cpu className="h-4 w-4" />,
  search_rag: <Search className="h-4 w-4" />,
  search_web: <Globe className="h-4 w-4" />,
  generating: <Sparkles className="h-4 w-4" />,
};

const stepLabels: Record<StreamingStep["type"], string> = {
  routing: "Analyse de la requête",
  search_rag: "Recherche dans vos documents",
  search_web: "Consultation du web",
  generating: "Génération de la réponse",
};

function StepIndicator({ step }: { step: StreamingStep }) {
  const icon = stepIcons[step.type];
  const label = step.label || stepLabels[step.type];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-300",
        step.status === "pending" && "text-zinc-500",
        step.status === "in_progress" && "bg-indigo-500/10 text-indigo-400",
        step.status === "completed" && "text-green-400"
      )}
    >
      {step.status === "in_progress" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : step.status === "completed" ? (
        <Check className="h-4 w-4" />
      ) : (
        icon
      )}
      <span>{label}</span>
      {step.details && (
        <span className="text-xs text-zinc-500">({step.details})</span>
      )}
    </div>
  );
}

export function ProcessingSteps({ steps, routingInfo, className }: ProcessingStepsProps) {
  if (steps.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {steps.map((step, index) => (
        <StepIndicator key={`${step.type}-${index}`} step={step} />
      ))}
      
      {/* Afficher les infos de routage si disponibles */}
      {routingInfo && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
          <span className="rounded bg-zinc-800 px-2 py-1">
            Intent: {routingInfo.intent}
          </span>
          <span className="rounded bg-zinc-800 px-2 py-1">
            Confiance: {(routingInfo.confidence * 100).toFixed(0)}%
          </span>
          <span className="rounded bg-zinc-800 px-2 py-1">
            Latence: {routingInfo.latency_ms}ms
          </span>
        </div>
      )}
    </div>
  );
}

interface ThoughtProcessProps {
  thought: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function ThoughtProcess({ thought, isExpanded = false, onToggle }: ThoughtProcessProps) {
  if (!thought) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-violet-500/20 bg-violet-500/5">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-violet-400 hover:bg-violet-500/10"
      >
        <Brain className="h-4 w-4" />
        <span className="font-medium">Processus de réflexion</span>
        <span className="ml-auto text-xs text-violet-500">
          {isExpanded ? "Masquer" : "Afficher"}
        </span>
      </button>
      
      {isExpanded && (
        <div className="border-t border-violet-500/20 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-violet-300/80">
            {thought}
          </p>
        </div>
      )}
    </div>
  );
}

interface RoutingBadgeProps {
  routing: RoutingInfo;
}

export function RoutingBadge({ routing }: RoutingBadgeProps) {
  const intentLabels: Record<string, string> = {
    general: "💬 Général",
    documents: "📄 Documents",
    web_search: "🌐 Web",
    hybrid: "🔀 Hybride",
    greeting: "👋 Salutation",
  };

  const intentColors: Record<string, string> = {
    general: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    documents: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    web_search: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    hybrid: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    greeting: "border-green-500/30 bg-green-500/10 text-green-400",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          intentColors[routing.intent] || intentColors.general
        )}
      >
        {intentLabels[routing.intent] || routing.intent}
      </span>
      {routing.confidence >= 0.8 && (
        <span className="text-xs text-green-500">
          ✓ Haute confiance
        </span>
      )}
    </div>
  );
}
