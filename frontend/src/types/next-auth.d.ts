/**
 * Types NextAuth.js étendus
 * ==========================
 * 
 * Étend les types par défaut de NextAuth pour inclure
 * les informations personnalisées (plan, backend user ID).
 */

import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      plan: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User extends DefaultUser {
    backendUserId?: string;
    plan?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan: string;
    accessToken?: string;
  }
}
