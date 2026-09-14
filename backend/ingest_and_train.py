import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import joblib
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
import os

def preprocess_data(df):
    # Drop identifier columns if they exist
    cols_to_drop = ['Prospect ID', 'Lead Number']
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns], errors='ignore')
    
    # Handle missing values
    # Replace 'Select' with NaN (common in this dataset)
    df = df.replace('Select', np.nan)
    
    # Separate features and target
    if 'Converted' not in df.columns:
        raise ValueError("Target column 'Converted' not found in dataset.")
        
    y = df['Converted']
    X = df.drop(columns=['Converted'])
    
    # Identify numerical and categorical columns
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns
    cat_cols = X.select_dtypes(include=['object', 'category']).columns
    
    # Impute missing values
    X[num_cols] = X[num_cols].fillna(X[num_cols].median())
    X[cat_cols] = X[cat_cols].fillna('Unknown')
    
    # One-hot encode categorical features
    X_encoded = pd.get_dummies(X, columns=cat_cols, drop_first=True)
    
    return X_encoded, y, num_cols, cat_cols

def train_and_prune():
    data_path = 'Leads.csv'
    if not os.path.exists(data_path):
        if os.path.exists('../Leads.csv'):
            data_path = '../Leads.csv'
            
    if not os.path.exists(data_path):
        print(f"Error: Leads.csv not found. Please place it in the same directory.")
        # Create dummy data for testing purposes if file is missing
        print("Generating dummy data for testing...")
        df = pd.DataFrame({
            'Lead Origin': ['API', 'Landing Page Submission', 'Lead Add Form', 'API', 'Lead Add Form'] * 200,
            'Specialization': ['Unknown', 'Business Administration', 'Marketing', 'Unknown', 'Finance'] * 200,
            'TotalVisits': [0, 5, 2, 0, 3] * 200,
            'Total Time Spent on Website': [0, 674, 1532, 0, 300] * 200,
            'Page Views Per Visit': [0.0, 2.5, 2.0, 0.0, 1.0] * 200,
            'Converted': [0, 1, 1, 0, 1] * 200
        })
    else:
        df = pd.read_csv(data_path)
    
    X, y, num_cols, cat_cols = preprocess_data(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training initial model to compute SHAP values...")
    # Base XGBoost model using second-order gradients (binary:logistic)
    base_xgb = xgb.XGBClassifier(
        objective='binary:logistic',
        tree_method='hist',
        random_state=42,
        eval_metric='logloss'
    )
    base_xgb.fit(X_train, y_train)
    
    print("Calculating SHAP values...")
    # Step 1: Use shap to calculate Shapley values and prune
    explainer = shap.TreeExplainer(base_xgb)
    shap_values = explainer.shap_values(X_train)
    
    # Calculate mean absolute SHAP values for each feature
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': mean_abs_shap
    }).sort_values('importance', ascending=False)
    
    # Prune down to top 42 most impactful features
    top_k = min(42, len(feature_importance))
    top_features = feature_importance['feature'].head(top_k).tolist()
    print(f"Selected Top {top_k} features.")
    
    X_train_pruned = X_train[top_features]
    X_test_pruned = X_test[top_features]
    
    print("Training model on pruned features...")
    # Step 2: Train XGBoost classifier using second-order gradients on pruned set
    final_xgb = xgb.XGBClassifier(
        objective='binary:logistic',
        tree_method='hist',
        random_state=42,
        eval_metric='logloss'
    )
    
    # Step 3: Apply Platt Scaling using CalibratedClassifierCV
    print("Applying Platt Scaling for true probabilities...")
    calibrated_clf = CalibratedClassifierCV(
        estimator=final_xgb,
        method='sigmoid', # Platt Scaling
        cv=5
    )
    
    calibrated_clf.fit(X_train_pruned, y_train)
    
    # Save the artifacts
    os.makedirs('models', exist_ok=True)
    joblib.dump(calibrated_clf, 'models/calibrated_xgb_model.pkl')
    joblib.dump(top_features, 'models/top_features.pkl')
    # Save columns info for inference
    joblib.dump({'num_cols': num_cols, 'cat_cols': cat_cols, 'all_train_cols': X.columns}, 'models/preprocessing_info.pkl')
    
    print("Model and encoders exported successfully to the 'models' directory.")

if __name__ == "__main__":
    train_and_prune()
