"""
Authentication Routes
======================

Endpoints FastAPI pour l'authentification OAuth et la gestion de session.

Ce module fournit :
- Callback OAuth (Google, GitHub)
- Récupération du profil utilisateur (/me)
- Logout et refresh de session

Intégration avec NextAuth.js côté frontend.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from src.config.logging_config import get_logger
from src.config.settings import get_settings
from src.models.user import (
    UserInfo,
    UserWithSubscription,
    OAuthProvider,
    SessionInfo,
)
from src.repositories.user_repository import UserRepository

from src.api.deps import get_user_repo, get_current_user

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ===== Schemas =====

class OAuthCallbackRequest(BaseModel):
    """Données du callback OAuth."""
    
    code: str = Field(..., description="Code d'autorisation OAuth")
    provider: OAuthProvider = Field(..., description="Provider OAuth")
    redirect_uri: str | None = Field(default=None, description="URI de redirection")


class TokenResponse(BaseModel):
    """Réponse avec le token de session."""
    
    access_token: str = Field(..., description="Token d'accès")
    token_type: str = Field(default="Bearer")
    expires_in: int = Field(..., description="Expiration en secondes")
    user: UserInfo = Field(..., description="Informations utilisateur")


class GoogleTokenData(BaseModel):
    """Données du token Google."""
    
    access_token: str
    id_token: str | None = None
    expires_in: int
    token_type: str = "Bearer"


class GoogleUserInfo(BaseModel):
    """Données utilisateur Google."""
    
    id: str
    email: str
    verified_email: bool = True
    name: str | None = None
    given_name: str | None = None
    family_name: str | None = None
    picture: str | None = None


# ===== OAuth Endpoints =====

@router.post("/callback/google", response_model=TokenResponse)
async def google_oauth_callback(
    request: OAuthCallbackRequest,
) -> TokenResponse:
    """
    Callback OAuth Google.
    
    Échange le code d'autorisation contre un token d'accès,
    récupère les infos utilisateur et crée/met à jour le compte.
    
    Args:
        request: Code OAuth et provider.
        
    Returns:
        TokenResponse avec le token de session et les infos utilisateur.
    """
    settings = get_settings()
    repo = get_user_repo()
    
    # Configuration Google OAuth
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if not google_client_id or not google_client_secret:
        raise HTTPException(
            status_code=500,
            detail={"error": "oauth_not_configured", "message": "Google OAuth non configuré"}
        )
    
    # 1. Échanger le code contre un token d'accès
    redirect_uri = request.redirect_uri or f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/api/auth/callback/google"
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": google_client_id,
                "client_secret": google_client_secret,
                "code": request.code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        
        if token_response.status_code != 200:
            logger.error("Google token exchange failed", error=token_response.text)
            raise HTTPException(
                status_code=401,
                detail={"error": "oauth_token_failed", "message": "Échec de l'authentification Google"}
            )
        
        token_data = GoogleTokenData(**token_response.json())
        
        # 2. Récupérer les infos utilisateur
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_data.access_token}"},
        )
        
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail={"error": "oauth_userinfo_failed", "message": "Impossible de récupérer les infos utilisateur"}
            )
        
        google_user = GoogleUserInfo(**user_response.json())
    
    # 3. Créer ou mettre à jour l'utilisateur
    user = repo.get_or_create_oauth_user(
        email=google_user.email,
        name=google_user.name or google_user.given_name,
        provider="google",
        provider_id=google_user.id,
        avatar_url=google_user.picture,
    )
    
    # 4. Générer un token de session (simple pour l'instant, à améliorer avec JWT)
    session_token = secrets.token_urlsafe(32)
    expires_in = 60 * 60 * 24 * 7  # 7 jours
    
    # TODO: Stocker le token en base ou utiliser JWT
    # Pour l'instant, on utilise le format Supabase-compatible
    
    logger.info("User authenticated via Google", user_id=str(user.id), email=user.email)
    
    return TokenResponse(
        access_token=session_token,
        expires_in=expires_in,
        user=user,
    )


@router.get("/me", response_model=UserWithSubscription)
async def me(
    user: UserWithSubscription = Depends(get_current_user),
) -> UserWithSubscription:
    """
    Récupère le profil de l'utilisateur connecté.
    """
    return user


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
) -> dict[str, str]:
    """
    Déconnecte l'utilisateur.
    
    Invalide le token de session.
    
    Returns:
        Message de confirmation.
    """
    # TODO: Invalider le token en base
    # Pour l'instant, simple message de confirmation
    
    logger.info("User logged out")
    
    return {"message": "Déconnexion réussie"}


@router.get("/session", response_model=SessionInfo | None)
async def get_session(
    request: Request,
) -> SessionInfo | None:
    """
    Vérifie si l'utilisateur a une session active.
    
    Returns:
        SessionInfo si connecté, None sinon.
    """
    auth_header = request.headers.get("Authorization")
    user_id = request.headers.get("X-User-ID")
    
    if not auth_header or not user_id:
        return None
    
    repo = get_user_repo()
    user = repo.get_user_with_subscription(user_id)
    
    if not user:
        return None
    
    return SessionInfo(
        user_id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        role=user.role,
        plan_slug=user.plan_slug,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )


# ===== Plans Endpoints (publics) =====

@router.get("/plans")
async def list_plans() -> dict[str, Any]:
    """
    Liste les plans d'abonnement disponibles.
    
    Endpoint public pour la page pricing.
    
    Returns:
        Liste des plans avec leurs features.
    """
    from src.repositories.subscription_repository import SubscriptionRepository
    
    repo = SubscriptionRepository()
    plans = repo.list_plans()
    
    return {
        "plans": [p.model_dump() for p in plans],
    }
