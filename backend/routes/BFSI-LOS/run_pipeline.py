"""
    Author: Kunal Kumar Pant
    This script runs the Loan Origination System (LOS) pipeline for credit risk evaluation.
   
    1. Extracts financial data from Pdfs
    2. Loads and maps key financial fields.
    3. Calculates ratios from mapped fields.
    4. Grades loan risk using weighted logic.
    5. Generates executive summary using LLM model.
"""

import os
from pathlib import Path
import base64
from pymongo import MongoClient

from modules.txt_extractor import process_company_pdfs
from modules.all_value_extractions import run_extraction 
from modules.ratio_calculator import compute_ratio
from modules.manual_ratio import compute_and_persist
from modules.risk_grader import compute_risk
from modules.generate_summaries import generate_summaries  


MONGO_CONN = "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


def fetch_latest_lead(output_folder: str):
    """
    Fetch the latest lead from MongoDB (based on _id timestamp)
    and save its financialDocuments as PDFs.
    """
    from pymongo import MongoClient

    client = MongoClient(MONGO_CONN)
    db = client["LOMAS"]
    leads = db["leads"]

    # ✅ Use _id sort instead of last_updated string
    doc = leads.find_one(sort=[("_id", -1)])
    if not doc:
        raise ValueError("No leads found in database")

    customer_name = doc.get("business_name") or doc.get("customer_name")
    lead_id = doc.get("lead_id")
    loan_type = doc.get("loan_type")

    if not (customer_name and lead_id and loan_type):
        raise ValueError("Missing required fields in latest lead document")

    os.makedirs(output_folder, exist_ok=True)

    if "financialDocuments" not in doc or not doc["financialDocuments"]:
        raise ValueError("No financialDocuments found in this lead")

    for idx, file_obj in enumerate(doc["financialDocuments"], start=1):
        file_name = file_obj.get("fileName", f"document_{idx}.pdf")
        file_data = file_obj.get("fileData")
        if not file_data:
            continue

        # handle both Binary and dict {"$binary": {"base64": ...}}
        import base64
        if isinstance(file_data, bytes):
            pdf_bytes = file_data
        elif isinstance(file_data, dict):
            base64_str = file_data.get("$binary", {}).get("base64")
            if not base64_str:
                continue
            pdf_bytes = base64.b64decode(base64_str)
        else:
            continue

        file_path = os.path.join(output_folder, file_name)
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"Saved PDF: {file_path}")

    client.close()
    return customer_name, lead_id, loan_type



def insert_into_cqs(customer_name: str, lead_id: str, loan_type: str):
    """
    Insert a new record into cqs collection with status = 'In progress'.
    """
    client = MongoClient(MONGO_CONN)
    db = client["LOMAS"]
    cqs_collection = db["cqs"]

    record = {
        "customer_name": customer_name,
        "lead_id": lead_id,
        "loan_type": loan_type,
        "status": "In progress"
    }

    cqs_collection.insert_one(record)
    client.close()
    print(f"Inserted into cqs: {record}")


def run_pipeline():
    data_folder = "./pipeline_data"
    pdf_folder = os.path.join(data_folder, "pdfs")

    # Step 1: Fetch latest lead + PDFs
    customer_name, lead_id, loan_type = fetch_latest_lead(pdf_folder)

    # Step 2: Continue with existing pipeline
    process_company_pdfs(pdf_folder)

    txt_folder = Path(pdf_folder) / "processing"

    financial_data = run_extraction(txt_folder, customer_name, lead_id) # --> Extracts all values across all three financial statements
    #  financial_data = extract(txt_folder) # --> Extractions for only certain values

    # ratio_data = compute_ratio(financial_data) # --> Using LLM for 4 ratios
    financial_path = os.path.join(pdf_folder, "extractions","extracted_values.json")
    ratio_data = compute_and_persist(financial_path, customer_name, lead_id) # --> Using manual Script for all ratios
    ratio_path = os.path.join(pdf_folder, "extractions", "ratios.json")
    
    compute_risk(financial_path, ratio_path, customer_name, lead_id)
    risk_path = os.path.join(pdf_folder, "extractions", "risk_rating.json")
    generate_summaries(financial_path, ratio_path, risk_path, customer_name, lead_id)

    # Step 3: Insert into cqs
    insert_into_cqs(customer_name, lead_id, loan_type)


if __name__ == "__main__":
    run_pipeline()
