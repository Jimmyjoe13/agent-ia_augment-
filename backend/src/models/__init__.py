"""Models module for RAG Agent IA - Pydantic data models."""

from src.models.document import Document, DocumentCreate, DocumentMetadata, SourceType
from src.models.conversation import (
    Conversation,
    ConversationCreate,
    FeedbackFlag,
    FlagType,
)
from src.models.api_key import (
    ApiKeyScope,
    ApiKeyCreate,
    ApiKeyResponse,
    ApiKeyInfo,
    ApiKeyValidation,
    ApiKeyUsageStats,
)

__all__ = [
    # Document models
    "Document",
    "DocumentCreate", 
    "DocumentMetadata",
    "SourceType",
    # Conversation models
    "Conversation",
    "ConversationCreate",
    "FeedbackFlag",
    "FlagType",
    # API Key models
    "ApiKeyScope",
    "ApiKeyCreate",
    "ApiKeyResponse",
    "ApiKeyInfo",
    "ApiKeyValidation",
    "ApiKeyUsageStats",
]
