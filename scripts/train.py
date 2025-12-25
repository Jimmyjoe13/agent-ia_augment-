#!/usr/bin/env python3
"""
Script de Training
===================

Traite la queue de ré-injection pour enrichir le Vector Store
avec les bonnes réponses des conversations.

Usage:
    python -m scripts.train --limit 100
    python -m scripts.train --continuous --interval 300
"""

import argparse
import time
import sys
from pathlib import Path

# Ajouter src au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config.logging_config import setup_logging, get_logger
from src.services import FeedbackService


def main() -> None:
    """Point d'entrée principal du script."""
    setup_logging()
    logger = get_logger("training")
    
    parser = argparse.ArgumentParser(
        description="Traitement de la queue de training",
    )
    
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Nombre maximum de documents à traiter par batch",
    )
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Mode continu (exécution périodique)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Intervalle en secondes entre les exécutions (mode continu)",
    )
    
    args = parser.parse_args()
    
    feedback_service = FeedbackService()
    
    if args.continuous:
        logger.info(
            "Starting continuous training mode",
            interval=args.interval,
            limit=args.limit,
        )
        
        while True:
            try:
                process_batch(feedback_service, args.limit, logger)
                logger.info(f"Sleeping for {args.interval} seconds...")
                time.sleep(args.interval)
            except KeyboardInterrupt:
                logger.info("Training interrupted by user")
                break
            except Exception as e:
                logger.error("Training error", error=str(e))
                time.sleep(60)  # Attendre avant de réessayer
    else:
        process_batch(feedback_service, args.limit, logger)


def process_batch(feedback_service: FeedbackService, limit: int, logger) -> None:
    """Traite un batch de données de training."""
    logger.info("Processing training queue", limit=limit)
    
    created = feedback_service.process_training_queue(limit)
    
    print("\n" + "=" * 50)
    print("📊 RÉSULTAT DU TRAINING")
    print("=" * 50)
    print(f"📝 Documents réinjectés : {created}")
    print("=" * 50)
    
    # Afficher les statistiques
    stats = feedback_service.get_analytics(days=7)
    print("\n📈 Statistiques (7 derniers jours):")
    print(f"   Conversations totales : {stats.get('total_conversations', 0)}")
    print(f"   Score moyen          : {stats.get('avg_feedback_score', 'N/A')}")
    print(f"   En attente           : {stats.get('flagged_count', 0)}")


if __name__ == "__main__":
    main()
