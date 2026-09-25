# Lead Scoring System Project - Memory File

This file serves as the single source of truth for the Lead Scoring System project. It contains all requirements, formulas, and architectural components compiled from the project guidelines.

---

## 📅 System Architecture & Data Flow
The system processes data end-to-end through the following steps:
$$\text{Raw Data (Leads.csv)} \xrightarrow{\text{Member 1}} \text{Base Score} \xrightarrow{\text{Member 2}} \text{Decayed Score} \xrightarrow{\text{Member 3}} \text{Priority Queue (JSON)} \xrightarrow{\text{Member 4}} \text{Dashboard UI & Confidence Check}$$

---

## 👥 Roles & Responsibilities

### 🔴 Member 1: Data Enrichment & Base Scoring Engine
* **Step 1: Raw Data Cleaning & Preprocessing** (`src/data_preprocessing.py`)
  * **Input:** Raw Kaggle `Leads.csv` file.
  * **Missing Value Imputation:**
    * Compute numerical column medians (e.g., `TotalVisits`, `Total Time Spent on Website`, `Page Views Per Visit`) and fill missing values.
    * Impute categorical columns (e.g., `Specialization`, `How did you hear about X Education`) with the string `'Select/Unknown'`.
  * **Feature Encoding:**
    * Map binary categorical features (`Do Not Email`, `Do Not Call`) to integer values (`1` for Yes, `0` for No).
    * Apply One-Hot Encoding (`pd.get_dummies()`) to multi-class variables like `Lead Origin` and `Lead Source`.
* **Step 2: Synthetic Meta Advertising Matrix** (`src/synthetic_meta_generator.py`)
  * Use `numpy.random` to generate four aligned Meta ad channels for all rows in the dataset:
    * `meta_cpc`: Cost-Per-Click values drawn from a uniform distribution (0.50 to 4.50).
    * `meta_ctr`: Click-Through Rate percentages drawn from a beta distribution (simulating real ad engagement between 1% and 6%).
    * `meta_ad_placement`: Categorical sampling from `['Facebook_Feed', 'Instagram_Stories', 'Instagram_Reels', 'Audience_Network']`.
    * `meta_audience_type`: Categorical sampling from `['Broad', 'Lookalike_1pct', 'Retargeting']`.
  * **Output:** Save merged clean dataset as `data/processed_leads_meta.csv`.
* **Step 3: Base Probability Model Training** (`src/train_base_model.py`)
  * **Model Training:** Train an XGBoost Classifier or Logistic Regression model on 80% of the processed data to predict the target binary variable `Converted`.
  * **Score Scaling:** Transform predicted probabilities $P(Y = 1|X)$ into a normalized integer range:
    $$\text{Base Score} = \text{round}(P(Y = 1|X) \times 100)$$
  * **Artifact Generation:** Save the trained model binary (`artifacts/base_model.pkl`) and preprocessing pipeline (`artifacts/scaler.pkl`).

### 🟠 Member 2: Time-Decay Engine & Dynamic Expiration Logic
* **Step 1: Timestamp & Elapsed Time Engine** (`src/time_decay.py`)
  * **Input Tracking:** Capture the creation timestamp `created_at` for each lead alongside the current system execution timestamp `current_time`.
  * **Time Difference Metric:** Calculate total elapsed uncontacted hours:
    $$\Delta t = \frac{\text{current\_time} - \text{created\_at}}{3600 \text{ seconds}}$$
* **Step 2: Exponential Decay & Half-Life Mathematics**
  * **Decay Constant ($\lambda$):** Set a parameter based on expected lead turnover (e.g., half-life $t_{1/2} = 24$ hours).
    $$\lambda = \frac{\ln(2)}{t_{1/2}} \approx 0.02887 \text{ hour}^{-1}$$
  * **Dynamic Score Reduction:** Multiply Member 1's Base Score ($S_0$) by the decay factor:
    $$S(t) = S_0 \times e^{-\lambda \times \Delta t}$$
* **Step 3: State Machine & Classification Thresholding**
  * **Status Assignment:** Pass $S(t)$ through a decision tree to determine status codes:
    * **Hot (Red 🔴):** $S(t) \ge 70$
    * **Warm (Orange 🟠):** $40 \le S(t) < 70$
    * **Cold (Blue 🔵):** $S(t) < 40$
  * **Output Function:** Return a dictionary object containing `decayed_score`, `time_elapsed_hours`, and `lead_status`.

### 🟡 Member 3 (YOUR ROLE): Feature Filtering & Optimal Priority Ranking
* **Step 1: Dimensionality Reduction & Feature Selection** (`src/feature_selection.py`)
  * **Feature Importance Evaluation:** Calculate SHAP (SHapley Additive exPlanations) values and Random Forest Feature Importance scores.
  * **Pruning:** Drop redundant features with near-zero variance or correlation below 0.02 against conversion outcomes (e.g., `Search`, `Magazine`, duplicate lead activity flags).
* **Step 2: Model Performance & ROC-AUC Optimization** (`src/ranker.py`)
  * **AUC Validation:** Evaluate output scores using the Area Under the Receiver Operating Characteristic Curve (ROC-AUC) metric.
  * **Threshold Adjustment:** Fine-tune score cutoffs to maximize precision at top ranks, ensuring sales reps focus on top-decile prospects.
* **Step 3: Priority Queue Construction** (`src/priority_queue.py`)
  * **Sorting Algorithm:** Take the live stream of leads coming from Member 2's time-decay calculations and apply a multi-level sort:
    $$\text{Rank Index} = \text{Sort}(\text{Decayed Score} \downarrow, \text{Meta CPC} \uparrow)$$
    *(Sort descending by decayed score, then ascending by Meta CPC).*
  * **Output File:** Generate a structured priority output frame (`data/priority_queue.json`) ready for real-time app streaming.

### 🟢 Member 4: Prediction Confidence & Dashboard Interface
* **Step 1: Model Calibration & Uncertainty Intervals** (`src/confidence_checker.py`)
  * **Probability Calibration:** Pass raw predicted probabilities through Isotonic Regression or Platt Scaling (`CalibratedClassifierCV` in Scikit-Learn) to align probabilities with true conversion rates.
  * **Confidence Bounds:** Compute 95% binomial confidence intervals for predicted probability $p$ over sample size $n$:
    $$\text{CI} = p \pm 1.96 \times \sqrt{\frac{p(1 - p)}{n}}$$
  * **Confidence Labeling:** Classify intervals as:
    * **High Confidence:** Margin $\pm \le 5\%$
    * **Moderate Confidence:** Margin $5\% < \pm \le 12\%$
    * **Uncertain:** Margin $\pm > 12\%$
* **Step 2: Interactive Web Application UI** (`app.py`)
  * **Layout Construction (Streamlit or Plotly Dash):**
    * **Header Metric Cards:** Display live total leads, average conversion score, and total "Hot" leads.
    * **Interactive Priority Table:** Display Member 3's ranked leads featuring Member 2's dynamic status badges (**Hot** / **Warm** / **Cold**) and search/filter sliders.
    * **Analytics Charts:** Plot Meta Campaign ROI, conversion rate by ad placement (Reels vs. Feed), and score decay over time.
    * **Lead Inspector Modal:** Display detailed view of lead activity, calculated confidence score bounds, and contact actions when clicking a row.
* **Step 3: System Pipeline Integration**
  * Import modules from Members 1, 2, and 3 into `app.py` to trigger the end-to-end execution flow.
