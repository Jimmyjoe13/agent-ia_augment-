/**
 * NextAuth.js Configuration
 * ===========================
 * 
 * Configuration de l'authentification OAuth avec Google.
 * Intégration avec le backend FastAPI pour la gestion des utilisateurs.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

// Configuration NextAuth
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Callback après authentification réussie
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      try {
        // Envoyer les infos au backend pour créer/mettre à jour l'utilisateur
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        
        const response = await fetch(`${backendUrl}/auth/callback/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: account?.access_token, // On envoie le token d'accès au backend
            provider: "google",
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            provider_id: account?.providerAccountId,
          }),
        });

        if (!response.ok) {
          console.error("Backend auth failed:", await response.text());
          return false;
        }

        const data = await response.json();
        
        // Stocker l'ID utilisateur pour les requêtes ultérieures
        if (data.user?.id) {
          (user as any).backendUserId = data.user.id;
          (user as any).plan = data.user.plan_slug || "free";
        }

        return true;
      } catch (error) {
        console.error("Error syncing with backend:", error);
        // En cas d'erreur backend, on autorise quand même la connexion
        // Le frontend gèrera l'erreur séparément
        return true;
      }
    },

    // Enrichir le JWT avec les infos utilisateur
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).backendUserId || user.id;
        token.plan = (user as any).plan || "free";
        token.accessToken = account?.access_token;
      }
      return token;
    },

    // Enrichir la session avec les infos du token
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

// Export handlers et fonctions
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
