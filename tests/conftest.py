"""
Configuration pytest.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock

# Ajouter le répertoire racine au path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def mock_settings():
    """Fixture pour les settings mockés."""
    settings = Mock()
    settings.mistral_api_key = "test-mistral-key"
    settings.supabase_url = "https://test.supabase.co"
    settings.supabase_anon_key = "test-anon-key"
    settings.supabase_service_role_key = "test-service-key"
    settings.perplexity_api_key = "test-perplexity-key"
    settings.github_access_token = "test-github-token"
    settings.embedding_model = "mistral-embed"
    settings.embedding_dimension = 1024
    settings.similarity_threshold = 0.7
    settings.max_results = 10
    settings.llm_model = "mistral-large-latest"
    settings.llm_temperature = 0.7
    settings.llm_max_tokens = 4096
    settings.log_level = "INFO"
    settings.app_env = "development"
    settings.is_development = True
    settings.is_production = False
    return settings


@pytest.fixture
def sample_document_content():
    """Fixture pour un contenu de document exemple."""
    return """
# Mon CV

## Compétences
- Python
- FastAPI
- Machine Learning

## Expérience
Développeur Senior chez Example Corp
    """


@pytest.fixture
def sample_embedding():
    """Fixture pour un embedding exemple (1024 dimensions)."""
    return [0.1] * 1024
