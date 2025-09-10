import os
import json
import re
from typing import Dict, Any, Union, List
from dotenv import load_dotenv
from openai import OpenAI
from config.config import GPT_MODEL, OPENAI_API_KEY
from pymongo import MongoClient
from modules.postprocess_extracted_values import apply_unit_and_negatives_rules

# ---- small helpers (minimal set) ----
def _read_file(base_dir: str, names: List[str]) -> str:
    for n in names:
        p = os.path.join(base_dir, n)
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    return ""

def _normalize_units(u: Any) -> str:
    if not isinstance(u, str):
        return ""
    return u.strip()

def _to_number_or_null(x: Any) -> Union[str, int]:
    if x is None:
        return "-"
    if isinstance(x, str):
        s = x.strip()
        if s.lower() == "null" or s in ("-", "--", "0"):
            return "-"
        if s.startswith("(") and s.endswith(")"):
            inner = re.sub(r"[^\d]", "", s[1:-1])
            return f"({inner})" if inner else "-"
        s_clean = re.sub(r"[^\d\-]", "", s)
        if not s_clean or s_clean in ("-", "--", ".", "0"):
            return "-"
        try:
            return int(s_clean)
        except Exception:
            return "-"
    if isinstance(x, (int, float)):
        return int(x) if x != 0 else "-"
    return "-"

def _postprocess_just_2023(payload: Dict[str, Any]) -> Dict[str, Any]:
    out = {}
    for k, v in (payload or {}).items():
        if isinstance(v, dict):
            out[k] = {"value_2023": _to_number_or_null(v.get("value_2023", "-"))}
    return out

# ---- CF 2023-only prompt (this is the ONLY prompt we change) ----
def build_prompt_cf_2023_only(cf_text: str, base_json: dict) -> str:
    """
    Only fill FY 2023 (year ended Mar 31, 2023) **for CF keys that already exist** in base_json.
    Do not add new keys. Preserve label spelling as in base_json; ignore anything else in the text.
    Return a JSON object with the SAME keys as base_json's CF slice, each containing ONLY {"value_2023": ...}.
    Use "-" if missing/unreadable. Preserve parentheses as strings; strip commas.
    """
    cf_keys = [k for k, v in (base_json or {}).items() if isinstance(v, dict) and v.get("source") == "cf"]
    cf_slice = {k: base_json[k] for k in cf_keys}
    cf_schema = json.dumps(cf_slice, ensure_ascii=False, indent=2)

    return f"""
You are a careful cash-flow extractor.

INPUTS:
A) 2023-24 Statement of Cash Flows text (two columns FY 2024 and FY 2023 — pick FY 2023).
B) A base JSON schema built earlier (from 2024-25) listing the EXACT CF line items (keys) you must fill.

RULES:
- Extract ONLY the FY 2023 numbers and fill ONLY the keys shown in the schema below.
- Do NOT add new keys, do NOT edit 'source' or 'unit' (they are in the base and will be preserved by the caller).
- If a requested line is present but unreadable, output "value_2023": "-".
- Preserve parentheses as strings like "(3699)" and remove commas; otherwise return plain integers.
- Return a single JSON object mapping each CF key to: {{"value_2023": <int or "(...)" or "-"}}.

CF KEYS TO FILL (from base):
{cf_schema}

-----BEGIN [CF 2023-24 TEXT]-----
{cf_text}
-----END [CF 2023-24 TEXT]-----
""".strip()

# ---- runner ----
def run_extraction_cf(txt_folder: str) -> str:
    """
    ONLY for CF 2023 injection.
    - If year block is 2023-24 and CF.txt exists, extract FY 2023 CF values
      and inject them into the canonical JSON previously written by bs_pl_extraction.py.
    - Write final JSON to `.../Extractions/extracted_values.json`
    - Then push that final JSON to Mongo (Mongo block placed at the end, per instructions).
    """
    year_block = os.path.basename(os.path.dirname(os.path.normpath(txt_folder)))
    if year_block != "2023-24":
        # nothing to do here for other folders
        company_root = os.path.dirname(os.path.dirname(os.path.dirname(txt_folder)))
        return os.path.join(company_root, "Extractions", "extracted_values.json")

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
    client = OpenAI(api_key=api_key)

    cf_text = _read_file(txt_folder, ["CF.txt"])
    if not cf_text.strip():
        company_root = os.path.dirname(os.path.dirname(os.path.dirname(txt_folder)))
        return os.path.join(company_root, "Extractions", "extracted_values.json")

    # Load base JSON created by bs_pl_extraction.py (must already exist)
    company_root = os.path.dirname(os.path.dirname(os.path.dirname(txt_folder)))
    final_dir = os.path.join(company_root, "Extractions")
    os.makedirs(final_dir, exist_ok=True)
    out_path = os.path.join(final_dir, "extracted_values.json")

    base_json = {}
    if os.path.isfile(out_path):
        with open(out_path, "r", encoding="utf-8") as f:
            base_json = json.load(f)

    prompt = build_prompt_cf_2023_only(cf_text, base_json)
    resp = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": "Return only a single valid JSON object."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    cf_2023_only = json.loads(resp.choices[0].message.content)
    cf_2023_only = _postprocess_just_2023(cf_2023_only)

    # Inject ONLY for keys that already exist and are CF
    for k, rec in (base_json or {}).items():
        if isinstance(rec, dict) and rec.get("source") == "cf":
            rec["value_2023"] = cf_2023_only.get(k, {}).get("value_2023", "-")

    apply_unit_and_negatives_rules(base_json, default_unit="₹ crore")

    # Write final canonical file (required path/casing)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(base_json, f, ensure_ascii=False, indent=2)


    return out_path

def push_to_Mongo(out_path: str):
    
    # ---- Mongo insert  ----

    # Load base_json from extracted_values.json for Mongo saving
    if os.path.isfile(out_path):
        with open(out_path, "r", encoding="utf-8") as f:
            base_json = json.load(f)

    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    
    file_name = os.path.basename(out_path)
    if file_name == "extracted_values.json":
        col = db["extracted_values"]
    
    elif file_name == "non_common_values.json":
        col = db["non_common_values"]

    # Insert the final canonical JSON document
    doc = base_json if isinstance(base_json, dict) else {"data": base_json}
    result = col.insert_one(doc)
    
    if file_name == "extracted_values.json":
        print(f"✅ Final extraction saved to {out_path} and pushed to Mongo. _id={result.inserted_id}")
    elif file_name == "non_common_values.json":
        print(f"✅ Non-Common values saved to {out_path} and pushed to Mongo. _id={result.inserted_id}")
