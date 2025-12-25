"""
Tests unitaires pour les modèles.
"""

import pytest
from uuid import uuid4
from datetime import datetime

from src.models.document import (
    Document,
    DocumentCreate,
    DocumentMetadata,
    SourceType,
    DocumentMatch,
)
from src.models.conversation import (
    Conversation,
    ConversationCreate,
    ConversationMetadata,
    ContextSource,
    FlagType,
    FeedbackCreate,
)


class TestDocumentModels:
    """Tests pour les modèles Document."""
    
    def test_document_create_valid(self):
        """Test création de DocumentCreate valide."""
        doc = DocumentCreate(
            content="Ceci est un contenu de test.",
            source_type=SourceType.GITHUB,
            source_id="github:test/repo",
        )
        
        assert doc.content == "Ceci est un contenu de test."
        assert doc.source_type == SourceType.GITHUB
        assert doc.source_id == "github:test/repo"
    
    def test_document_create_cleans_content(self):
        """Test que le contenu est nettoyé."""
        doc = DocumentCreate(
            content="  Texte   avec   espaces   multiples  ",
            source_type=SourceType.PDF,
        )
        
        assert doc.content == "Texte avec espaces multiples"
    
    def test_document_metadata_defaults(self):
        """Test les valeurs par défaut des métadonnées."""
        metadata = DocumentMetadata()
        
        assert metadata.title is None
        assert metadata.language == "fr"
        assert metadata.tags == []
    
    def test_document_metadata_with_values(self):
        """Test métadonnées avec valeurs."""
        metadata = DocumentMetadata(
            title="Mon Document",
            author="Test User",
            tags=["test", "python"],
        )
        
        assert metadata.title == "Mon Document"
        assert metadata.author == "Test User"
        assert "test" in metadata.tags
    
    def test_document_match_similarity_range(self):
        """Test que la similarité est dans [0, 1]."""
        match = DocumentMatch(
            id=uuid4(),
            content="Test content",
            source_type=SourceType.MANUAL,
            similarity=0.85,
            created_at=datetime.utcnow(),
        )
        
        assert 0 <= match.similarity <= 1


class TestConversationModels:
    """Tests pour les modèles Conversation."""
    
    def test_conversation_create_valid(self):
        """Test création de ConversationCreate valide."""
        conv = ConversationCreate(
            session_id="test-session-123",
            user_query="Quelle est la météo?",
            ai_response="Je ne peux pas accéder à la météo en temps réel.",
        )
        
        assert conv.session_id == "test-session-123"
        assert "météo" in conv.user_query
    
    def test_context_source(self):
        """Test du modèle ContextSource."""
        source = ContextSource(
            source_type="vector_store",
            document_id=uuid4(),
            content_preview="Aperçu du contenu...",
            similarity_score=0.92,
        )
        
        assert source.source_type == "vector_store"
        assert source.similarity_score == 0.92
    
    def test_conversation_metadata(self):
        """Test des métadonnées de conversation."""
        metadata = ConversationMetadata(
            model_used="mistral-large",
            tokens_input=150,
            tokens_output=200,
            response_time_ms=1500,
        )
        
        assert metadata.model_used == "mistral-large"
        assert metadata.tokens_input + metadata.tokens_output == 350
    
    def test_feedback_create_score_validation(self):
        """Test validation du score de feedback."""
        # Score valide
        feedback = FeedbackCreate(
            conversation_id=uuid4(),
            score=4,
        )
        assert feedback.score == 4
        
        # Score invalide devrait lever une erreur
        with pytest.raises(ValueError):
            FeedbackCreate(
                conversation_id=uuid4(),
                score=6,  # > 5
            )
    
    def test_flag_types(self):
        """Test des types de flags."""
        assert FlagType.EXCELLENT.value == "excellent"
        assert FlagType.TO_VECTORIZE.value == "to_vectorize"
        assert FlagType.INCORRECT.value == "incorrect"


class TestSourceTypes:
    """Tests pour les types de sources."""
    
    def test_all_source_types_exist(self):
        """Test que tous les types de sources existent."""
        expected = ["github", "pdf", "linkedin", "manual", "conversation"]
        
        for source in expected:
            assert hasattr(SourceType, source.upper())
    
    def test_source_type_values(self):
        """Test les valeurs des types de sources."""
        assert SourceType.GITHUB.value == "github"
        assert SourceType.PDF.value == "pdf"
        assert SourceType.LINKEDIN.value == "linkedin"
