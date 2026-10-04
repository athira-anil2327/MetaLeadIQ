"""
Model Performance & ROC-AUC Optimization (Member 3 - Step 2)
Evaluates model on held-out validation set and optimizes threshold.
"""
import logging
import numpy as np
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score

logger = logging.getLogger(__name__)


def evaluate_model_performance(y_true, y_prob) -> dict:
    """
    Evaluates output scores on the VALIDATION set only.
    Returns a dictionary of metrics.
    """
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)

    if len(np.unique(y_true)) < 2:
        logger.warning("y_true contains only one class. ROC-AUC is undefined.")
        return {'roc_auc': float('nan')}

    auc = roc_auc_score(y_true, y_prob)

    # Binary predictions at 0.5 threshold for additional metrics
    y_pred = (y_prob >= 0.5).astype(int)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    metrics = {
        'roc_auc': auc,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
    }

    logger.info(f"Validation ROC-AUC: {auc:.4f}")
    logger.info(f"Validation Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")

    return metrics


def optimize_threshold(y_true, y_prob, target_percentile: float = 0.90) -> float:
    """
    Finds the score cutoff for the top-decile (top 10%) of conversion prospects.
    Evaluates precision at that threshold.
    """
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)

    cutoff = np.percentile(y_prob, target_percentile * 100)
    top_decile_mask = y_prob >= cutoff

    n_top = np.sum(top_decile_mask)
    if n_top == 0:
        logger.warning("No leads above the top-decile cutoff.")
        return cutoff

    precision = np.mean(y_true[top_decile_mask])

    logger.info(f"Top-Decile Cutoff (Probability): {cutoff:.4f} (Score: {cutoff * 100:.2f})")
    logger.info(f"Top-Decile Size: {n_top} leads")
    logger.info(f"Top-Decile Precision: {precision * 100:.2f}%")

    return cutoff
