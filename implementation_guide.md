# Guide d'Implémentation - Authentification & Multi-tenancy

Cette phase a transformé le prototype RAG en une plateforme multi-tenant sécurisée.

## 1. Mises à jour de la Base de Données

Vous devez exécuter manuellement les scripts SQL suivants dans votre Console Supabase (SQL Editor) :

1.  **`backend/scripts/migrations/005_multi_tenant_monetization.sql`** :

    - Crée les tables `plans`, `subscriptions`, `subscription_usage`.
    - Met à jour `users` et `api_keys` pour le multi-tenancy.
    - Configure les Policies RLS.

2.  **`backend/scripts/migrations/006_update_match_documents.sql`** :
    - Met à jour la fonction RPC `match_documents` pour filtrer les résultats par utilisateur.

## 2. Configuration Backend

Assurez-vous que les variables d'environnement suivantes sont définies dans `backend/.env` :

```env
# Authentification
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Base de données
# Assurez-vous que la connexion est correcte
```

Installez les nouvelles dépendances :

```bash
pip install python-jose[cryptography] google-auth
```

## 3. Configuration Frontend

Assurez-vous que les variables d'environnement suivantes sont définies dans `frontend/.env.local` :

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=pleasemakethisalongrandomstring

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 4. Fonctionnalités Implémentées

### Authentification (Frontend)

- **NextAuth.js** : Gestion complète de la session (Login avec Google).
- **SessionProvider** : Synchronisation automatique du token de session avec le client API.
- **Login Page** : Nouvelle page `/login` au design premium.

### Backend Multi-tenant

- **Isolation des Données** : Les documents et conversations sont maintenant liés à un `user_id`.
- **API Console** : Nouveaux endpoints `/api/v1/console/*` pour que l'utilisateur gère ses propres clés API.
- **Validation Token** : Le backend valide les tokens Google ID envoyés par le frontend.

### Séparation des Rôles

- **Utilisateur (Console)** : Se connecte via Google, gère ses clés API, voit son usage.
- **Playground (RAG)** : Utilise une **Clé API** créée par l'utilisateur pour interagir avec le RAG.
- **Admin (System)** : Utilise une Master Key (ou rôle admin) pour l'ingestion globale et la maintenance.

## 5. Prochaines Étapes

- Créer les pages Dashboard (`/dashboard`) et Clés API (`/keys`) en utilisant les nouveaux endpoints.
- Mettre en place la page de Pricing et l'intégration Stripe (le backend est prêt avec les tables `plans`).
