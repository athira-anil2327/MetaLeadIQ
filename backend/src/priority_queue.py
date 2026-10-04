"""
Priority Queue Construction (Member 3 - Step 3)
Sorts leads by Decayed Score (desc) then Meta CPC (asc) and exports to JSON.
"""
import logging
import json
import os
import pandas as pd

logger = logging.getLogger(__name__)


def build_priority_queue(df: pd.DataFrame,
                         output_path: str = 'backend/data/priority_queue.json') -> pd.DataFrame:
    """
    Constructs the prioritized leads queue.
    Sorts by:
    1. decayed_score (descending) — highest priority leads first
    2. meta_cpc (ascending) — cheaper leads break ties

    Saves queue to priority_queue.json with all required fields.
    """
    required_cols = ['decayed_score', 'meta_cpc']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing from DataFrame.")

    logger.info("--- Constructing Priority Queue (Member 3) ---")

    # Sort: decayed_score (descending), meta_cpc (ascending)
    sorted_df = df.sort_values(
        by=['decayed_score', 'meta_cpc'],
        ascending=[False, True]
    ).reset_index(drop=True)

    # Assign rank index (1-indexed)
    sorted_df['rank_index'] = sorted_df.index + 1

    # Define columns to export — includes ALL fields needed by frontend and API
    json_cols = [
        # Identifiers
        'Prospect ID', 'Lead Number', 'rank_index',
        # Scores & Status
        'base_score', 'base_probability', 'calibrated_probability',
        'decayed_score', 'hours_uncontacted', 'lead_status',
        # Confidence Intervals
        'confidence', 'prediction_lower', 'prediction_upper',
        # Meta Ad Attributes
        'meta_cpc', 'meta_ctr', 'meta_ad_placement', 'meta_audience_type',
        # Raw Categorical Fields (preserved from preprocessing)
        'Lead Source', 'Lead Origin', 'Last Activity',
        # Engagement Features
        'TotalVisits', 'Total Time Spent on Website', 'Page Views Per Visit',
        # Target
        'Converted',
        # Timestamp
        'created_at',
    ]

    # Keep only columns that exist in the DataFrame
    save_cols = [col for col in json_cols if col in sorted_df.columns]
    missing_cols = [col for col in json_cols if col not in sorted_df.columns]
    if missing_cols:
        logger.warning(f"Missing columns in output (skipped): {missing_cols}")

    # Convert to JSON records
    records = sorted_df[save_cols].to_dict(orient='records')

    # Save to disk
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    try:
        with open(output_path, 'w') as f:
            json.dump(records, f, indent=2)
        logger.info(f"Priority queue saved to {output_path} with {len(records)} leads.")
    except PermissionError:
        logger.error(f"Permission denied writing to {output_path}.")
        raise

    return sorted_df
