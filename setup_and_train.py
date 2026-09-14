import os
import subprocess
import zipfile
import sys
import shutil

def download_dataset():
    data_file = 'Leads.csv'
    zip_file = 'leads-dataset.zip'
    
    if os.path.exists(data_file):
        print(f"[{data_file}] already exists. Skipping download.")
        return True

    print("Attempting to download 'ashydv/leads-dataset' using Kaggle API...")
    try:
        subprocess.check_call(["kaggle", "datasets", "download", "-d", "ashydv/leads-dataset"])
        
        if os.path.exists(zip_file):
            print(f"Extracting {zip_file}...")
            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                zip_ref.extractall('.')
            os.remove(zip_file)
            
            # The dataset might be inside a subfolder or named slightly differently
            # Let's check for Leads.csv or similar
            if os.path.exists('Leads.csv'):
                print("Successfully downloaded and extracted Leads.csv!")
                return True
            else:
                # Search for it
                for root, dirs, files in os.walk('.'):
                    for file in files:
                        if file.lower() == 'leads.csv':
                            shutil.move(os.path.join(root, file), 'Leads.csv')
                            print("Successfully downloaded and extracted Leads.csv!")
                            return True
        else:
            print("Zip file not found after Kaggle download.")
    except Exception as e:
        print("Failed to download via Kaggle API. Attempting alternative Github Mirror...")
        try:
            import urllib.request
            url = 'https://raw.githubusercontent.com/Shivan118/Lead-Scoring-Case-Study/main/Leads.csv'
            urllib.request.urlretrieve(url, 'Leads.csv')
            print("Successfully downloaded from Github Mirror!")
            return True
        except Exception as e2:
            print(f"Alternative download failed: {e2}")
            print("You can manually download it from: https://www.kaggle.com/datasets/ashydv/leads-dataset")
            return False

def run_training_pipeline():
    print("\n--- Starting ML Pipeline ---")
    script_path = os.path.join('backend', 'ingest_and_train.py')
    
    if not os.path.exists(script_path):
        print(f"Error: {script_path} not found.")
        return
        
    try:
        # Run the script
        subprocess.check_call([sys.executable, script_path])
        print("\n--- ML Pipeline Completed Successfully ---")
    except subprocess.CalledProcessError as e:
        print(f"Pipeline failed with error code: {e.returncode}")

if __name__ == "__main__":
    print("MetaLeadIQ - Setup and Train")
    download_dataset()
    run_training_pipeline()
