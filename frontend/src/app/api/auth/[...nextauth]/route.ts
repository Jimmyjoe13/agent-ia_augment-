/**
 * NextAuth.js API Route Handler
 * ==============================
 * 
 * Gère tous les endpoints d'authentification NextAuth.
 * Cette route catch-all traite : /api/auth/*
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
