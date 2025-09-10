"""
    Author: Kunal Kumar Pant
    This script runs the Loan Origination System (LOS) pipeline for credit risk evaluation.
   
    1. Extracts financial data from Pdfs
    2. Loads and maps key financial fields.
    3. Calculates ratios from mapped fields.
    4. Grades loan risk using weighted logic.
    5. Generates executive summary using LLM model.
"""

import argparse
import os
from pathlib import Path

from modules.txt_extractor import process_company_pdfs
from modules.bs_pl_extractions import run_extraction_bs_pl
from modules.cf_extraction import run_extraction_cf, push_to_Mongo
from modules.manual_ratio import compute_ratios,push_ratio_to_Mongo
from modules.risk_grader import compute_risk
from modules.generate_summaries import generate_summaries  

def run_pipeline(data_folder: str):
    print("\n" + "="*60)
    print("🚀 STARTING BFSI-LOS PIPELINE")
    print("="*60)
    
    print("\n📄 STEP 1: Processing PDF files and extracting text...")
    process_company_pdfs(data_folder)
    print("✅ Text extraction completed")

    base = Path(data_folder) / "Standalone"
    txt_2425 = base / "2024-25" / "text_extractions"
    txt_2324 = base / "2023-24" / "text_extractions"

    txt_folders = [txt_2425, txt_2324]

    print("\n🔍 STEP 2: Extracting financial data using AI...")
    for folder in txt_folders:
        if folder.exists():
            year = "2024-25" if "2024-25" in str(folder) else "2023-24"
            print(f"  📊 Processing {year} financial statements...")
            print(f"    → Extracting Balance Sheet & P&L data...")
            run_extraction_bs_pl(str(folder))
            print(f"    → Extracting Cash Flow data...")
            out_path = run_extraction_cf(str(folder))
            print(f"  ✅ {year} data extraction completed")
        else:
            print(f"  ⚠️  Missing folder: {folder}")

    print("\n💾 STEP 3: Saving extracted values to database...")
    out_path_extracted_values = Path(data_folder) / "Extractions" / "extracted_values.json"
    out_path_non_common_values = Path(data_folder) / "Extractions" / "non_common_values.json"

    push_to_Mongo(str(out_path_extracted_values))
    print("  ✅ Main extracted values saved")
    
    # Only push non_common_values if it exists
    if out_path_non_common_values.exists():
        push_to_Mongo(str(out_path_non_common_values))
        print("  ✅ Non-common values saved")
    else:
        print(f"  ℹ️  Non-common values file not generated, skipping...")

    print("\n📈 STEP 4: Computing financial ratios...")
    ratio_path = compute_ratios(out_path_extracted_values)
    push_ratio_to_Mongo(ratio_path)
    print("  ✅ Financial ratios calculated and saved")

    print("\n⚖️  STEP 5: Computing risk assessment...")
    compute_risk(out_path_extracted_values, ratio_path)
    print("  ✅ Risk rating completed")

    print("\n📝 STEP 6: Generating AI summaries...")
    risk_path = os.path.join(data_folder, "Extractions", "risk_rating.json")
    generate_summaries(out_path_extracted_values, ratio_path, risk_path)
    print("  ✅ Executive summaries generated")

    print("\n" + "="*60)
    print("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("📋 Generated files:")
    print("  • extracted_values.json - Financial data")
    print("  • ratios.json - Financial ratios")
    print("  • risk_rating.json - Risk assessment")
    print("  • summaries.json - Executive summaries")
    print("="*60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LOS Credit Risk Evaluation Pipeline")
    parser.add_argument("data_folder", type=str, help="Path to the Company directory containing the PDFs")
    args = parser.parse_args()
    run_pipeline(args.data_folder)