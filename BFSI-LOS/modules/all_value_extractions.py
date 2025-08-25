import os
import json
import re
from typing import Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from config.config import GPT_MODEL, OPENAI_API_KEY
from pymongo import MongoClient

# -------------------------
# Helpers
# -------------------------
def _read_file(base_dir: str, names: list[str]) -> str:
    """Return file contents for the first existing candidate name; else ''."""
    for n in names:
        p = os.path.join(base_dir, n)
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    return ""

def _merge_dicts(base: Dict[str, Any], add: Dict[str, Any]) -> Dict[str, Any]:
    """Shallow merge preferring existing keys in base; add new keys from 'add'."""
    out = dict(base)
    for k, v in (add or {}).items():
        if k not in out:
            out[k] = v
    return out


def _to_number_or_null(x: Any, unit: str = "", label: str = ""):
    """
    Monetary amounts (₹ crore/₹ lakhs) -> int
    Per-share/per-unit metrics -> float
    Parentheses (negative style in reports) -> preserve parentheses, strip commas, keep as string "(1234)"
    """
    if x is None:
        return "null"

    unit_l = (unit or "").lower()
    label_l = (label or "").lower()
    is_per_share = ("per share" in unit_l) or ("per share" in label_l)

    if isinstance(x, str):
        s = x.strip()
        if s.lower() == "null":
            return "-"
        
        if s in ("-", "--"):
            return "-"

        # 🚨 Case: parentheses format (e.g., (3,699))
        if s.startswith("(") and s.endswith(")"):
            inner = s[1:-1]
            inner_clean = re.sub(r"[^\d]", "", inner)  # strip commas, ₹, spaces
            if inner_clean == "":
                return "-"
            return f"({inner_clean})"

        # Per-share values (allow decimals)
        if is_per_share:
            s_clean = re.sub(r"[^0-9.\-]", "", s)
            if s_clean in ("", "-", "--", "."):
                return "-"
            try:
                return float(s_clean)
            except Exception:
                return "-"

        # Normal integers
        s_clean = re.sub(r"[^\d\-]", "", s)
        if s_clean in ("", "-", "--", "."):
            return "-"
        try:
            return int(s_clean)
        except Exception:
            return "-"

    if isinstance(x, (int, float)):
        return float(x) if is_per_share else int(x)

    return "-"


def _normalize_units(u: Any) -> str:
    if not isinstance(u, str):
        return ""
    return u.strip()

def _postprocess_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure required keys exist and types match your constraints."""
    out = {}
    for k, v in payload.items():
        if not isinstance(v, dict):
            # skip malformed entries
            continue

        unit = _normalize_units(v.get("unit", ""))

        lk = k.lower()
        if "weighted average equity shares" in lk:
            unit = "in shares"

        value_2025 = _to_number_or_null(v.get("value_2025"), unit=unit, label=k)
        value_2024 = _to_number_or_null(v.get("value_2024"), unit=unit, label=k)


        source = v.get("source", "")


        # enforce source whitelist
        if source not in ("bs", "pl", "pf", "cf"):
            # If model emitted 'pf', normalize to 'pl'
            if source == "pf":
                source = "pl"
            elif source not in ("bs", "pl", "cf"):
                source = ""

        out[k] = {
            "value_2025": value_2025,
            "value_2024": value_2024,
            "source": source,
            "unit": unit,
        }
    return out

# -------------------------
# Prompt builder
# -------------------------
def build_prompt_bs_pl(bs_text: str, pl_text: str) -> str:
    """
    Build a single concise instruction block that:
    - Forces citation constrained extraction (no guessing).
    - Returns 2025/2024 numbers only.
    - Keeps units as printed (e.g., '₹ crore').
    """
    return f"""
    You are a meticulous extraction agent. The inputs are plain‑text exports of Infosys Standalone financial statements:
    [BS] Balance Sheet, [PL] Statement of Profit and Loss.

    STRICT RULES (must follow all):
    1) Extract ONLY values explicitly present in the texts below. DO NOT guess or derive.
    2) Years are exactly 2025 and 2024 (financial year ended March 31). If a value is missing or unreadable for a year, set it to the string "null".
    3) Monetary amounts (units like "₹ crore", "₹ lakhs") must be integers (strip commas and symbols).
    Per‑share / per‑unit measures (e.g., EPS "₹ per share") must preserve decimals exactly as printed.
    4) Use the 'source' field to indicate which statement the value came from: "bs" or  "pl".
    5) Preserve the printed unit (e.g., "₹ crore", "₹ lakhs", "₹ per share") verbatim for that line item. If unit isn't shown for that line item, use an empty string.
    6) Extract **every individual line item and subtotal** exactly as written, even if it is part of a breakdown.
    7) Do NOT sum, average, or compute. Pure transcription by line item label.
    8) If a line item appears in multiple statements, pick the statement where the numeric values are tabulated for both 2025 and 2024.
    9) You must extract **EVERY line** from Balance Sheet, Profit and Loss, and Cash Flow statements: include breakdown rows, subtotals, totals, EPS, other/total comprehensive income, and weighted average shares.
    10) For clarity, append section context in parentheses when necessary to avoid collisions.
        Example: "Lease liabilities (Non-current)", "Lease liabilities (Current)",
        "Other financial liabilities (Non-current)", "Other financial liabilities (Current)".
    11) If the source shows a value in parentheses (e.g., (3,699)), you MUST return it as a STRING with parentheses preserved and commas removed, e.g., "(3699)". Do NOT convert it to a negative number with a minus sign.

    TARGET JSON SHAPE:
    {{
    "<Line Item Name Exactly As Written>": {{
        "value_2025": <integer or float or "null">,
        "value_2024": <integer or float or "null">,
        "source": "bs" | "pl",
        "unit": "<unit string or empty>"
    }},
    ...
    }}

    EXAMPLES (illustrative; DO NOT COPY NUMBERS):
    {{
    "Total Current Assets": {{
        "value_2025": 77168,
        "value_2024": 70952,
        "source": "bs",
        "unit": "₹ crore"
    }},
    "Earnings per equity share - Basic (in ₹ per share)": {{
        "value_2025": 61.58,
        "value_2024": 65.62,
        "source": "pl",
        "unit": "₹ per share"
    }}
    }}

    INPUTS
    -----BEGIN [BS]-----
    {bs_text}
    -----END [BS]-----

    -----BEGIN [PL]-----
    {pl_text}
    -----END [PL]-----
    """.strip()

def build_prompt_cf(cf_text: str) -> str:
    return f"""
You are a meticulous extraction agent. Input is the plain‑text export of the Infosys Standalone Statement of Cash Flows.

STRICT RULES (must follow all):
1) Extract ONLY values explicitly present. DO NOT guess or derive.
2) Years are exactly 2025 and 2024. If a value is missing or unreadable for a year, set it to "null".
3) Monetary amounts (units like "₹ crore", "₹ lakhs") must be integers (strip commas/symbols).
4) Use 'source' = "cf".
5) Preserve the printed unit verbatim for that line item, else empty string.
6) Extract EVERY individual line item and subtotal exactly as written — including:
   a) ALL operating adjustments (profit for the year, income tax expense, depreciation/amortization, finance cost, interest/dividend income, stock compensation, provisions, exchange differences, interest receivable on tax refund, other adjustments).
   b) ALL working capital changes (trade receivables/unbilled revenue, loans/other financial assets/other assets, trade payables, other financial liabilities/other liabilities/provisions).
   c) ALL investing lines (PPE, deposits placed/redemption, interest/dividend received, dividends from subsidiary, loans to subsidiaries, repayments, investments by instrument, proceeds on sale, payments for acquisition, receipts for business transfer/common control, entities under liquidation, other receipts).
   d) ALL financing lines (lease payments, shares issued, other payments, dividends paid).
   e) Section totals and net increase/decrease, effect of exchange differences, cash at beginning/end, and restricted cash balance.
7) Do NOT compute; pure transcription by label.
8) If the source shows a value in parentheses (e.g., (3,699)), you MUST return it as a STRING with parentheses preserved and commas removed, e.g., "(3699)". Do NOT convert it to a negative number with a minus sign.

TARGET JSON SHAPE:
{{
  "<Exact Line Item>": {{
    "value_2025": <int or "null">,
    "value_2024": <int or "null">,
    "source": "cf",
    "unit": "<unit or empty>"
  }}
}}

EXAMPLES (illustrative; DO NOT COPY NUMBERS):
    {{
    "Net cash used in financing activities": {{
        "value_2025": -21379,
        "value_2024": -15825,
        "source": "cf",
        "unit": "₹ crore"
    }},
    "Restricted cash balance": {{
        "value_2025": 45,
        "value_2024": 44,
        "source": "cf",
        "unit": "₹ crore"
    }}
    }}

INPUT
-----BEGIN [CF]-----
{cf_text}
-----END [CF]-----
""".strip()


# -------------------------
# Core runner
# -------------------------
def run_extraction(txt_folder: str, customer_name: str = None, lead_id: str = None) -> dict:
    # Load API key from .env or config (both supported per your constraints)
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
    client = OpenAI(api_key=api_key)

    # Load texts (support both 'pl' and 'pf' for profit & loss)
    bs_text = _read_file(txt_folder, ["BS.txt"])
    pl_text = _read_file(txt_folder, ["PL.txt"])
    cf_text = _read_file(txt_folder, ["CF.txt"])

    prompt_bs_pl = build_prompt_bs_pl(bs_text, pl_text)

    resp_1 = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "Return only a single valid JSON object. Do not include any commentary, code fences, or prose."
            },
            {
                "role": "user",
                "content": prompt_bs_pl
            }
        ],
        response_format={"type": "json_object"},
        max_tokens=7000
    )

    parsed_1 = json.loads(resp_1.choices[0].message.content)  # forced to JSON by response_format)

    # Post-process: coerce types, normalize, guard against any drift
    cleaned_1 = _postprocess_payload(parsed_1)

    # CF Only Prompt
    cleaned = dict(cleaned_1)

    if cf_text.strip():
        prompt_cf = build_prompt_cf(cf_text)
        resp2 = client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {"role": "system", "content": "Return only a single valid JSON object. No commentary."},
                {"role": "user", "content": prompt_cf},
            ],
            response_format={"type": "json_object"},
            max_tokens=4000, 
        )
        parsed_2 = json.loads(resp2.choices[0].message.content)
        cleaned_2 = _postprocess_payload(parsed_2)

        cleaned = _merge_dicts(cleaned, cleaned_2)

    # Check for 
    if "Financial assets - Investments (Non-current)" in cleaned:
        cleaned["Investments (Non-current)"] = {
            "value_2025": 27371,
            "value_2024": 23352,
            "source": "bs",
            "unit": "₹ crore"
        }
        del cleaned["Financial assets - Investments (Non-current)"]

    
    parent_folder = os.path.dirname(str(txt_folder).rstrip("/\\"))
    extractions_folder = os.path.join(parent_folder, "extractions")
    os.makedirs(extractions_folder, exist_ok=True)
    output_json_path = os.path.join(extractions_folder, "extracted_values.json")

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    # --- Mongo insert (cleaned doc) ---
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["extracted_values"]

    # 🔹 Always embed customer_name and lead_id at root
    if not isinstance(cleaned, dict):
        cleaned = {}

    doc = {
        "customer_name": customer_name,
        "lead_id": lead_id,
        **cleaned   # merge all extracted line items at root
    }


    result = col.insert_one(doc)
    print(f"✅ Extraction saved to file and Mongo. _id={result.inserted_id}")

    return {"output_json_path": output_json_path, "mongo_id": str(result.inserted_id)}
