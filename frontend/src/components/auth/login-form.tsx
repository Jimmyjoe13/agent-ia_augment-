/**
 * Login Form Component
 * =====================
 * 
 * Formulaire de connexion avec bouton Google OAuth.
 * Composant client pour gérer les interactions.
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{isLoading ? "Connexion en cours..." : "Continuer avec Google"}</span>
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-transparent text-slate-500">
            Authentification sécurisée
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          🔒 Vos données sont protégées par chiffrement SSL
        </p>
      </div>
    </div>
  );
}
