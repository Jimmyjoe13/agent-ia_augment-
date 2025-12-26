/**
 * Login Page
 * ===========
 * 
 * Page de connexion avec authentification Google OAuth.
 * Design moderne et premium inspiré des Developer Platforms.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Connexion | RAG Agent Platform",
  description: "Connectez-vous à votre compte développeur",
};

export default async function LoginPage() {
  // Rediriger si déjà connecté
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            RAG Agent Platform
          </h1>
          <p className="text-slate-400">
            Developer Platform pour agents IA augmentés
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            Connexion
          </h2>
          
          <Suspense fallback={<div className="h-12 bg-white/5 rounded-lg animate-pulse" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              En vous connectant, vous acceptez nos{" "}
              <a href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
                Conditions d&apos;utilisation
              </a>{" "}
              et notre{" "}
              <a href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
                Politique de confidentialité
              </a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">🔑</div>
            <p className="text-xs text-slate-400">Clés API<br />Self-Service</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs text-slate-400">Analytics<br />Temps réel</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-xs text-slate-400">Playground<br />Interactif</p>
          </div>
        </div>
      </div>
    </div>
  );
}
