"""
    Author: Kunal Kumar Pant (updated by Shrihari Rao)
    This script runs the Loan Origination System (LOS) pipeline for credit risk evaluation.
"""

import os
from pathlib import Path
from pymongo import MongoClient

from modules.txt_extractor import process_company_pdfs_from_mongo
from modules.value_extractions import extract
from modules.ratio_calculator import compute_ratio
from modules.manual_ratio import compute_ratio_manual
from modules.risk_grader import compute_risk
from modules.generate_summaries import generate_summaries


def run_pipeline():
    print("[Pipeline] Starting LOS pipeline...")

    # Step 1: Get data from MongoDB
    print("[Pipeline] Fetching company PDFs from MongoDB...")
    data_folder = process_company_pdfs_from_mongo()
    print(f"[Pipeline] Retrieved data folder: {data_folder}")

    # --- NEW: fetch identifiers (business_name, lead_id) and set env vars ---
    print("[Pipeline] Setting environment variables for CUSTOMER_NAME, LOAN_ID, LOAN_TYPE...")
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

    # Step 2: TXT folder
    txt_folder = Path(data_folder) / "processing"
    print(f"[Pipeline] TXT folder set to: {txt_folder}")

    # Step 3: Extract financial data
    print("[Pipeline] Extracting financial data from TXT files...")
    financial_data = extract(txt_folder)
    print(f"[ok] Extraction complete. Data extracted for {customer_name}")

    # Step 4: Compute ratios
    print("[Pipeline] Calculating financial ratios...")
    # ratio_data = compute_ratio(financial_data)
    ratio_data = compute_ratio_manual(financial_data)
    print("[ok] Ratio calculation complete")

    # Step 5: Compute risk
    print("[Pipeline] Computing risk metrics...")
    compute_risk(financial_data, ratio_data, seed=42)
    print("[ok] Risk computation complete")

    # Step 6: Generate summaries
    print("[Pipeline] Generating executive summaries...")
    generate_summaries(financial_data, ratio_data)
    print("[ok] Summary generation complete")

    # Step 7: Insert into QC collection (cqs) with status="pending"
    if customer_name and loan_id:
        print("[Pipeline] Logging in QC collection (status='In progress')...")
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
    run_pipeline()
