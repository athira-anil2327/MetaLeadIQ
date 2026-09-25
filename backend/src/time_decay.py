"""
Time-Decay Engine & Dynamic Expiration Logic (Member 2)
Computes exponential score decay and assigns Hot/Warm/Cold status.
"""
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def calculate_time_decay(df: pd.DataFrame, half_life_hours: float = 24.0,
                         seed: int = 42) -> pd.DataFrame:
    """
    Computes time-decay and status codes for leads.
    - Simulates 'hours_uncontacted' if not already present
    - Applies exponential decay: S(t) = S_0 * exp(-lambda * dt)
    - Assigns status: Hot (>= 70), Warm (40-70), Cold (< 40)
    """
    if half_life_hours <= 0:
        raise ValueError(f"half_life_hours must be positive, got {half_life_hours}")
    if 'base_score' not in df.columns:
        raise ValueError("Column 'base_score' is required but missing from DataFrame.")

    df = df.copy()
    rng = np.random.default_rng(seed)

    logger.info(f"Running time-decay engine (half-life={half_life_hours}h) on {len(df)} leads.")

    # 1. Simulate uncontacted hours if not present
    if 'hours_uncontacted' not in df.columns:
        logger.info("Simulating 'hours_uncontacted' (not present in data).")
        df['hours_uncontacted'] = rng.exponential(scale=20.0, size=len(df))
        df['hours_uncontacted'] = np.clip(df['hours_uncontacted'], 0.1, 120.0).round(1)
    else:
        logger.info("Using existing 'hours_uncontacted' column.")

    # Calculate created_at timestamp relative to current time
    current_time = datetime.now()
    if 'created_at' not in df.columns:
        df['created_at'] = df['hours_uncontacted'].apply(
            lambda h: (current_time - timedelta(hours=h)).isoformat()
        )

    # 2. Exponential Decay: lambda = ln(2) / half_life
    decay_constant = np.log(2) / half_life_hours

    # S(t) = S_0 * exp(-lambda * dt)
    df['decayed_score'] = df['base_score'] * np.exp(-decay_constant * df['hours_uncontacted'])
    df['decayed_score'] = np.round(df['decayed_score']).astype(int)

    # 3. Status Assignment (vectorized)
    conditions = [
        df['decayed_score'] >= 70,
        df['decayed_score'] >= 40,
    ]
    choices = ['Hot', 'Warm']
    df['lead_status'] = np.select(conditions, choices, default='Cold')

    status_counts = df['lead_status'].value_counts().to_dict()
    logger.info(f"Time decay applied. Status distribution: {status_counts}")

    return df
