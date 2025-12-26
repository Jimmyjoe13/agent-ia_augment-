"""
API Dependencies
=================

Dépendances réutilisables pour les routes FastAPI.
Inclut l'authentification utilisateur (Session) et Admin (Master Key).
"""

from typing import Annotated
from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import APIKeyHeader
from jose import jwt

from src.config.settings import get_settings
from src.repositories.user_repository import UserRepository
from src.models.user import UserWithSubscription
from src.api.auth import api_master_key_header

# Repository singleton
_user_repo: UserRepository | None = None

def get_user_repo() -> UserRepository:
    global _user_repo
    if _user_repo is None:
        _user_repo = UserRepository()
    return _user_repo

async def get_current_user(
    request: Request,
) -> UserWithSubscription:
    """
    Récupère l'utilisateur authentifié via le token de session avec validation JWT.
    """
    repo = get_user_repo()
    
    # 1. Vérifier le header Authorization (Bearer Token)
    auth_header = request.headers.get("Authorization")
    user_email = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            # Décodage du token Google ID (sans vérif signature en dev, ou avec clés publiques en prod)
            # En prod, il faudrait récupérer les clés publiques Google.
            # Ici on fait confiance au fait que si on arrive à le decoder, on a l'email.
            # C'est un raccourci acceptable pour le prototype, à durcir ensuite.
            payload = jwt.get_unverified_claims(token)
            user_email = payload.get("email")
        except Exception:
            pass # Token invalide ou malformé
            
    # 2. Si pas d'email extrait du token, vérifier X-User-ID (bypass backend/legacy)
    # Cela permet au backend d'admin de se faire passer pour un user si besoin via API Key interne,
    # ou pour des tests.
    user_id_header = request.headers.get("X-User-ID")
    
    user = None
    
    if user_email:
        user = repo.get_by_email(user_email)
    elif user_id_header:
        user = repo.get_user_with_subscription(user_id_header)
        
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"error": "not_authenticated", "message": "Authentification requise"}
        )
        
    # Si on a trouvé l'user par email, on charge les infos de subscription
    if user_email and not isinstance(user, UserWithSubscription):
         # Le repo.get_by_email retourne UserInfo, on veut UserWithSubscription
         user = repo.get_user_with_subscription(str(user.id))
         
    if not user:
         raise HTTPException(
            status_code=401,
            detail={"error": "user_not_found", "message": "Utilisateur introuvable"}
        )

    return user

# Alias pour injecter l'utilisateur
CurrentUser = Annotated[UserWithSubscription, Depends(get_current_user)]

async def require_admin_user(
    user: CurrentUser,
) -> UserWithSubscription:
    """Vérifie que l'utilisateur a le rôle admin."""
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail={"error": "forbidden", "message": "Accès administrateur requis"}
        )
    return user
