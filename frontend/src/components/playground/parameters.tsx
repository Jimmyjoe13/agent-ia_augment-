/**
 * Playground Parameters Panel
 * ===========================
 * 
 * Permet de configurer les paramètres de la requête LLM (Modèle, Température, etc.)
 */

"use client";

import { 
  Settings2, 
  Trash2, 
  HelpCircle,
  Cpu,
  Zap,
  Flame,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface PlaygroundParametersProps {
  parameters: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    systemPrompt: string;
  };
  setParameters: (params: any) => void;
  onReset: () => void;
}

export function PlaygroundParameters({
  parameters,
  setParameters,
  onReset,
}: PlaygroundParametersProps) {
  const updateParam = (key: string, value: any) => {
    setParameters({ ...parameters, [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border-r border-white/5 w-80 shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Settings2 className="h-4 w-4 text-indigo-400" />
          Settings
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-zinc-500 hover:text-red-400"
          onClick={onReset}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 space-y-8">
        {/* Model Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              Model
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-zinc-600" />
                </TooltipTrigger>
                <TooltipContent>Le modèle LLM à utiliser pour la génération</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select 
            value={parameters.model} 
            onValueChange={(v: string) => updateParam("model", v)}
          >
            <SelectTrigger className="bg-zinc-950 border-white/10 h-9 text-sm">
              <SelectValue placeholder="Sélecteur de modèle" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10">
              <SelectItem value="mistral-small">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  Mistral Small
                </div>
              </SelectItem>
              <SelectItem value="mistral-medium">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-orange-500" />
                  Mistral Medium
                </div>
              </SelectItem>
              <SelectItem value="mistral-large">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-red-500" />
                  Mistral Large
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-white/5" />

        {/* System Prompt */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            System Prompt
          </Label>
          <Textarea 
            placeholder="Comportez-vous comme un expert en..."
            className="min-h-[120px] bg-zinc-950 border-white/10 text-sm resize-none focus-visible:ring-indigo-500/50 placeholder:text-zinc-700"
            value={parameters.systemPrompt}
            onChange={(e) => updateParam("systemPrompt", e.target.value)}
          />
        </div>

        <Separator className="bg-white/5" />

        {/* Temperature */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-orange-400" />
              Temperature
            </Label>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-1.5 rounded border border-white/5">
              {parameters.temperature}
            </span>
          </div>
          <Slider 
            value={[parameters.temperature]} 
            min={0} 
            max={2} 
            step={0.1}
            onValueChange={([v]: number[]) => updateParam("temperature", v)}
            className="[&_[role=slider]]:bg-indigo-500"
          />
          <p className="text-[10px] text-zinc-500 leading-tight">
            Contrôle le caractère aléatoire. 0 est déterministe, 1.0+ est créatif.
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 className="h-3 w-3 text-blue-400" />
              Max Length
            </Label>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-1.5 rounded border border-white/5">
              {parameters.maxTokens}
            </span>
          </div>
          <Slider 
            value={[parameters.maxTokens]} 
            min={64} 
            max={4096} 
            step={64}
            onValueChange={([v]: number[]) => updateParam("maxTokens", v)}
            className="[&_[role=slider]]:bg-indigo-500"
          />
          <p className="text-[10px] text-zinc-500 leading-tight">
            Nombre maximum de tokens générés dans la réponse.
          </p>
        </div>

      </div>
    </div>
  );
}
