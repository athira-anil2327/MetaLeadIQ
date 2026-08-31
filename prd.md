# Product Requirements Document (PRD): MetaLeadIQ

## 1. Product Overview
**MetaLeadIQ** is an intelligent, machine-learning-driven lead scoring platform designed to assist sales teams in prioritizing incoming sales leads. By dynamically scoring and categorizing leads, the platform ensures that sales representatives focus their time on the highest-value prospects before they lose interest.

## 2. Target Audience
* **Sales Representatives:** Users who need to know exactly who to call next, viewing prioritized lead lists and individual lead profiles.
* **Sales Managers:** Users who oversee campaign performance, monitor team efficiency, and track the overall health of the lead pipeline.

## 3. Problem Statement
Digital marketing campaigns on platforms like Meta (Facebook/Instagram) generate large volumes of potential customers, but only a small fraction convert. Without an intelligent prioritization system, sales reps waste time on low-quality or cold leads while high-value prospects go uncontacted.

## 4. Key Features & Requirements

### 4.1. Base Lead Scoring Engine
* The system must evaluate every incoming lead based on campaign origin and web behavior.
* Output an initial quality score ranging from 0 to 100.

### 4.2. Dynamic Time-Decay System
* Implement a time-tracking survival model that dynamically lowers a lead's score over time if left uncontacted.
* Automatically shift lead statuses through categories: **Hot** 🔴, **Warm** 🟠, and **Cold** 🔵.

### 4.3. Optimal Lead Ranking
* Automatically filter out non-essential data columns from the lead profile.
* Rank all leads in exact order from highest to lowest likelihood of purchasing.

### 4.4. Prediction Confidence Guarantees
* Perform probability calibration to provide statistical safety bounds.
* Display the AI's confidence level regarding a lead's score, helping reps understand if a prediction is highly confident or uncertain.

### 4.5. Interactive Sales Dashboard
* **Searchable Tables:** Easy filtering and searching of leads.
* **Analytics:** Visualizations for campaign performance (e.g., ad costs, CTR, audience sizes).
* **Countdown Timers:** Visual urgency indicators for Hot leads.
* **Lead Profiles:** Detailed view of individual lead data, behaviors, and Meta ad metadata.

## 5. Non-Functional Requirements
* **Usability:** The web dashboard must be user-friendly, responsive, and intuitive.
* **Performance:** Real-time or near real-time updates to lead scores as time decays.
* **Accuracy:** The underlying machine learning model should provide high-accuracy predictions.
