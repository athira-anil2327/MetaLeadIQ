# 🎯 MetaLeadIQ: Intelligent Lead Scoring System

**MetaLeadIQ** is a machine learning platform designed to help sales teams automatically prioritize incoming sales leads[cite: 1, 2]. 

In modern digital marketing, running lead campaigns on platforms like Facebook and Instagram generates large volumes of potential customers[cite: 1, 2]. However, only a small fraction of these leads actually convert into buying customers[cite: 1]. Without an intelligent system, sales reps waste time calling low-quality leads while high-value prospects go uncontacted and lose interest[cite: 1].

MetaLeadIQ solves this by taking the public Kaggle Leads dataset, enriching it with simulated Meta advertising metrics (such as ad costs, click-through rates, and audience sizes), and using machine learning to generate accurate, dynamic lead scores[cite: 1, 2]. Everything is delivered through an easy-to-use web dashboard so sales teams instantly know who to call first[cite: 1, 2].

---

## ⚡ System Features & Workflow

* **Base Lead Scoring (0–100):** Evaluates every incoming lead's campaign origin and web behavior to output an initial quality score from 0 to 100[cite: 1, 2].
* **Dynamic Time-Decay Engine:** Models customer interest over time[cite: 1]. If a lead remains uncontacted, their score automatically drops over hours and days, shifting their category from **Hot** 🔴 to **Warm** 🟠 to **Cold** 🔵[cite: 1, 2].
* **Optimal Lead Ranking:** Automatically filters out useless data columns and ranks all leads in exact order from highest to lowest likelihood of buying[cite: 1].
* **Prediction Confidence Guarantees:** Includes statistical safety bounds so sales reps know whether the AI is highly confident or uncertain about a lead's score[cite: 1].
* **Interactive Sales Dashboard:** A user-friendly web interface featuring searchable tables, campaign performance analytics, countdown timers, and individual lead profiles[cite: 1, 2].

---

## 👥 Team Task Division

| Member | Module Focus | Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | **Data & Base Scoring Engine** | Clean `Leads.csv`, generate synthetic Meta ad metadata (CTR, CPC, placements), and build the baseline 0–100 lead scoring model[cite: 1, 2]. |
| **Member 2** | **Time Decay & Expiration Logic** | Build the time-tracking survival model that automatically lowers lead scores over uncontacted hours and shifts statuses (Hot/Warm/Cold)[cite: 1, 2]. |
| **Member 3** | **Column Filtering & Lead Ranking** | Filter out non-essential dataset features and build the ranking engine that sorts leads in priority order for sales reps[cite: 1]. |
| **Member 4** | **Confidence Safety & Dashboard UI** | Perform probability calibration, calculate prediction confidence bounds, build the full web dashboard app, and integrate everyone's backend code[cite: 1, 2]. |

---

## 🛠️ Tools & Technologies Used

* **Programming Language:** Python
* **Data Processing & ML:** Pandas, NumPy, Scikit-Learn, SciPy
* **Web App & UI:** Streamlit / Plotly Dash
* **Backend API:** FastAPI

---

## 💡 What Are The Setup Commands? (Explained)

When setting up Python code from GitHub:
* **`git clone ...`** — Downloads all project files from GitHub to your computer.
* **`cd MetaLeadIQ`** — Opens the project folder in your terminal.
* **`pip install -r requirements.txt`** — Downloads all necessary Python libraries (Pandas, Scikit-Learn, Dash/Streamlit) at once.
* **`python app.py`** — Runs the main script to start the web dashboard app on your local browser.

*(Note: Make sure `Leads.csv` downloaded from Kaggle is saved inside the `MetaLeadIQ` folder!)[cite: 1]*

---

## 🚀 Complete Setup & Launch Commands

Run these exact terminal commands in order:

```bash
# 1. Download and enter the repository
git clone [https://github.com/your-username/MetaLeadIQ.git](https://github.com/your-username/MetaLeadIQ.git)
cd MetaLeadIQ

# 2. Install required Python packages
pip install -r requirements.txt

# 3. Launch the web dashboard app
python app.py
