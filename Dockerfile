FROM python:3.10-slim

WORKDIR /app

# Install build dependencies for xgboost etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/

# Expose FastAPI port
EXPOSE 8000

# Run the ingestion/training script before starting the server
# (In production you might run this separately or via cron)
# RUN python ingest_and_train.py

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
