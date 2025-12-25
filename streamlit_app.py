"""
Streamlit UI
=============

Interface utilisateur interactive pour tester le système RAG.

Usage:
    streamlit run streamlit_app.py
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st

from src.config.logging_config import setup_logging
from src.services import RAGEngine, FeedbackService
from src.models.conversation import FlagType

# Configuration de la page
st.set_page_config(
    page_title="RAG Agent IA",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
)

# CSS personnalisé
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
    }
    .source-card {
        background: #f0f2f6;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
    }
    .user-message {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
    }
    .assistant-message {
        background: #f3e5f5;
        border-left: 4px solid #9c27b0;
    }
</style>
""", unsafe_allow_html=True)


def init_session_state():
    """Initialise l'état de la session Streamlit."""
    if "rag_engine" not in st.session_state:
        setup_logging()
        st.session_state.rag_engine = RAGEngine()
        st.session_state.feedback_service = FeedbackService()
    
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    if "last_conversation_id" not in st.session_state:
        st.session_state.last_conversation_id = None


def render_sidebar():
    """Affiche la sidebar avec les options."""
    with st.sidebar:
        st.markdown("## ⚙️ Configuration")
        
        # Options de recherche
        st.markdown("### 🔍 Recherche")
        use_web = st.checkbox(
            "Recherche Web (Perplexity)",
            value=True,
            help="Activer la recherche web en temps réel",
        )
        
        # Session
        st.markdown("### 🔄 Session")
        if st.button("🆕 Nouvelle session"):
            st.session_state.rag_engine.new_session()
            st.session_state.messages = []
            st.session_state.last_conversation_id = None
            st.success("Nouvelle session créée!")
        
        st.info(f"Session: `{st.session_state.rag_engine.session_id[:8]}...`")
        
        # Statistiques
        st.markdown("### 📊 Statistiques")
        try:
            stats = st.session_state.feedback_service.get_analytics(days=7)
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Conversations", stats.get("total_conversations", 0))
            with col2:
                avg = stats.get("avg_feedback_score")
                st.metric("Score moyen", f"{avg:.1f}/5" if avg else "N/A")
        except Exception:
            st.warning("Stats indisponibles")
        
        return use_web


def render_chat():
    """Affiche l'historique du chat."""
    for msg in st.session_state.messages:
        if msg["role"] == "user":
            st.markdown(f"""
            <div class="chat-message user-message">
                <strong>🧑 Vous:</strong><br>{msg["content"]}
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="chat-message assistant-message">
                <strong>🤖 Assistant:</strong><br>{msg["content"]}
            </div>
            """, unsafe_allow_html=True)
            
            # Afficher les sources si disponibles
            if msg.get("sources"):
                with st.expander("📚 Sources utilisées"):
                    for source in msg["sources"]:
                        st.markdown(f"""
                        <div class="source-card">
                            <strong>{source.source_type}</strong>
                            {f' | Score: {source.similarity_score:.2f}' if source.similarity_score else ''}
                            <br><small>{source.content_preview[:200]}...</small>
                        </div>
                        """, unsafe_allow_html=True)


def render_feedback():
    """Affiche le formulaire de feedback."""
    if st.session_state.last_conversation_id:
        st.markdown("---")
        st.markdown("### 📝 Évaluez cette réponse")
        
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            score = st.slider(
                "Score",
                min_value=1,
                max_value=5,
                value=4,
                help="1 = Mauvais, 5 = Excellent",
            )
        
        with col2:
            comment = st.text_input(
                "Commentaire (optionnel)",
                placeholder="Votre feedback...",
            )
        
        with col3:
            flag = st.checkbox("📥 Réinjecter", help="Ajouter au training")
        
        if st.button("Envoyer le feedback"):
            try:
                from uuid import UUID
                conv_id = UUID(st.session_state.last_conversation_id)
                
                st.session_state.feedback_service.add_feedback(
                    conv_id,
                    score,
                    comment if comment else None,
                )
                
                if flag:
                    st.session_state.feedback_service.flag_for_training(conv_id)
                
                st.success("✅ Feedback enregistré!")
                st.session_state.last_conversation_id = None
                
            except Exception as e:
                st.error(f"Erreur: {e}")


def main():
    """Point d'entrée principal de l'application Streamlit."""
    init_session_state()
    
    # Header
    st.markdown('<h1 class="main-header">🤖 RAG Agent IA</h1>', unsafe_allow_html=True)
    st.markdown("*Système de Retrieval-Augmented Generation personnalisé*")
    
    # Sidebar
    use_web = render_sidebar()
    
    # Zone principale
    tab1, tab2 = st.tabs(["💬 Chat", "📥 Ingestion"])
    
    with tab1:
        # Historique du chat
        render_chat()
        
        # Zone de saisie
        st.markdown("---")
        question = st.text_area(
            "Posez votre question",
            placeholder="Ex: Quelles sont mes compétences principales en Python?",
            height=100,
        )
        
        col1, col2 = st.columns([1, 4])
        with col1:
            submit = st.button("🚀 Envoyer", type="primary", use_container_width=True)
        
        if submit and question:
            # Ajouter le message utilisateur
            st.session_state.messages.append({
                "role": "user",
                "content": question,
            })
            
            # Générer la réponse
            with st.spinner("🔄 Recherche et génération..."):
                try:
                    response = st.session_state.rag_engine.query(
                        question,
                        use_web=use_web,
                    )
                    
                    # Ajouter la réponse
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": response.answer,
                        "sources": response.sources,
                    })
                    
                    # Sauvegarder l'ID pour le feedback
                    st.session_state.last_conversation_id = response.conversation_id
                    
                    # Afficher les métriques
                    cols = st.columns(4)
                    with cols[0]:
                        st.metric("⏱️ Temps", f"{response.metadata.get('elapsed_ms', 0)}ms")
                    with cols[1]:
                        st.metric("📚 Sources", response.metadata.get('vector_results', 0))
                    with cols[2]:
                        st.metric("🌐 Web", "✓" if response.metadata.get('web_search_used') else "✗")
                    with cols[3]:
                        total = response.metadata.get('tokens_input', 0) + response.metadata.get('tokens_output', 0)
                        st.metric("🔤 Tokens", total)
                    
                except Exception as e:
                    st.error(f"❌ Erreur: {e}")
            
            st.rerun()
        
        # Formulaire de feedback
        render_feedback()
    
    with tab2:
        st.markdown("### 📥 Ingestion de Données")
        
        # Ingestion GitHub
        st.markdown("#### 🐙 GitHub")
        github_repo = st.text_input(
            "Repository",
            placeholder="owner/repo",
        )
        if st.button("Ingérer GitHub"):
            if github_repo:
                with st.spinner("Ingestion en cours..."):
                    try:
                        from src.providers import GithubProvider
                        from src.services import VectorizationService
                        
                        provider = GithubProvider()
                        vectorization = VectorizationService()
                        stats = vectorization.ingest_from_provider(provider, [github_repo])
                        
                        st.success(f"✅ {stats.total_created} documents créés, {stats.total_skipped} ignorés")
                    except Exception as e:
                        st.error(f"Erreur: {e}")
        
        # Ingestion PDF
        st.markdown("#### 📄 PDF")
        uploaded_file = st.file_uploader("Uploader un PDF", type=["pdf"])
        if uploaded_file and st.button("Ingérer PDF"):
            with st.spinner("Extraction en cours..."):
                try:
                    from src.providers import PDFProvider
                    from src.services import VectorizationService
                    
                    provider = PDFProvider()
                    content = uploaded_file.read()
                    documents = list(provider.extract_from_bytes(content, uploaded_file.name))
                    
                    if documents:
                        vectorization = VectorizationService()
                        doc_creates = [provider.to_document(d) for d in documents]
                        stats = vectorization.ingest_documents(doc_creates)
                        st.success(f"✅ {stats.total_created} documents créés")
                    else:
                        st.warning("Aucun contenu extrait")
                        
                except Exception as e:
                    st.error(f"Erreur: {e}")
        
        # Ingestion manuelle
        st.markdown("#### ✍️ Texte Manuel")
        manual_text = st.text_area("Contenu", height=150)
        manual_title = st.text_input("Titre")
        if st.button("Ingérer Texte"):
            if manual_text:
                with st.spinner("Ingestion..."):
                    try:
                        from src.services import VectorizationService
                        from src.models.document import SourceType
                        
                        vectorization = VectorizationService()
                        result = vectorization.ingest_single(
                            content=manual_text,
                            source_type=SourceType.MANUAL.value,
                            source_id=f"manual:{manual_title or 'untitled'}",
                            metadata={"title": manual_title},
                        )
                        
                        if result:
                            st.success("✅ Document ingéré!")
                        else:
                            st.warning("Document déjà existant")
                            
                    except Exception as e:
                        st.error(f"Erreur: {e}")


if __name__ == "__main__":
    main()
