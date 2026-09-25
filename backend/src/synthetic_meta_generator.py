"""
Synthetic Meta Advertising Matrix Generator (Member 1 - Step 2)
Simulates Meta ad channel columns for all leads in the dataset.
"""
import logging
import os
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def generate_meta_advertising_data(df: pd.DataFrame, seed: int = 42,
                                   output_path: str = 'backend/data/processed_leads_meta.csv') -> pd.DataFrame:
    """
    Simulates four Meta ad columns for all leads:
    - meta_cpc: Cost-Per-Click from Uniform(0.50, 4.50)
    - meta_ctr: Click-Through Rate from Beta distribution (1% to 6%)
    - meta_ad_placement: Categorical placement
    - meta_audience_type: Categorical audience type

    Uses a local RNG to avoid mutating global random state.
    """
    if df is None or df.empty:
        raise ValueError("Input DataFrame is None or empty.")

    df = df.copy()
    n_rows = len(df)
    rng = np.random.default_rng(seed)

    logger.info(f"Simulating Meta advertising data for {n_rows} leads.")

    # 1. Cost-Per-Click: Uniform distribution (0.50 to 4.50)
    df['meta_cpc'] = rng.uniform(0.50, 4.50, size=n_rows)

    # 2. Click-Through Rate: Beta distribution scaled to 1%–6%
    beta_vals = rng.beta(2, 5, size=n_rows)
    df['meta_ctr'] = 1.0 + 5.0 * beta_vals

    # 3. Categorical placement
    placements = ['Facebook_Feed', 'Instagram_Stories', 'Instagram_Reels', 'Audience_Network']
    df['meta_ad_placement'] = rng.choice(placements, size=n_rows)

    # 4. Categorical audience type
    audiences = ['Broad', 'Lookalike_1pct', 'Retargeting']
    df['meta_audience_type'] = rng.choice(audiences, size=n_rows)

    # Save to disk
    if output_path:
        out_dir = os.path.dirname(output_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        try:
            df.to_csv(output_path, index=False)
            logger.info(f"Meta advertising data saved to {output_path}")
        except PermissionError:
            logger.error(f"Permission denied writing to {output_path}. File may be open in another app.")
            raise

    return df
