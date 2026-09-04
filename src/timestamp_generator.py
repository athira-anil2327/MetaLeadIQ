import pandas as pd
import numpy as np


INPUT_FILE = "data/Leads.csv"
OUTPUT_FILE = "data/leads_with_timestamps.csv"


def add_created_at(input_file, output_file):
    df = pd.read_csv(input_file)

    current_time = pd.Timestamp.now()

    np.random.seed(42)

    elapsed_hours = np.random.uniform(
        0,
        72,
        size=len(df)
    )

    df["created_at"] = (
        current_time
        - pd.to_timedelta(elapsed_hours, unit="h")
    )

    df["created_at"] = df["created_at"].dt.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    df.to_csv(output_file, index=False)

    print(f"Created timestamps for {len(df)} leads.")
    print(f"Saved file: {output_file}")


if __name__ == "__main__":
    add_created_at(INPUT_FILE, OUTPUT_FILE)