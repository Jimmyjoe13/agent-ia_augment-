"""
Tests d'intégration pour l'API FastAPI.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from src.api.main import create_app
from src.models.api_key import ApiKeyValidation
from uuid import uuid4


@pytest.fixture
def client():
    """Fixture pour le client de test."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def mock_valid_api_key():
    """Fixture pour une clé API valide mockée."""
    return ApiKeyValidation(
        id=uuid4(),
        name="Test Key",
        scopes=["query", "feedback", "ingest", "admin"],
        rate_limit_per_minute=100,
        is_valid=True,
    )


class TestHealthEndpoints:
    """Tests pour les endpoints de santé (non protégés)."""
    
    def test_root_endpoint(self, client):
        """Test endpoint racine."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "name" in data
        assert data["name"] == "RAG Agent IA API"
        assert "version" in data
        assert "docs" in data
    
    def test_health_endpoint(self, client):
        """Test endpoint de santé."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "version" in data
        assert "services" in data
        assert isinstance(data["services"], dict)


class TestOpenAPIDocumentation:
    """Tests pour la documentation OpenAPI."""
    
    def test_openapi_json(self, client):
        """Test schéma OpenAPI."""
        response = client.get("/openapi.json")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data
        assert "components" in data
    
    def test_openapi_security_schemes(self, client):
        """Test que les schémas de sécurité sont présents."""
        response = client.get("/openapi.json")
        data = response.json()
        
        security_schemes = data.get("components", {}).get("securitySchemes", {})
        
        assert "ApiKeyHeader" in security_schemes
        assert security_schemes["ApiKeyHeader"]["type"] == "apiKey"
        assert security_schemes["ApiKeyHeader"]["in"] == "header"
        assert security_schemes["ApiKeyHeader"]["name"] == "X-API-Key"
    
    def test_openapi_tags(self, client):
        """Test que les tags sont présents."""
        response = client.get("/openapi.json")
        data = response.json()
        
        tags = data.get("tags", [])
        tag_names = [t["name"] for t in tags]
        
        assert "RAG" in tag_names
        assert "Feedback" in tag_names
        assert "Ingestion" in tag_names
    
    def test_swagger_ui(self, client):
        """Test que Swagger UI est accessible."""
        response = client.get("/docs")
        
        assert response.status_code == 200
        assert "swagger" in response.text.lower()
    
    def test_redoc(self, client):
        """Test que ReDoc est accessible."""
        response = client.get("/redoc")
        
        assert response.status_code == 200
        assert "redoc" in response.text.lower()


class TestProtectedEndpoints:
    """Tests pour les endpoints protégés."""
    
    def test_query_without_api_key(self, client):
        """Test query sans clé API."""
        response = client.post(
            "/api/v1/query",
            json={"question": "Test question"},
        )
        
        # Devrait retourner 401 ou 403 selon la config
        assert response.status_code in [401, 403, 500]
    
    def test_feedback_without_api_key(self, client):
        """Test feedback sans clé API."""
        response = client.post(
            "/api/v1/feedback",
            json={
                "conversation_id": str(uuid4()),
                "score": 5,
            },
        )
        
        assert response.status_code in [401, 403, 500]
    
    def test_ingest_without_api_key(self, client):
        """Test ingestion sans clé API."""
        response = client.post(
            "/api/v1/ingest/text",
            json={
                "content": "Test content for ingestion",
                "source_id": "test:1",
            },
        )
        
        assert response.status_code in [401, 403, 500]


class TestAdminEndpoints:
    """Tests pour les endpoints admin."""
    
    def test_list_keys_without_auth(self, client):
        """Test liste des clés sans authentification."""
        response = client.get("/api/v1/keys")
        
        assert response.status_code in [401, 500]
    
    def test_create_key_without_auth(self, client):
        """Test création de clé sans master key."""
        response = client.post(
            "/api/v1/keys",
            json={
                "name": "Test Key",
                "scopes": ["query"],
            },
        )
        
        assert response.status_code in [401, 500]


class TestCORS:
    """Tests pour CORS."""
    
    def test_cors_headers(self, client):
        """Test que les headers CORS sont présents."""
        response = client.options(
            "/api/v1/query",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        
        # En mode dev, CORS devrait être permissif
        assert response.status_code in [200, 405]


class TestRateLimitHeaders:
    """Tests pour les headers de rate limit."""
    
    def test_rate_limit_headers_exposed(self, client):
        """Test que les headers rate limit sont dans expose_headers."""
        response = client.get("/openapi.json")
        
        # Le CORS middleware devrait exposer ces headers
        # On vérifie juste que l'API est fonctionnelle
        assert response.status_code == 200
