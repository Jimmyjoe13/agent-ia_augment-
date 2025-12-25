# 🤖 RAG Agent IA

Système de **Retrieval-Augmented Generation (RAG)** personnalisé avec authentification par clé API.

## ✨ Fonctionnalités

- 🔍 **Recherche hybride** : Vector Store + Recherche web (Perplexity)
- 🧠 **LLM Mistral AI** : Génération de réponses contextuelles
- 📦 **Multi-sources** : GitHub, PDF, LinkedIn, texte manuel
- 🔐 **Authentification API Key** : Sécurisée avec scopes et quotas
- 📊 **Feedback Loop** : Amélioration continue par ré-injection
- 📈 **Rate Limiting** : Contrôle des usages par clé

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API FastAPI                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Auth Layer  │  │   Routes    │  │   Admin Routes      │ │
│  │ (API Keys)  │  │ /api/v1/*   │  │ /api/v1/keys        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     RAG Engine                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Embedding    │  │ Vector       │  │ Perplexity       │  │
│  │ Service      │  │ Search       │  │ Agent (Web)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase (pgvector)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ documents    │  │ conversations│  │ api_keys         │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Installation

### 1. Cloner et installer

```bash
cd agent-ia_augmenté
pip install -r requirements.txt
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env avec vos clés API
```

### 3. Exécuter les migrations Supabase

Dans le **SQL Editor** de Supabase, exécutez dans l'ordre :

1. `scripts/migrations/001_create_documents_table.sql`
2. `scripts/migrations/002_create_similarity_function.sql`
3. `scripts/migrations/003_create_conversations_table.sql`
4. `scripts/migrations/004_create_api_keys_table.sql`

### 4. Générer une Master Key

```bash
python -c "import secrets; print('master_' + secrets.token_hex(32))"
```

Ajoutez cette clé dans `.env` :

```
API_MASTER_KEY=master_xxxx...
```

## 🔐 Authentification API

### Créer une clé API

```bash
curl -X POST http://localhost:8000/api/v1/keys \
  -H "X-API-Key: master_votre_master_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Application",
    "scopes": ["query", "feedback"],
    "rate_limit_per_minute": 100
  }'
```

⚠️ **Important** : La clé complète n'est affichée qu'une seule fois !

### Utiliser une clé API

```bash
# Via header (recommandé)
curl -X POST http://localhost:8000/api/v1/query \
  -H "X-API-Key: rag_votre_cle" \
  -H "Content-Type: application/json" \
  -d '{"question": "Quelles sont mes compétences?"}'

# Via query param
curl "http://localhost:8000/api/v1/query?api_key=rag_votre_cle" \
  -H "Content-Type: application/json" \
  -d '{"question": "..."}'
```

### Scopes disponibles

| Scope      | Description               |
| ---------- | ------------------------- |
| `query`    | Interroger le système RAG |
| `ingest`   | Ingérer des documents     |
| `feedback` | Soumettre des feedbacks   |
| `admin`    | Accès complet             |

## 📖 Documentation API

Démarrez l'API puis accédez à :

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **OpenAPI JSON** : http://localhost:8000/openapi.json

## 🎮 Démarrage Rapide

### Lancer l'API

```bash
python -m uvicorn src.api.main:app --reload
```

### Lancer l'interface Streamlit

```bash
streamlit run streamlit_app.py
```

### Ingérer des données

```bash
# GitHub
python scripts/ingest.py --github owner/repo

# PDF
python scripts/ingest.py --pdf ./cv.pdf

# LinkedIn
python scripts/ingest.py --linkedin ./linkedin_export.json
```

## 📁 Structure du Projet

```
agent-ia_augmenté/
├── src/
│   ├── api/              # FastAPI (routes, auth, schemas)
│   ├── agents/           # Perplexity Agent
│   ├── config/           # Settings, logging
│   ├── models/           # Pydantic models
│   ├── providers/        # GitHub, PDF, LinkedIn
│   ├── repositories/     # Supabase access
│   └── services/         # RAG Engine, Embedding, Feedback
├── scripts/
│   ├── migrations/       # SQL migrations
│   ├── ingest.py         # CLI d'ingestion
│   └── train.py          # Training loop
├── tests/                # Unit & integration tests
├── streamlit_app.py      # UI interactive
├── requirements.txt
└── .env.example
```

## 🧪 Tests

```bash
# Exécuter tous les tests
python -m pytest tests/ -v

# Avec couverture
python -m pytest tests/ -v --cov=src
```

## 📜 License

MIT License - Voir [LICENSE](LICENSE)
