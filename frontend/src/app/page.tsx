import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      {/* Hero Section */}
      <div className="max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
          <Zap className="h-4 w-4" />
          Propulsé par Mistral AI
        </div>
        
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            RAG Agent IA
          </span>
        </h1>
        
        <p className="mb-8 text-xl text-zinc-400">
          Votre copilote intelligent. Posez vos questions, obtenez des réponses
          personnalisées basées sur vos documents et le web.
        </p>
        
        <div className="flex justify-center gap-4">
          <Link href="/chat">
            <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-500">
              <MessageSquare className="h-5 w-5" />
              Commencer à discuter
            </Button>
          </Link>
          <Link href="/settings">
            <Button size="lg" variant="outline" className="gap-2 border-zinc-700 hover:bg-zinc-800">
              Configurer
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="mb-2 font-semibold text-zinc-100">RAG Intelligent</h3>
            <p className="text-sm text-zinc-400">
              Combine vos documents personnels avec des recherches web en temps réel.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Zap className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="mb-2 font-semibold text-zinc-100">Réponses Rapides</h3>
            <p className="text-sm text-zinc-400">
              Génération ultra-rapide avec Mistral Large pour des réponses précises.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-2 font-semibold text-zinc-100">Sécurisé</h3>
            <p className="text-sm text-zinc-400">
              Authentification par clé API et données privées protégées.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
