from pathlib import Path
import base64
import PyPDF2
import json
import os
from pymongo import MongoClient

SECTIONS = ("BS", "PL", "CF")
SCOPES = ("Standalone", "Consolidated")

# MongoDB connection details
MONGO_URI = "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "LOMAS"
COLLECTION_NAME = "leads"

BASE_DIR = "mongo_inputs"  # where PDFs will be reconstructed


def extract_pdf_text(pdf_path: str) -> str:
    text_chunks = []
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        total = len(reader.pages)
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            text_chunks.append(f"\n\n===== PAGE {i+1} / {total} =====\n{text}")
    return "".join(text_chunks)


def _process_scope_dir(scope_dir: Path) -> None:
    """Process a Standalone/Consolidated folder: expects BS.pdf / PL.pdf / CF.pdf and writes processing/*.txt"""
    if not scope_dir.exists() or not scope_dir.is_dir():
        return
    processing_dir = scope_dir / "processing"
    processing_dir.mkdir(parents=True, exist_ok=True)

    for sec in SECTIONS:
        pdf_path = scope_dir / f"{sec}.pdf"
        if not pdf_path.exists():
            print(f"[skip] {pdf_path} not found")
            continue
        txt_path = processing_dir / f"{sec}.txt"
        try:
            text_content = extract_pdf_text(str(pdf_path))
            txt_path.write_text(text_content, encoding="utf-8")
            print(f"[ok]  {pdf_path} -> {txt_path}")
        except Exception as e:
            print(f"[err] {pdf_path}: {e}")


def _save_financial_documents(record, base_dir=BASE_DIR) -> str:
    """
    Decode financialDocuments from Mongo record and save them as PDFs.
    In your case, fileData is already stored as binary, so we just write it directly.
    Returns the Standalone folder path for pipeline processing.
    """
    company_name = record.get("business_name", f"company_{record['_id']}")
    target_dir = Path(base_dir) / company_name / "Standalone"
    target_dir.mkdir(parents=True, exist_ok=True)

    docs = record.get("financialDocuments", [])
    for doc in docs:
        file_name = doc.get("fileName", "document.pdf")
        file_data = doc.get("fileData")

        # fileData is already raw binary
        if isinstance(file_data, (bytes, bytearray)):
            file_bytes = file_data
        elif isinstance(file_data, dict) and "$binary" in file_data:
            # Some MongoDB drivers still wrap BinData in {"$binary": {"base64": "..."}}
            file_bytes = base64.b64decode(file_data["$binary"]["base64"])
        else:
            raise TypeError(f"Unsupported fileData type for {file_name}: {type(file_data)}")

        # Save PDF
        file_path = target_dir / file_name
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        print(f"[mongo] Saved {file_name} for {company_name} at {file_path}")

    # --- NEW: also save extracted values JSON for compute_ratio_manual ---
    extraction_dir = target_dir / "extractions"
    extraction_dir.mkdir(parents=True, exist_ok=True)

    # We don’t have the extracted dict yet (that’s created later by extract()),
    # so we just leave a placeholder file so compute_ratio_manual won’t crash
    json_path = extraction_dir / "extracted_values.json"
    if not json_path.exists():
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2)
        print(f"[local] Created placeholder {json_path} (will be overwritten by extract step)")

    return str(target_dir)


def process_company_pdfs_from_mongo() -> str:
    """
    Connects to MongoDB, fetches the latest record with financialDocuments,
    reconstructs PDFs, and runs text extraction.
    Returns the path to the folder ready for the pipeline.
    """
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    record = collection.find_one(
        {"financialDocuments": {"$exists": True, "$ne": []}},
        sort=[("last_updated", -1)]  # latest entry
    )

    if not record:
        raise ValueError("No records with financialDocuments found in MongoDB.")

    print(f"[mongo] Processing record for {record.get('business_name', record['_id'])}")

    # 🔹 Extra Part: store identifiers in env vars for downstream steps
    if "business_name" in record:
        os.environ["CUSTOMER_NAME"] = str(record["business_name"])
    if "lead_id" in record:
        os.environ["LOAN_ID"] = str(record["lead_id"])

    target_dir = _save_financial_documents(record)

    # Process PDFs into TXT
    _process_scope_dir(Path(target_dir))

    return target_dir
