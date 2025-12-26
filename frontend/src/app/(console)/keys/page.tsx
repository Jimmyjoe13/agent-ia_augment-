/**
 * Page de gestion des clés API (Admin)
 */

"use client";

import { useState } from "react";
import { Key, Plus, Trash2, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function KeysPage() {
  const [masterKey, setMasterKey] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Gestion des Clés API</h1>
          <p className="text-zinc-400">
            Créez et gérez les clés d&apos;accès à l&apos;API (nécessite la Master Key)
          </p>
        </div>

        {/* Master Key Input */}
        <Card className="mb-8 border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              Master Key
            </CardTitle>
            <CardDescription>
              Entrez votre Master Key pour accéder à la gestion des clés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="master_xxxxxxxxxxxxxxxx"
                className="flex-1 bg-zinc-800"
              />
              <Button
                disabled={!masterKey.trim()}
                className="bg-amber-600 hover:bg-amber-500"
              >
                Connecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <p className="mb-2 font-medium text-amber-300">
                Fonctionnalité Admin
              </p>
              <p className="text-amber-400/80">
                Cette page permet aux administrateurs de créer et gérer les clés API.
                Vous devez avoir la Master Key pour accéder à ces fonctionnalités.
                Contactez l&apos;administrateur système si vous n&apos;avez pas la Master Key.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for keys list when authenticated */}
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 p-12 text-center">
          <Key className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-zinc-400">
            Authentification requise
          </h3>
          <p className="text-sm text-zinc-500">
            Entrez votre Master Key ci-dessus pour voir et gérer les clés API
          </p>
        </div>
      </div>
    </div>
  );
}
