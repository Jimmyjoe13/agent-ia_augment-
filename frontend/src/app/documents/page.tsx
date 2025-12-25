/**
 * Page de gestion des documents (Ingestion)
 */

"use client";

import { useState, useRef } from "react";
import { FileUp, Github, FileText, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type Tab = "text" | "pdf" | "github";

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Text ingestion
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");

  // PDF ingestion
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub ingestion
  const [githubRepo, setGithubRepo] = useState("");

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await api.ingestText({
        content: textContent,
        source_id: `manual:${Date.now()}`,
        title: textTitle || undefined,
      });
      setResult({ success: true, message: response.message });
      setTextContent("");
      setTextTitle("");
    } catch (err) {
      setResult({ success: false, message: "Erreur lors de l'ingestion" });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfSubmit = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await api.ingestPdf(pdfFile);
      setResult({ success: true, message: response.message });
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setResult({ success: false, message: "Erreur lors de l'upload du PDF" });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSubmit = async () => {
    if (!githubRepo.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await api.ingestGithub({
        repositories: [githubRepo.trim()],
      });
      setResult({ success: true, message: response.message });
      setGithubRepo("");
    } catch (err) {
      setResult({ success: false, message: "Erreur lors de l'ingestion GitHub" });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "text" as Tab, label: "Texte", icon: FileText },
    { id: "pdf" as Tab, label: "PDF", icon: FileUp },
    { id: "github" as Tab, label: "GitHub", icon: Github },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-zinc-400">
            Ajoutez des documents à votre base de connaissances
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "gap-2 bg-indigo-600"
                  : "gap-2 border-zinc-700"
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
              result.success
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {result.message}
          </div>
        )}

        {/* Text Tab */}
        {activeTab === "text" && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Ajouter du texte</CardTitle>
              <CardDescription>
                Collez du texte brut pour l&apos;ajouter à votre base de connaissances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="bg-zinc-800"
              />
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Collez votre texte ici..."
                className="min-h-[200px] bg-zinc-800"
              />
              <Button
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || loading}
                className="gap-2 bg-indigo-600 hover:bg-indigo-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Ingérer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PDF Tab */}
        {activeTab === "pdf" && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Uploadez un fichier PDF pour extraire et indexer son contenu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-zinc-700 p-8 text-center transition-colors hover:border-indigo-500/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="mx-auto mb-4 h-12 w-12 text-zinc-500" />
                {pdfFile ? (
                  <p className="text-indigo-400">{pdfFile.name}</p>
                ) : (
                  <p className="text-zinc-400">
                    Cliquez pour sélectionner un PDF
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                onClick={handlePdfSubmit}
                disabled={!pdfFile || loading}
                className="gap-2 bg-indigo-600 hover:bg-indigo-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload et Ingérer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* GitHub Tab */}
        {activeTab === "github" && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Importer depuis GitHub</CardTitle>
              <CardDescription>
                Indexez le code source d&apos;un repository GitHub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="owner/repository (ex: facebook/react)"
                className="bg-zinc-800"
              />
              <Button
                onClick={handleGithubSubmit}
                disabled={!githubRepo.trim() || loading}
                className="gap-2 bg-indigo-600 hover:bg-indigo-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                Importer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
