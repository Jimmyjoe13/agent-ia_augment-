/**
 * API Documentation Page
 * =======================
 * 
 * Guide interactif pour les développeurs utilisant la plateforme RAG.
 */

"use client";

import { 
  BookOpen, 
  Terminal, 
  Globe, 
  Key, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  ClipboardCheck,
  Code
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function DocsPage() {
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden">
      {/* Docs Sidebar */}
      <div className="w-64 border-r border-white/5 bg-zinc-900/30 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Introduction</h3>
          <nav className="flex flex-col gap-1">
            <DocsNavItem icon={BookOpen} label="Bienvenue" active />
            <DocsNavItem icon={ShieldCheck} label="Authentification" />
            <DocsNavItem icon={Zap} label="Limites et Quotas" />
          </nav>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Endpoints</h3>
          <nav className="flex flex-col gap-1">
            <DocsNavItem icon={Terminal} label="POST /query" />
            <DocsNavItem icon={Globe} label="POST /ingest" />
            <DocsNavItem icon={Key} label="GET /analytics" />
          </nav>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">SDKs (Bientôt)</h3>
          <nav className="flex flex-col gap-1 opacity-50 grayscale">
            <DocsNavItem icon={Code} label="Python SDK" />
            <DocsNavItem icon={Code} label="Node.js SDK" />
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <header className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-bold tracking-widest uppercase">Documentation Officielle</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Bienvenue sur l'API RAG Agentia</h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Intégrez la puissance de l'IA générative augmentée par vos propres données dans vos applications en quelques minutes.
            </p>
          </header>

          <Separator className="bg-white/5" />

          {/* Section: Authentification */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                Authentification
              </h2>
              <p className="text-zinc-400">
                Toutes les requêtes à l'API doivent inclure votre clé API dans le header <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">X-API-Key</code>.
              </p>
            </div>
            
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500">Exemple de header</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-500 border-emerald-500/20">Sécurisé</Badge>
                </div>
                <pre className="text-sm font-mono text-zinc-300 bg-black/50 p-4 rounded-lg overflow-x-auto">
                    X-API-Key: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
                </pre>
            </div>
          </section>

          {/* Section: POST /query */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Terminal className="h-6 w-6 text-indigo-400" />
                    Requête de Chat (Query)
                </h2>
                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20 uppercase font-mono text-[10px]">POST /v1/query</Badge>
              </div>
              <p className="text-zinc-400">
                L'endpoint principal pour interagir avec l'agent. Il combine recherche vectorielle et web search.
              </p>
            </div>

            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="bg-zinc-900 border-white/5 grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="js">JS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curl" className="mt-4">
                <CodeBlock 
                  code={`curl -X POST https://agent-ia-augment.onrender.com/api/v1/query \\
  -H "X-API-Key: votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "Quelles sont les compétences SQL de l'utilisateur ?",
    "use_web_search": true,
    "system_prompt": "Réponds en tant qu'expert RH."
  }'`} 
                />
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <CodeBlock 
                  language="python"
                  code={`import requests

url = "https://agent-ia-augment.onrender.com/api/v1/query"
headers = {"X-API-Key": "votre_cle_api"}
payload = {
    "question": "Quelles sont les compétences SQL ?",
    "use_web_search": True
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`} 
                />
              </TabsContent>

              <TabsContent value="js" className="mt-4">
                <CodeBlock 
                  language="javascript"
                  code={`const response = await fetch("https://agent-ia-augment.onrender.com/api/v1/query", {
  method: "POST",
  headers: {
    "X-API-Key": "votre_cle_api",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    question: "Quelles sont les compétences SQL ?",
    use_web_search: true
  })
});

const data = await response.json();`} 
                />
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Paramètres du Body</h4>
                <div className="space-y-4 border-l-2 border-white/5 pl-4">
                    <ParamInfo 
                        name="question" 
                        type="string" 
                        required 
                        desc="Le texte de la question posée à l'agent."
                    />
                    <ParamInfo 
                        name="session_id" 
                        type="uuid" 
                        desc="Pour maintenir l'historique de la conversation."
                    />
                    <ParamInfo 
                        name="use_web_search" 
                        type="boolean" 
                        desc="Active la recherche web via Perplexity pour les données récentes."
                    />
                    <ParamInfo 
                        name="system_prompt" 
                        type="string" 
                        desc="Personnalise le comportement de l'assistant pour cette requête."
                    />
                </div>
            </div>
          </section>

          {/* Section: Ingestion */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Globe className="h-6 w-6 text-orange-400" />
                    Ingestion de données
                </h2>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20 uppercase font-mono text-[10px]">POST /v1/ingest/text</Badge>
              </div>
              <p className="text-zinc-400">
                L'API permet d'ingérer du texte brut, des fichiers PDF ou des dépôts GitHub.
              </p>
            </div>
            
            <CodeBlock 
              code={`curl -X POST https://agent-ia-augment.onrender.com/api/v1/ingest/text \\
  -H "X-API-Key: votre_cle_api" \\
  -d '{
    "content": "Contenu important à mémoriser...",
    "source_id": "doc-001",
    "title": "Documentation interne"
  }'`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function DocsNavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center justify-between group px-3 py-2 rounded-lg transition-all text-sm font-medium",
      active ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
    )}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <ChevronRight className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity", active && "opacity-50")} />
    </button>
  );
}

function CodeBlock({ code, language = "bash" }: { code: string, language?: string }) {
  return (
    <div className="relative group">
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/5 hover:bg-white/10" onClick={() => {
                navigator.clipboard.writeText(code);
                toast.success("Copié !");
            }}>
                <ClipboardCheck className="h-4 w-4 text-zinc-400" />
            </Button>
        </div>
        <pre className="font-mono text-sm text-zinc-300 bg-zinc-900 border border-white/5 p-6 rounded-xl overflow-x-auto leading-relaxed">
            {code}
        </pre>
    </div>
  );
}

function ParamInfo({ name, type, required = false, desc }: { name: string, type: string, required?: boolean, desc: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <code className="text-indigo-400 font-bold">{name}</code>
                <span className="text-[10px] uppercase font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">{type}</span>
                {required && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase leading-none">Requis</Badge>}
            </div>
            <p className="text-sm text-zinc-500">{desc}</p>
        </div>
    );
}

import { toast } from "sonner";
