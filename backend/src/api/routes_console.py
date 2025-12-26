"""
Console Routes
===============

Endpoints pour la console développeur (Self-Service).
Accessibles aux utilisateurs authentifiés via Session.

Prefix: /api/v1/console
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.deps import CurrentUser
from src.config.logging_config import get_logger
from src.models.api_key import (
    ApiKeyCreate,
    ApiKeyResponse,
    ApiKeyListResponse,
    ApiKeyInfo,
)
from src.repositories.api_key_repository import ApiKeyRepository
from src.repositories.subscription_repository import SubscriptionRepository

logger = get_logger(__name__)

router = APIRouter(
    prefix="/console",
    tags=["Console Developer"],
)

# ===== Repositories =====

def get_key_repo() -> ApiKeyRepository:
    return ApiKeyRepository()

def get_sub_repo() -> SubscriptionRepository:
    return SubscriptionRepository()

# ===== API Keys Endpoints =====

@router.get(
    "/keys",
    response_model=ApiKeyListResponse,
    summary="Mes clés API",
)
async def list_my_keys(
    user: CurrentUser,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    include_inactive: bool = False,
) -> ApiKeyListResponse:
    """Liste les clés API de l'utilisateur courant."""
    repo = get_key_repo()
    
    keys, total = repo.list_keys(
        user_id=str(user.id),
        page=page,
        per_page=per_page,
        include_inactive=include_inactive,
    )
    
    return ApiKeyListResponse(
        keys=keys,
        total=total,
        page=page,
        per_page=per_page,
    )

@router.post(
    "/keys",
    response_model=ApiKeyResponse,
    status_code=201,
    summary="Créer une clé API",
)
async def create_my_key(
    request: ApiKeyCreate,
    user: CurrentUser,
) -> ApiKeyResponse:
    """
    Crée une nouvelle clé API pour l'utilisateur courant.
    Vérifie les quotas de l'abonnement.
    """
    key_repo = get_key_repo()
    sub_repo = get_sub_repo()
    
    # 1. Vérifier les quotas
    limits = sub_repo.check_user_limits(str(user.id), "api_key")
    if not limits.get("allowed", False):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "quota_exceeded",
                "message": f"Limite de clés atteinte: {limits.get('reason')}",
                "limits": limits
            }
        )
    
    # 2. Créer la clé
    # Forcer les scopes "utilisateur" (pas d'admin)
    safe_scopes = [s for s in request.scopes if s != "admin"]
    
    try:
        result = key_repo.create({
            "user_id": str(user.id),  # LIER A L'UTILISATEUR
            "name": request.name,
            "scopes": [s for s in safe_scopes], # Pas d'enum.value ici car request.scopes est déjà string? verify schema
            "rate_limit_per_minute": request.rate_limit_per_minute,
            "monthly_quota": request.monthly_quota,
            "expires_in_days": request.expires_in_days,
        })
        
        logger.info("API key created by user", user_id=str(user.id), key_id=result["id"])
        
        return ApiKeyResponse(
            **{k: v for k, v in result.items() if k != "key"},
            key=result["key"], # Inclure la clé complète
            is_active=True,
            created_at=result["created_at"],
        )
        
    except Exception as e:
        logger.error("Failed to create user key", error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lors de la création de la clé")

@router.delete(
    "/keys/{key_id}",
    status_code=204,
    summary="Révoquer une clé",
)
async def revoke_my_key(
    key_id: UUID,
    user: CurrentUser,
) -> None:
    """Révoque une clé appartenant à l'utilisateur."""
    repo = get_key_repo()
    
    # Vérifier appartenance
    key = repo.get_by_id(str(key_id))
    if not key or str(key.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Clé introuvable")
        
    repo.revoke(str(key_id))

# ===== Usage Endpoint =====

@router.get("/usage", summary="Mon usage")
async def get_my_usage(
    user: CurrentUser,
):
    """Récupère les statistiques d'usage de l'utilisateur."""
    sub_repo = get_sub_repo()
    usage = sub_repo.get_user_usage(str(user.id))
    
    if not usage:
        # Fallback si pas encore d'usage
        return {
            "period": "current",
            "requests_count": 0,
            "requests_limit": user.requests_limit,
            "plan": user.plan_slug,
        }
        
    return usage
