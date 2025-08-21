"""
    Author: Kunal Kumar Pant (updated by Shrihari Rao)
    This script runs the Loan Origination System (LOS) pipeline for credit risk evaluation.
    
    Steps:
    1. Fetch PDFs from MongoDB or local folder
    2. Set environment variables for CUSTOMER_NAME, LOAN_ID, LOAN_TYPE
    3. Extract financial data from PDFs
    4. Compute financial ratios (manual, full 13 ratios)
    5. Compute risk rating
    6. Generate executive summaries
    7. Log entry in QC collection (status="In progress")
"""

import os
from pathlib import Path
from pymongo import MongoClient

from modules.txt_extractor import process_company_pdfs_from_mongo
from modules.value_extractions import extract
from modules.manual_ratio import compute_and_persist
from modules.risk_grader import compute_risk
from modules.generate_summaries import generate_summaries


def set_env_from_mongo():
    """
    Fetch latest company record from MongoDB and set environment variables.
    """
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["leads"]

    record = col.find_one(
        {"financialDocuments": {"$exists": True, "$ne": []}},
        sort=[("last_updated", -1)]
    )

    customer_name, loan_id, loan_type = None, None, None
    if record:
        customer_name = record.get("business_name")
        loan_id = record.get("lead_id")
        loan_type = record.get("loan_type")

        if customer_name:
            os.environ["CUSTOMER_NAME"] = str(customer_name)
        if loan_id:
            os.environ["LOAN_ID"] = str(loan_id)
        if loan_type:
            os.environ["LOAN_TYPE"] = str(loan_type)

        print(f"[env] Set CUSTOMER_NAME={customer_name}, LOAN_ID={loan_id}, LOAN_TYPE={loan_type}")

    return customer_name, loan_id, loan_type


def run_pipeline(use_mongo: bool = True):
    print("[Pipeline] Starting LOS pipeline...")

    # Step 1: Fetch PDFs
    if use_mongo:
        print("[Pipeline] Fetching company PDFs from MongoDB...")
        data_folder = process_company_pdfs_from_mongo()
    else:
        print("[Pipeline] Using local folder for company PDFs...")
        # Replace process_company_pdfs if you have a local folder processor
        data_folder = Path("local_data_folder")  # placeholder

    txt_folder = Path(data_folder) / "processing"
    print(f"[Pipeline] TXT folder set to: {txt_folder}")

    # Step 2: Set environment variables
    customer_name, loan_id, loan_type = set_env_from_mongo()

    # Step 3: Extract financial data
    print("[Pipeline] Extracting financial data from TXT files...")
    financial_path = extract(txt_folder)
    print(f"[ok] Extraction complete for {customer_name}")

    # Step 4: Compute all ratios manually
    print("[Pipeline] Calculating financial ratios (manual, full 13 ratios)...")
    compute_and_persist(financial_path)  # only pass financial_path
    ratio_path = os.path.join(os.path.dirname(financial_path), "ratios.json")
    print("[ok] Ratio calculation complete")

    # Step 5: Compute risk rating
    print("[Pipeline] Computing risk metrics...")
    compute_risk(financial_path, ratio_path, seed=42)
    risk_path = os.path.join(os.path.dirname(financial_path), "risk_rating.json")
    print("[ok] Risk computation complete")

    # Step 6: Generate executive summaries
    print("[Pipeline] Generating executive summaries...")
    generate_summaries(financial_path, ratio_path, risk_path)
    print("[ok] Summary generation complete")

    # Step 7: Insert into QC collection (status="In progress")
    if customer_name and loan_id:
        print("[Pipeline] Logging in QC collection (status='In progress')...")
        mongo_client = MongoClient(
            "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        )
        db = mongo_client["LOMAS"]
        cqs_col = db["cqs"]
        doc = {
            "customer_name": customer_name,
            "lead_id": loan_id,
            "status": "In progress",
            "loan_type": loan_type
        }
        result = cqs_col.insert_one(doc)
        print(f"[QC] Inserted into LOMAS.cqs with _id={result.inserted_id}")

    print("[Pipeline] LOS pipeline execution finished.")


if __name__ == "__main__":
    run_pipeline(use_mongo=True)
