"""
Tests unitaires pour les providers.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

from src.providers.base import BaseProvider, ExtractedContent
from src.providers.github_provider import GithubProvider
from src.providers.pdf_provider import PDFProvider
from src.models.document import SourceType


class TestExtractedContent:
    """Tests pour ExtractedContent."""
    
    def test_extracted_content_creation(self):
        """Test création d'un contenu extrait."""
        content = ExtractedContent(
            content="Test content",
            source_id="test:123",
            metadata={"title": "Test"},
        )
        
        assert content.content == "Test content"
        assert content.source_id == "test:123"
        assert content.metadata["title"] == "Test"


class TestGithubProvider:
    """Tests pour GithubProvider."""
    
    def test_source_type(self):
        """Test du type de source."""
        with patch("src.providers.github_provider.get_settings") as mock:
            mock.return_value = Mock(github_access_token="")
            provider = GithubProvider()
            assert provider.source_type == SourceType.GITHUB
    
    def test_parse_repo_name_from_url(self):
        """Test parsing d'URL GitHub."""
        with patch("src.providers.github_provider.get_settings") as mock:
            mock.return_value = Mock(github_access_token="")
            provider = GithubProvider()
            
            url = "https://github.com/owner/repo"
            result = provider._parse_repo_name(url)
            
            assert result == "owner/repo"
    
    def test_parse_repo_name_direct(self):
        """Test parsing de nom direct."""
        with patch("src.providers.github_provider.get_settings") as mock:
            mock.return_value = Mock(github_access_token="")
            provider = GithubProvider()
            
            result = provider._parse_repo_name("owner/repo")
            
            assert result == "owner/repo"
    
    def test_detect_language(self):
        """Test détection du langage."""
        assert GithubProvider._detect_language(".py") == "python"
        assert GithubProvider._detect_language(".js") == "javascript"
        assert GithubProvider._detect_language(".md") == "markdown"
        assert GithubProvider._detect_language(".unknown") == "text"
    
    def test_default_extensions(self):
        """Test des extensions par défaut."""
        with patch("src.providers.github_provider.get_settings") as mock:
            mock.return_value = Mock(github_access_token="")
            provider = GithubProvider()
            
            assert ".py" in provider.extensions
            assert ".md" in provider.extensions
            assert ".exe" not in provider.extensions


class TestPDFProvider:
    """Tests pour PDFProvider."""
    
    def test_source_type(self):
        """Test du type de source."""
        provider = PDFProvider()
        assert provider.source_type == SourceType.PDF
    
    def test_initialization_defaults(self):
        """Test des valeurs par défaut."""
        provider = PDFProvider()
        
        assert provider.chunk_by_page is False
        assert provider.min_content_length == 50
    
    def test_initialization_custom(self):
        """Test avec valeurs personnalisées."""
        provider = PDFProvider(
            chunk_by_page=True,
            min_content_length=100,
        )
        
        assert provider.chunk_by_page is True
        assert provider.min_content_length == 100
    
    def test_extract_file_not_found(self):
        """Test erreur fichier non trouvé."""
        provider = PDFProvider()
        
        with pytest.raises(FileNotFoundError):
            list(provider.extract("/non/existent/file.pdf"))
    
    def test_extract_not_pdf(self, tmp_path):
        """Test erreur fichier non PDF."""
        # Créer un fichier texte
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("Not a PDF")
        
        provider = PDFProvider()
        
        with pytest.raises(ValueError, match="Not a PDF"):
            list(provider.extract(str(txt_file)))


class TestBaseProvider:
    """Tests pour BaseProvider."""
    
    def test_to_document_conversion(self):
        """Test conversion vers DocumentCreate."""
        
        # Créer un provider concret pour le test
        class TestProvider(BaseProvider):
            @property
            def source_type(self):
                return SourceType.MANUAL
            
            def extract(self, source):
                yield ExtractedContent(
                    content="Test",
                    source_id="test:1",
                    metadata={"title": "Test Doc"},
                )
        
        provider = TestProvider()
        extracted = ExtractedContent(
            content="Test content",
            source_id="test:1",
            metadata={"title": "Test"},
        )
        
        doc = provider.to_document(extracted)
        
        assert doc.content == "Test content"
        assert doc.source_type == SourceType.MANUAL
        assert doc.source_id == "test:1"
