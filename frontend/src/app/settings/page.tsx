/**
 * Page des paramètres - Configuration de la clé API
 */

"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = api.getStoredApiKey();
    if (stored) {
      setSavedKey(stored);
      setApiKey(stored);
    }
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setStatus("loading");
    
    // Test the API key by making a request
    try {
      api.setApiKey(apiKey.trim());
      const health = await api.healthCheck();
      if (health.status === "healthy") {
        setStatus("success");
        setSavedKey(apiKey.trim());
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      api.clearApiKey();
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleClear = () => {
    api.clearApiKey();
    setApiKey("");
    setSavedKey(null);
    setStatus("idle");
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-zinc-400">Configurez votre accès à l&apos;API RAG Agent</p>
        </div>

        {/* API Key Card */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Clé API
              {savedKey && (
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  Configurée
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Entrez votre clé API pour accéder aux fonctionnalités de l&apos;agent.
              Vous pouvez obtenir une clé auprès de l&apos;administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="rag_xxxxxxxxxxxxxxxx"
                className="bg-zinc-800 pr-10"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-zinc-100"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || status === "loading"}
                className="gap-2 bg-indigo-600 hover:bg-indigo-500"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : status === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {status === "success"
                  ? "Sauvegardé !"
                  : status === "error"
                  ? "Clé invalide"
                  : "Sauvegarder"}
              </Button>

              {savedKey && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  Supprimer
                </Button>
              )}
            </div>

            {/* Help text */}
            <div className="rounded-lg bg-zinc-800/50 p-4 text-sm text-zinc-400">
              <p className="mb-2 font-medium text-zinc-300">Comment obtenir une clé API ?</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Contactez l&apos;administrateur du système</li>
                <li>Demandez une clé avec les scopes nécessaires (query, feedback)</li>
                <li>Collez la clé ci-dessus et cliquez sur Sauvegarder</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* API Status Card */}
        <Card className="mt-6 border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>État de l&apos;API</CardTitle>
            <CardDescription>
              Vérifiez la connexion avec le backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiStatus />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Composant pour l'état de l'API
function ApiStatus() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await api.healthCheck();
        setStatus(health.status === "healthy" ? "online" : "offline");
        setVersion(health.version);
      } catch {
        setStatus("offline");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            status === "loading"
              ? "animate-pulse bg-zinc-500"
              : status === "online"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          {status === "loading"
            ? "Vérification..."
            : status === "online"
            ? "En ligne"
            : "Hors ligne"}
        </span>
      </div>
      {version && (
        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
          v{version}
        </Badge>
      )}
    </div>
  );
}
