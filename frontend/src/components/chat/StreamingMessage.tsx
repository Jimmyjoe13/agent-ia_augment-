/**
 * Composant de message avec support streaming
 * Affiche les étapes de progression et le contenu en temps réel
 */

"use client";

import { useState } from "react";
import { Bot, User, ThumbsUp, ThumbsDown, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProcessingSteps, ThoughtProcess, RoutingBadge } from "./ProcessingSteps";
import type { Message, Source, StreamingStep, RoutingInfo } from "@/types/api";

// ===== Types =====

interface StreamingMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingSteps?: StreamingStep[];
  streamingThought?: string;
  onFeedback?: (score: number) => void;
  showRoutingInfo?: boolean;
}

// ===== Sub-components =====

function SourceBadges({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources.map((source, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className={cn(
            "text-xs",
            source.source_type === "perplexity"
              ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
              : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
          )}
        >
          {source.source_type === "perplexity" ? "🌐 Web" : "📄 Document"}
          {source.similarity_score && ` (${(source.similarity_score * 100).toFixed(0)}%)`}
        </Badge>
      ))}
    </div>
  );
}

function MessageAvatar({ isUser }: { isUser: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        isUser
          ? "bg-indigo-600"
          : "bg-gradient-to-br from-violet-600 to-indigo-600"
      )}
    >
      {isUser ? (
        <User className="h-4 w-4 text-white" />
      ) : (
        <Bot className="h-4 w-4 text-white" />
      )}
    </div>
  );
}

function FeedbackButtons({ onFeedback }: { onFeedback: (score: number) => void }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onFeedback(5)}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-green-400 transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Bonne réponse</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onFeedback(1)}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Mauvaise réponse</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ===== Main Component =====

export function StreamingMessage({
  message,
  isStreaming = false,
  streamingContent,
  streamingSteps,
  streamingThought,
  onFeedback,
  showRoutingInfo = false,
}: StreamingMessageProps) {
  const isUser = message.role === "user";
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);

  // Contenu à afficher (streaming ou final)
  const displayContent = isStreaming ? streamingContent : message.content;
  const displayThought = isStreaming ? streamingThought : message.thoughtProcess;
  const displaySteps = isStreaming ? streamingSteps : message.streamingSteps;

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 sm:px-6",
        isUser ? "bg-transparent" : "bg-zinc-900/30"
      )}
    >
      {/* Avatar */}
      <MessageAvatar isUser={isUser} />

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {isUser ? "Vous" : "Assistant"}
          </span>
          <span className="text-xs text-zinc-500">
            {message.timestamp.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          
          {/* Routing badge */}
          {showRoutingInfo && message.routingInfo && (
            <RoutingBadge routing={message.routingInfo} />
          )}
        </div>

        {/* Étapes de progression (pendant le streaming) */}
        {isStreaming && displaySteps && displaySteps.length > 0 && (
          <ProcessingSteps 
            steps={displaySteps} 
            className="mb-4" 
          />
        )}

        {/* Contenu du message */}
        {message.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
            <Skeleton className="h-4 w-1/2 bg-zinc-800" />
          </div>
        ) : displayContent ? (
          <div className="prose prose-invert prose-sm max-w-none break-words">
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-200">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse rounded-sm" />
              )}
            </p>
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm">En cours de traitement...</span>
          </div>
        ) : null}

        {/* Processus de réflexion */}
        {displayThought && (
          <ThoughtProcess
            thought={displayThought}
            isExpanded={isThoughtExpanded}
            onToggle={() => setIsThoughtExpanded(!isThoughtExpanded)}
          />
        )}

        {/* Sources */}
        <SourceBadges sources={message.sources} />

        {/* Feedback buttons - only for completed assistant messages */}
        {!isUser && !message.isLoading && !isStreaming && onFeedback && (
          <FeedbackButtons onFeedback={onFeedback} />
        )}
      </div>
    </div>
  );
}

// ===== Streaming Indicator =====

interface StreamingIndicatorProps {
  steps: StreamingStep[];
  routingInfo?: RoutingInfo | null;
}

export function StreamingIndicator({ steps, routingInfo }: StreamingIndicatorProps) {
  const activeStep = steps.find(s => s.status === "in_progress");
  const completedCount = steps.filter(s => s.status === "completed").length;
  const totalSteps = steps.length;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 rounded-full bg-zinc-900/95 border border-zinc-700 px-4 py-2 shadow-xl backdrop-blur-sm">
        {/* Progress dots */}
        <div className="flex gap-1">
          {steps.map((step, idx) => (
            <div
              key={step.type}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                step.status === "completed" && "bg-green-500",
                step.status === "in_progress" && "bg-indigo-500 animate-pulse",
                step.status === "pending" && "bg-zinc-600"
              )}
            />
          ))}
        </div>

        {/* Active step label */}
        {activeStep && (
          <span className="text-sm text-zinc-300">
            {activeStep.label}
            {activeStep.details && (
              <span className="text-zinc-500 ml-1">({activeStep.details})</span>
            )}
          </span>
        )}

        {/* Routing info badge */}
        {routingInfo && (
          <Badge 
            variant="outline" 
            className="text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
          >
            {routingInfo.intent}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default StreamingMessage;
