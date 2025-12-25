"""
Tests unitaires pour l'authentification API Key.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from uuid import uuid4

from fastapi import HTTPException

from src.models.api_key import (
    ApiKeyCreate,
    ApiKeyScope,
    ApiKeyResponse,
    ApiKeyValidation,
)


class TestApiKeyModels:
    """Tests pour les modèles API Key."""
    
    def test_api_key_create_valid(self):
        """Test création d'une clé API valide."""
        key = ApiKeyCreate(
            name="Test Application",
            scopes=[ApiKeyScope.QUERY, ApiKeyScope.FEEDBACK],
        )
        
        assert key.name == "Test Application"
        assert ApiKeyScope.QUERY in key.scopes
        assert key.rate_limit_per_minute == 100  # Défaut
    
    def test_api_key_create_with_options(self):
        """Test création avec options personnalisées."""
        key = ApiKeyCreate(
            name="Production App",
            scopes=[ApiKeyScope.ADMIN],
            rate_limit_per_minute=500,
            monthly_quota=50000,
            expires_in_days=90,
            metadata={"team": "backend"},
        )
        
        assert key.name == "Production App"
        assert key.rate_limit_per_minute == 500
        assert key.monthly_quota == 50000
        assert key.expires_in_days == 90
        assert key.metadata["team"] == "backend"
    
    def test_api_key_create_name_validation(self):
        """Test validation du nom (min 3 caractères)."""
        with pytest.raises(ValueError):
            ApiKeyCreate(name="ab", scopes=[ApiKeyScope.QUERY])
    
    def test_api_key_scopes_deduplication(self):
        """Test que les scopes sont dédupliqués."""
        key = ApiKeyCreate(
            name="Test",
            scopes=[ApiKeyScope.QUERY, ApiKeyScope.QUERY, ApiKeyScope.QUERY],
        )
        
        assert len(key.scopes) == 1
    
    def test_api_key_validation_model(self):
        """Test du modèle de validation."""
        validation = ApiKeyValidation(
            id=uuid4(),
            name="Test Key",
            scopes=["query", "feedback"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        assert validation.is_valid
        assert "query" in validation.scopes
        assert validation.rejection_reason is None
    
    def test_api_key_validation_rejected(self):
        """Test validation rejetée."""
        validation = ApiKeyValidation(
            id=uuid4(),
            name="Expired Key",
            scopes=["query"],
            rate_limit_per_minute=100,
            is_valid=False,
            rejection_reason="key_expired",
        )
        
        assert not validation.is_valid
        assert validation.rejection_reason == "key_expired"


class TestApiKeyScopes:
    """Tests pour les scopes."""
    
    def test_all_scopes_exist(self):
        """Test que tous les scopes existent."""
        expected = ["query", "ingest", "feedback", "admin"]
        
        for scope in expected:
            assert hasattr(ApiKeyScope, scope.upper())
    
    def test_scope_values(self):
        """Test les valeurs des scopes."""
        assert ApiKeyScope.QUERY.value == "query"
        assert ApiKeyScope.INGEST.value == "ingest"
        assert ApiKeyScope.FEEDBACK.value == "feedback"
        assert ApiKeyScope.ADMIN.value == "admin"


class TestAuthDependencies:
    """Tests pour les dépendances d'authentification."""
    
    @pytest.mark.asyncio
    async def test_require_api_key_no_key(self):
        """Test sans clé API."""
        from src.api.auth import require_api_key
        
        with pytest.raises(HTTPException) as exc_info:
            await require_api_key(None)
        
        assert exc_info.value.status_code == 401
        assert "authentication_required" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_require_api_key_valid(self):
        """Test avec clé valide."""
        from src.api.auth import require_api_key
        
        mock_key = ApiKeyValidation(
            id=uuid4(),
            name="Valid Key",
            scopes=["query"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        result = await require_api_key(mock_key)
        assert result == mock_key


class TestScopeChecking:
    """Tests pour la vérification des scopes."""
    
    @pytest.mark.asyncio
    async def test_require_scope_success(self):
        """Test scope présent."""
        from src.api.auth import require_scope
        
        mock_key = ApiKeyValidation(
            id=uuid4(),
            name="Test",
            scopes=["query", "feedback"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        checker = require_scope("query")
        result = await checker(mock_key)
        assert result == mock_key
    
    @pytest.mark.asyncio
    async def test_require_scope_admin_bypass(self):
        """Test que admin peut tout faire."""
        from src.api.auth import require_scope
        
        mock_key = ApiKeyValidation(
            id=uuid4(),
            name="Admin Key",
            scopes=["admin"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        # Admin peut accéder aux endpoints "ingest"
        checker = require_scope("ingest")
        result = await checker(mock_key)
        assert result == mock_key
    
    @pytest.mark.asyncio
    async def test_require_scope_denied(self):
        """Test scope manquant."""
        from src.api.auth import require_scope
        
        mock_key = ApiKeyValidation(
            id=uuid4(),
            name="Query Only",
            scopes=["query"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        checker = require_scope("admin")
        
        with pytest.raises(HTTPException) as exc_info:
            await checker(mock_key)
        
        assert exc_info.value.status_code == 403
        assert "insufficient_scope" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_require_any_scope_success(self):
        """Test any scope avec un scope présent."""
        from src.api.auth import require_any_scope
        
        mock_key = ApiKeyValidation(
            id=uuid4(),
            name="Ingest Key",
            scopes=["ingest"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        checker = require_any_scope("ingest", "admin")
        result = await checker(mock_key)
        assert result == mock_key
    
    @pytest.mark.asyncio
    async def test_require_any_scope_denied(self):
        """Test any scope sans scope valide."""
        from src.api.auth import require_any_scope
        
        mock_key = ApiKeyValidation(
            id=uuid4(),
            name="Query Only",
            scopes=["query"],
            rate_limit_per_minute=100,
            is_valid=True,
        )
        
        checker = require_any_scope("ingest", "admin")
        
        with pytest.raises(HTTPException) as exc_info:
            await checker(mock_key)
        
        assert exc_info.value.status_code == 403
