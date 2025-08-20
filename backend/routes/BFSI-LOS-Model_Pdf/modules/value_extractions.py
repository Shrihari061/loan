import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from config.config import GPT_MODEL, OPENAI_API_KEY  
from pymongo import MongoClient

def extract(txt_folder):

    load_dotenv()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ALIAS_MAP_PATH = os.path.join(BASE_DIR, "alias_map.json")  

    BS_TEXT_PATH = os.path.join(txt_folder, "BS.txt")  
    PL_TEXT_PATH = os.path.join(txt_folder, "PL.txt")  
    CF_TEXT_PATH = os.path.join(txt_folder, "CF.txt")  

    def read_text_file(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    with open(ALIAS_MAP_PATH, "r", encoding="utf-8") as f:
        alias_map_json = json.load(f)

    bs_text = read_text_file(BS_TEXT_PATH)
    pl_text = read_text_file(PL_TEXT_PATH)
    cf_text = read_text_file(CF_TEXT_PATH)

    system_prompt = """You are an information extraction assistant. 
    Your task is to extract financial line-items using alias matching from the provided annual report texts 
    and return a strict JSON object as described below.

    ## Output JSON format:
    Each key = canonical metric name (from alias_map_json).
    Each value = object with:
    - "matched_value": exact text matched in the text
    - "value_latest": numeric value for latest year
    - "source": "bs" | "pl" | "cf"
    - "confidence": float between 0.0 and 1.0
    - "unit" : whatever units that are specified in the documents
    
    If no exact match is found, return null for all values.

    ## Composition (derived) rules
    A) Total Debt:
        - non-current lease liabilities + current lease liabilities
        - Matched_value should be shown as : Current Lease Liabilities + Non Current Lease Liabilities
    B) Debt Obligations:
        - Total Current Liabilities / Total Assets

    ## Confidence calibration
    - 0.95–1.0: Direct, exact label match (clearly identified line-item in the correct section).
    - 0.7–0.9: Derived values based on clear component matches per rules above.
    - 0.4–0.7: Fuzzy alias matches (near-match labels or context-dependent inference).
    - 0.0: Not found / ambiguous / unsupported.

    Follow the matching, year selection, normalization, and confidence scoring rules exactly.
    Return only JSON, no other text.
    """

    user_prompt = f"""
    ALIAS_MAP_JSON:
    {json.dumps(alias_map_json, ensure_ascii=False)}

    BS_TEXT (source="bs"):
    {bs_text}

    PL_TEXT (source="pl"):
    {pl_text}

    CF_TEXT (source="cf"):
    {cf_text}

    Now extract the JSON as per the rules.
    """

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    output_text = response.choices[0].message.content

    try:
        extracted_json = json.loads(output_text)

        # Prepare local path for compute_ratio_manual compatibility
        parent_folder = os.path.dirname(txt_folder)           # e.g., .../<Company>/Standalone
        extractions_folder = os.path.join(parent_folder, "extractions")
        os.makedirs(extractions_folder, exist_ok=True)
        output_json_path = os.path.join(extractions_folder, "extracted_values.json")

        # 1) Save locally for downstream steps (manual_ratio.py, risk_grader.py)
        with open(output_json_path, "w", encoding="utf-8") as f:
            json.dump(extracted_json, f, indent=2, ensure_ascii=False)
        print(f" Extracted values written locally to {output_json_path}")

        # 2) Save to MongoDB as before
        mongo_client = MongoClient(
            "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        )
        db = mongo_client["LOMAS"]
        col = db["extracted_values"]

        if isinstance(extracted_json, dict):
            doc = extracted_json
        else:
            doc = {"data": extracted_json}
        
        # 🔹 Extra Part: attach identifiers from env vars
        if customer_name := os.getenv("CUSTOMER_NAME"):
            doc["customer_name"] = customer_name
        if loan_id := os.getenv("LOAN_ID"):
            doc["lead_id"] = loan_id

        result = col.insert_one(doc)
        print(f" Extraction complete. Saved to MongoDB 'LOMAS.extracted_values' with _id={result.inserted_id}")

        # Return the local file path so the next stage receives a valid path
        return output_json_path

    except json.JSONDecodeError:
        print(" The model did not return valid JSON. Raw output:")
        print(output_text)
        # Best-effort fallback: write raw text to a file to aid debugging
        parent_folder = os.path.dirname(txt_folder)
        extractions_folder = os.path.join(parent_folder, "extractions")
        os.makedirs(extractions_folder, exist_ok=True)
        fallback_path = os.path.join(extractions_folder, "extracted_values.raw.txt")
        with open(fallback_path, "w", encoding="utf-8") as f:
            f.write(output_text)
        return fallback_path
