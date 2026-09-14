import pandas as pd
import joblib
import sqlite3
import random
import os

DB_PATH = os.getenv("DB_PATH", "leads.db")

def score_and_ingest():
    print("Loading ML artifacts...")
    try:
        model = joblib.load('models/calibrated_xgb_model.pkl')
        top_features = joblib.load('models/top_features.pkl')
        preprocessing_info = joblib.load('models/preprocessing_info.pkl')
    except Exception as e:
        print(f"Error loading models: {e}. Make sure you ran setup_and_train.py first.")
        return

    print("Loading Leads.csv...")
    if os.path.exists('Leads.csv'):
        df = pd.read_csv('Leads.csv')
    elif os.path.exists('../Leads.csv'):
        df = pd.read_csv('../Leads.csv')
    else:
        print("Leads.csv not found!")
        return

    # Keep a reference to the original DataFrame for names/ids
    original_df = df.copy()

    # Apply the exact same preprocessing
    cols_to_drop = ['Prospect ID', 'Lead Number']
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns], errors='ignore')
    df = df.replace('Select', None)
    
    # We don't need 'Converted' for inference, drop it if exists
    if 'Converted' in df.columns:
        df = df.drop(columns=['Converted'])

    num_cols = preprocessing_info['num_cols']
    cat_cols = preprocessing_info['cat_cols']
    all_train_cols = preprocessing_info['all_train_cols']

    # Keep only columns that were in the training set
    df = df[[c for c in df.columns if c in num_cols or c in cat_cols]]

    # Impute missing
    # In a real system, you'd save the training medians. Here we just recalculate for simplicity.
    df[num_cols] = df[num_cols].fillna(df[num_cols].median())
    df[cat_cols] = df[cat_cols].fillna('Unknown')

    # One-hot encode
    X_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=True)
    
    # Align columns with training data
    for col in all_train_cols:
        if col not in X_encoded.columns:
            X_encoded[col] = 0
            
    # Ensure exact order and only training columns
    X_encoded = X_encoded[all_train_cols]

    # Keep only the top features chosen by SHAP
    X_inference = X_encoded[top_features]

    print("Generating predictions...")
    # Predict probabilities (Platt Scaled)
    probabilities = model.predict_proba(X_inference)[:, 1]

    # Select the top 100 most probable leads to insert into the queue
    print("Ingesting into SQLite Database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Let's clear the dummy leads first
    cursor.execute("DELETE FROM leads")
    
    records = []
    # Take a sample of 50 uncontacted leads to populate the dashboard nicely
    for i in range(50):
        # We use Kaggle data or generate a synthetic name if not present
        # X Education doesn't have a name column, so we'll generate one or use Prospect ID prefix
        lead_name = f"Prospect {original_df['Prospect ID'].iloc[i][:8]}" if 'Prospect ID' in original_df.columns else f"Lead #{i+100}"
        
        base_score = float(probabilities[i])
        
        # We need TotalVisits to calculate the Wald CI
        total_visits = int(df['TotalVisits'].iloc[i]) if 'TotalVisits' in df.columns else random.randint(1, 10)
        
        # Simulate some hours uncontacted between 0.5 and 48 hours
        hours_uncontacted = round(random.uniform(0.5, 48.0), 1)
        
        # Simulate CPC
        cpc = round(random.uniform(0.5, 5.0), 2)
        
        records.append((lead_name, base_score, total_visits, hours_uncontacted, cpc, 0))

    cursor.executemany('''
        INSERT INTO leads (lead_name, base_score, total_visits, hours_uncontacted, cpc, contacted)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', records)
    
    conn.commit()
    conn.close()
    
    print(f"Successfully scored and inserted 50 real leads into the database!")

if __name__ == "__main__":
    score_and_ingest()
