"""
Data Preprocessing Module (Member 1 - Step 1)
Cleans raw Leads.csv data: imputes missing values, encodes categories,
and preserves original categorical columns for downstream use.
"""
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and preprocesses the raw leads DataFrame.
    
    Returns a single DataFrame with:
    - Imputed numerical columns
    - Imputed categorical columns (originals preserved as-is)
    - Binary columns mapped to 0/1
    - One-hot encoded multi-class columns (originals ALSO preserved)
    """
    if df is None or df.empty:
        raise ValueError("Input DataFrame is None or empty.")

    df = df.copy()
    logger.info(f"Starting preprocessing on {len(df)} records with {df.shape[1]} columns.")

    # 1. Missing Value Imputation — Numerical Columns
    num_cols = ['TotalVisits', 'Total Time Spent on Website', 'Page Views Per Visit']
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            median_val = df[col].median()
            n_missing = df[col].isna().sum()
            if n_missing > 0:
                logger.info(f"Imputing {n_missing} missing values in '{col}' with median={median_val:.2f}")
            df[col] = df[col].fillna(median_val)
        else:
            logger.warning(f"Expected numerical column '{col}' not found in data.")

    # 2. Missing Value Imputation — Categorical Columns
    cat_cols_to_impute = ['Specialization', 'How did you hear about X Education', 'Lead Profile', 'City']
    for col in cat_cols_to_impute:
        if col in df.columns:
            df[col] = df[col].fillna('Select/Unknown')
            df[col] = df[col].replace('Select', 'Select/Unknown')

    # 3. Binary categorical mapping (Yes/No to 1/0)
    binary_cols = [
        'Do Not Email', 'Do Not Call', 'Search', 'Magazine', 'Newspaper Article',
        'X Education Forums', 'Newspaper', 'Digital Advertisement',
        'Through Recommendations', 'Receive More Updates About Our Courses',
        'Update me on Supply Chain Content', 'Get updates on DM Content',
        'I agree to pay the amount through cheque', 'A free copy of Mastering The Interview'
    ]
    for col in binary_cols:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: 1 if str(x).strip().lower() == 'yes' else 0)

    # 4. One-Hot Encoding for multi-class variables
    #    IMPORTANT: We keep the original columns so downstream modules
    #    (priority_queue, pipeline export) can access raw string values.
    multiclass_cols = ['Lead Origin', 'Lead Source', 'Last Activity',
                       'What is your current occupation', 'Last Notable Activity']

    for col in multiclass_cols:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')

    # Generate one-hot columns with a prefix, keeping originals intact
    dummies = pd.get_dummies(df[multiclass_cols], columns=multiclass_cols,
                             drop_first=True, dtype=int)

    # Concatenate: original df (with raw categorical columns preserved) + one-hot columns
    df_encoded = pd.concat([df, dummies], axis=1)

    logger.info(f"Preprocessing complete. Output shape: {df_encoded.shape}")
    return df_encoded
