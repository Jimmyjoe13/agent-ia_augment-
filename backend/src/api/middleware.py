"""
API Gateway Middlewares
=======================

Middlewares pour la gestion du rate limiting, du logging et des headers de sécurité.
"""

import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from src.config.logging_config import get_logger
from src.services.rate_limiter import get_rate_limiter
from src.config.settings import get_settings

logger = get_logger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour ajouter les headers de Rate Limiting aux réponses.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # On ne limite pas le health check ou la racine
        if request.url.path in ["/health", "/", "/api/v1/health"]:
            return await call_next(request)
            
        response = await call_next(request)
        
        # Ajouter les headers si les infos sont présentes (injectées par get_api_key)
        if hasattr(request.state, "rate_limit_count") and hasattr(request.state, "rate_limit_max"):
            limit = request.state.rate_limit_max
            count = request.state.rate_limit_count
            remaining = max(0, limit - count)
            
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            
            # Reset simple (fin de la minute actuelle)
            reset = 60 - (int(time.time()) % 60)
            response.headers["X-RateLimit-Reset"] = str(reset)
        
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour logger les requêtes et leur temps d'exécution.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        
        # Extraire les infos utiles avant
        method = request.method
        path = request.url.path
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        status_code = response.status_code
        
        # Logger
        logger.info(
            "Request completed",
            method=method,
            path=path,
            status=status_code,
            duration=f"{process_time:.3f}s"
        )
        
        # Ajouter le header de temps d'exécution
        response.headers["X-Response-Time"] = f"{process_time:.3f}s"
        
        return response
