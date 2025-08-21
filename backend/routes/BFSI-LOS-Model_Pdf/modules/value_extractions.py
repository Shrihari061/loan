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
            return "null"

        # Parentheses format e.g. (3,699)
        if s.startswith("(") and s.endswith(")"):
            inner = s[1:-1]
            inner_clean = re.sub(r"[^\d]", "", inner)
            if inner_clean == "":
                return "null"
            return f"({inner_clean})"

        # Per-share float values
        if is_per_share:
            s_clean = re.sub(r"[^0-9.\-]", "", s)
            if s_clean in ("", "-", "--", "."):
                return "null"
            try:
                return float(s_clean)
            except Exception:
                return "null"

        # Normal integer
        s_clean = re.sub(r"[^\d\-]", "", s)
        if s_clean in ("", "-", "--", "."):
            return "null"
        try:
            return int(s_clean)
        except Exception:
            return "null"

    if isinstance(x, (int, float)):
        return float(x) if is_per_share else int(x)

    return "null"

def _normalize_units(u: Any) -> str:
    if not isinstance(u, str):
        return ""
    return u.strip()

def _postprocess_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure required keys exist and types match your constraints."""
    out = {}
    for k, v in payload.items():
        if not isinstance(v, dict):
            continue

        unit = _normalize_units(v.get("unit", ""))

        # Special override for weighted average shares
        if "weighted average equity shares" in k.lower():
            unit = "in shares"

        value_2025 = _to_number_or_null(v.get("value_2025"), unit=unit, label=k)
        value_2024 = _to_number_or_null(v.get("value_2024"), unit=unit, label=k)

        source = v.get("source", "")
        # enforce source whitelist
        if source not in ("bs", "pl", "pf", "cf"):
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
# Prompt builders
# -------------------------
def build_prompt_bs_pl(bs_text: str, pl_text: str) -> str:
    """
    Build prompt for Balance Sheet + Profit & Loss extraction.
    Includes rules for transcription, source, units, parentheses, 2025/2024 years.
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
11) If the source shows a value in parentheses (e.g., (3,699)), you MUST return it as a STRING with parentheses preserved and commas removed, e.g., "(3699)".

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

INPUTS
-----BEGIN [BS]-----
{bs_text}
-----END [BS]-----
-----BEGIN [PL]-----
{pl_text}
-----END [PL]-----
""".strip()

def build_prompt_cf(cf_text: str) -> str:
    """
    Build prompt for Cash Flow extraction.
    Includes rules for transcription, source='cf', 2025/2024, parentheses, units.
    """
    return f"""
You are a meticulous extraction agent. Input is the plain‑text export of the Infosys Standalone Statement of Cash Flows.

STRICT RULES (must follow all):
1) Extract ONLY values explicitly present. DO NOT guess or derive.
2) Years are exactly 2025 and 2024. If a value is missing or unreadable for a year, set it to "null".
3) Monetary amounts (units like "₹ crore", "₹ lakhs") must be integers (strip commas/symbols).
4) Use 'source' = "cf".
5) Preserve the printed unit verbatim for that line item, else empty string.
6) Extract EVERY individual line item and subtotal exactly as written, including:
   a) Operating adjustments
   b) Working capital changes
   c) Investing lines
   d) Financing lines
   e) Section totals, net increase/decrease, cash at beginning/end, restricted cash
7) Do NOT compute; pure transcription by label.
8) Parentheses (negative) values must remain strings.

TARGET JSON SHAPE:
{{
"<Exact Line Item>": {{
    "value_2025": <int or "null">,
    "value_2024": <int or "null">,
    "source": "cf",
    "unit": "<unit or empty>"
}}
}}

INPUT
-----BEGIN [CF]-----
{cf_text}
-----END [CF]-----
""".strip()

# -------------------------
# Core extraction function
# -------------------------
def extract(txt_folder: str) -> str:
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
    client = OpenAI(api_key=api_key)

    bs_text = _read_file(txt_folder, ["BS.txt"])
    pl_text = _read_file(txt_folder, ["PL.txt"])
    cf_text = _read_file(txt_folder, ["CF.txt"])

    # ----------------- BS + PL extraction -----------------
    prompt_bs_pl = build_prompt_bs_pl(bs_text, pl_text)
    system_msg = "Return only a single valid JSON object. Do not include any commentary, code fences, or prose."

    resp1 = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt_bs_pl}
        ],
        response_format={"type": "json_object"},
        max_tokens=7000
    )
    parsed1 = json.loads(resp1.choices[0].message.content)
    cleaned1 = _postprocess_payload(parsed1)

    # ----------------- CF extraction -----------------
    cleaned = dict(cleaned1)
    if cf_text.strip():
        prompt_cf = build_prompt_cf(cf_text)
        resp2 = client.chat.completions.create(
            model=GPT_MODEL,
            messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": prompt_cf}],
            response_format={"type": "json_object"},
            max_tokens=4000
        )
        parsed2 = json.loads(resp2.choices[0].message.content)
        cleaned2 = _postprocess_payload(parsed2)
        cleaned = _merge_dicts(cleaned, cleaned2)

    # ----------------- Save locally -----------------
    parent_folder = os.path.dirname(str(txt_folder).rstrip("/\\"))
    extractions_folder = os.path.join(parent_folder, "extractions")
    os.makedirs(extractions_folder, exist_ok=True)
    output_json_path = os.path.join(extractions_folder, "extracted_values.json")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    # ----------------- Save to Mongo -----------------
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["extracted_values"]
    doc = cleaned if isinstance(cleaned, dict) else {"data": cleaned}

    if customer_name := os.getenv("CUSTOMER_NAME"):
        doc["customer_name"] = customer_name
    if loan_id := os.getenv("LOAN_ID"):
        doc["lead_id"] = loan_id

    result = col.insert_one(doc)
    print(f"✅ Extraction saved to file and Mongo. _id={result.inserted_id}")

    return output_json_path
