from datetime import datetime
import math
import numpy as np

HALF_LIFE_HOURS = 24
DECAY_CONSTANT = math.log(2) / HALF_LIFE_HOURS

def calculate_elapsed_hours(created_at, current_time):
    time_difference = current_time - created_at
    elapsed_hours = time_difference.total_seconds() / 3600
    return elapsed_hours



def calculate_decayed_score(base_score, elapsed_hours):
    decay_factor = math.exp(-DECAY_CONSTANT * elapsed_hours)
    decayed_score = round(base_score * decay_factor, 2)
    return decayed_score

def classify_lead(decayed_score):
    if decayed_score >= 70:
        return "Hot"
    elif decayed_score >= 40:
        return "Warm"
    else:
        return "Cold"

def apply_time_decay(base_score, created_at, current_time):
    elapsed_hours = calculate_elapsed_hours(created_at, current_time)

    decayed_score = calculate_decayed_score(
        base_score,
        elapsed_hours
    )

    lead_status = classify_lead(decayed_score)

    return {
        "decayed_score": round(decayed_score, 2),
        "time_elapsed_hours": round(elapsed_hours, 2),
        "lead_status": lead_status
    }    


if __name__ == "__main__":

    import pandas as pd

    input_file = "data/leads_with_timestamps.csv"

    df = pd.read_csv(input_file)

    df["created_at"] = pd.to_datetime(df["created_at"])

    current_time = pd.Timestamp.now()

    df["elapsed_hours"] = (
        (current_time - df["created_at"]).dt.total_seconds() / 3600
    )

    print("Total leads:", len(df))
    print("Current time:", current_time)

    print("\nFirst 5 elapsed times:")
    print(df[["created_at", "elapsed_hours"]].head())

    base_score = 80

df["decayed_score"] = (
    base_score
    * np.exp(-DECAY_CONSTANT * df["elapsed_hours"])
)

df["decayed_score"] = df["decayed_score"].round(2)

df["lead_status"] = df["decayed_score"].apply(classify_lead)

print("\nFirst 5 results:")

print(
    df[
        ["created_at", "elapsed_hours", "decayed_score", "lead_status"]
    ].head()
)

output_file = "data/leads_with_decay.csv"

df.to_csv(output_file, index=False)

print("\nSaved results to:", output_file)