# 🚀 MetaLeadIQ — Setup & Installation Guide

This guide covers everything required to run **MetaLeadIQ** in both local development mode and real-time production webhook mode.

---

## 📋 Prerequisites

- **Node.js**: v18.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 to v3.14 ([Download Python](https://www.python.org/))
- **Git**: For cloning and branch workflows

---

## 📦 1. Frontend Setup

Install the frontend dependencies and launch the Vite development server:

```bash
# 1. Install npm dependencies
npm install

# 2. Run the Vite development server
npm run dev
```

The React dashboard will be accessible at:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🐍 2. Backend & Machine Learning Setup

Install the required Python scientific and API packages:

```bash
pip install pandas numpy scikit-learn xgboost shap fastapi uvicorn pydantic
```

---

## 🔄 3. Running Modes

### Mode A: Production Live API Mode (Recommended)

In this mode, the React dashboard connects directly to the FastAPI server and SQLite database on port 8000. New leads from Meta Webhooks or the dashboard are scored in real-time.

```bash
# Start the FastAPI Webhook & Inference Server
python -m uvicorn backend.server:app --port 8000 --reload
```

- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Docs (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Meta Webhook Endpoint**: `http://localhost:8000/api/webhook/meta`

### Mode B: Standalone Frontend Demo Mode

If you only want to showcase the UI without running the backend server:
- Just run `npm run dev`!
- The frontend automatically detects when the backend is offline and gracefully falls back to the pre-computed ML predictions stored in `src/data/mockData.ts`.
- Zero crashes, zero blank screens.

---

## ⚙️ 4. Re-training the ML Model

Whenever you want to retrain the XGBoost model on updated data or re-generate the mock datasets:

```bash
python backend/src/pipeline.py
```

This single command executes the entire pipeline:
1. **Data Preprocessing**: Imputes missing values and encodes categorical features while preserving raw columns.
2. **Meta Ads Generator**: Simulates CTR, CPC, placement, and audience attributes.
3. **Feature Selection**: Prunes low-variance/low-correlation columns using SHAP and Random Forests.
4. **Model Training**: Fits an XGBoost Classifier on the selected features.
5. **Validation Evaluation**: Computes honest validation ROC-AUC and top-decile precision.
6. **Platt Calibration**: Fits probability calibration to align model outputs with true conversion rates.
7. **Time-Decay Engine**: Applies exponential half-life decay ($t_{1/2} = 24\text{h}$) to simulate contact urgency.
8. **Confidence Intervals**: Computes 95% binomial confidence bounds.
9. **Priority Queue Export**: Generates `backend/data/priority_queue.json` and updates `src/data/mockData.ts`.
10. **Database Reseed**: Pre-populates `backend/data/metaleadiq.db`.

---

## 🧪 5. Testing the Real-Time Meta Webhook

Send a test lead payload to verify real-time scoring:

```bash
python -c "
import urllib.request, json
payload = json.dumps({
    'name': 'Sarah Connor',
    'email': 'sarah@skynet.ai',
    'phone': '+1 (555) 019-2834',
    'lead_source': 'Instagram',
    'lead_origin': 'Lead Add Form',
    'occupation': 'Working Professional',
    'last_activity': 'SMS Sent',
    'total_visits': 5,
    'time_on_website': 14.2,
    'placement': 'Reels'
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/api/webhook/meta', data=payload, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
print(json.loads(res.read()))
"
```
