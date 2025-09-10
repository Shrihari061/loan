import os
import json
import re
import unicodedata
from typing import Dict, Any, List
from dotenv import load_dotenv
from openai import OpenAI
from config.config import GPT_MODEL, OPENAI_API_KEY

# -------------------------
# Helpers (copied from existing file, unchanged in spirit)
# -------------------------
def _read_file(base_dir: str, names: List[str]) -> str:
    for n in names:
        p = os.path.join(base_dir, n)
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    return ""

_DASHES = {"\u2013", "\u2014", "\u2212"}  # en dash, em dash, minus

ALIAS_KEYS = {
    "Fair value changes on investments, net": "Fair value changes on investments, net (OCI)",
    "Trade payables - Micro enterprises and small enterprises":
        "Trade payables - Total outstanding dues of micro enterprises and small enterprises",
    "Trade payables - Other creditors":
        "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises",
}

def _canon_label(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = unicodedata.normalize("NFKC", s)
    for d in _DASHES:
        s = s.replace(d, "-")
    s = s.replace("—", "-").replace("–", "-")
    s = s.replace(" - ", " - ").replace(" -", " - ").replace("- ", " - ")
    s = " ".join(s.split())
    return ALIAS_KEYS.get(s, s)

def _merge_line_items(a: dict, b: dict) -> dict:
    out = dict(a or {})
    for y in ("value_2025", "value_2024", "value_2023"):
        bv = (b or {}).get(y, None)
        av = out.get(y, None)
        def is_empty(v): return v in (None, "", "null", "-")
        if not is_empty(bv) and is_empty(av):
            out[y] = bv
    if (not out.get("unit")) and b.get("unit"):
        out["unit"] = b["unit"]
    if (not out.get("source")) and b.get("source"):
        out["source"] = b["source"]
    return out

def _merge_dicts(base: Dict[str, Any], add: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(base)
    for k, v in (add or {}).items():
        if k not in out:
            out[k] = v
    return out

def _prune_value(d: dict, allowed: tuple[str, ...]) -> dict:
    for k, v in d.items():
        if isinstance(v, dict):
            for y in list(v.keys()):
                if y not in allowed:
                    v.pop(y, None)
    return d

def _to_number_or_null(x: Any, unit: str = "", label: str = ""):
    if x is None:
        return "-"
    unit_l = (unit or "").lower()
    label_l = (label or "").lower()
    is_per_share = ("per share" in unit_l) or ("per share" in label_l)
    if isinstance(x, str):
        s = x.strip()
        if s.lower() == "null":
            return "-"
        if s in ("-", "--", "0"):
            return "-"
        if s.startswith("(") and s.endswith(")"):
            inner = s[1:-1]
            inner_clean = re.sub(r"[^\d]", "", inner)
            if inner_clean in ("", "0"):
                return "-"
            return f"({inner_clean})"
        if is_per_share:
            s_clean = re.sub(r"[^0-9.\-]", "", s)
            if s_clean in ("", "-", "--", ".", "0"):
                return "-"
            try:
                return float(s_clean)
            except Exception:
                return "-"
        s_clean = re.sub(r"[^\d\-]", "", s)
        if s_clean in ("", "-", "--", ".", "0"):
            return "-"
        try:
            return int(s_clean)
        except Exception:
            return "-"
    if isinstance(x, (int, float)):
        if x == 0:
            return "-"
        return float(x) if is_per_share else int(x)
    return "-"

def _normalize_units(u: Any) -> str:
    if not isinstance(u, str):
        return ""
    return u.strip()

def _postprocess_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    out = {}
    for raw_k, v in payload.items():
        if not isinstance(v, dict):
            continue
        unit = _normalize_units(v.get("unit", ""))
        lk = raw_k.lower()
        if "weighted average equity shares" in lk:
            unit = "in shares"
        rec = {
            "value_2025": _to_number_or_null(v.get("value_2025"), unit=unit, label=raw_k),
            "value_2024": _to_number_or_null(v.get("value_2024"), unit=unit, label=raw_k),
            "value_2023": _to_number_or_null(v.get("value_2023"), unit=unit, label=raw_k),
            "source": v.get("source", "") if v.get("source", "") in ("bs","pl","cf","pf") else "",
            "unit": unit,
        }
        if rec["source"] == "pf":
            rec["source"] = "pl"
        k = _canon_label(raw_k)
        if k in out:
            out[k] = _merge_line_items(out[k], rec)
        else:
            out[k] = rec
    return out

# -------------------------
# Prompts (unchanged except cf-2023 moved to cf_extraction.py)
# -------------------------
def build_prompt_bs_pl_2024_25(bs_text: str, pl_text: str) -> str:
    return f"""
    You are a meticulous extraction agent. The inputs are plain-text exports of Infosys Standalone financial statements:
    [BS] Balance Sheet, [PL] Statement of Profit and Loss.

    STRICT RULES (must follow all):
    1) Extract ONLY values explicitly present in the texts below. DO NOT guess or derive.
    2) Years are exactly 2025 and 2024 (financial year ended March 31). If a value is missing or unreadable for a year, set it to the string "null".
    3) Monetary amounts (units like "₹ crore", "₹ lakhs") must be integers (strip commas and symbols).
    Per-share / per-unit measures (e.g., EPS "₹ per share") must preserve decimals exactly as printed.
    4) Use the 'source' field to indicate which statement the value came from: "bs" or  "pl".
    5) Preserve the printed unit (e.g., "₹ crore", "₹ lakhs", "₹ per share") verbatim for that line item. If unit isn't shown for that line item, use an empty string.
    6) Extract **every individual line item and subtotal** exactly as written, even if it is part of a breakdown.
    7) Do NOT sum, average, or compute. Pure transcription by line item label.
    8) If a line item appears in multiple statements, pick the statement where the numeric values are tabulated for both 2025 and 2024.
    9) You must extract **EVERY line** from Balance Sheet, Profit and Loss, and Cash Flow statements: include breakdown rows, subtotals, totals, EPS, other/total comprehensive income, and weighted average shares.
    10) For clarity, append section context in parentheses when necessary to avoid collisions.
    11) If the source shows a value in parentheses (e.g., (3,699)), you MUST return it as a STRING with parentheses preserved and commas removed.
    12) If a line item is present inside a sub-heading, include the full sub-heading in the line item name.
    TARGET JSON SHAPE:
    {{
    "<Line Item>": {{"value_2025": <int/float/"null">, "value_2024": <int/float/"null">, "source": "bs"|"pl", "unit": "<unit>"}}
    }}

    -----BEGIN [BS]-----
    {bs_text}
    -----END [BS]-----

    -----BEGIN [PL]-----
    {pl_text}
    -----END [PL]-----
    """.strip()

def build_prompt_bs_pl_2023_24(bs_text: str, pl_text: str, base_json: dict) -> str:
    base_schema = json.dumps(base_json, ensure_ascii=False, indent=2)
    return f"""
You are a meticulous extraction agent. The inputs are:
1. Infosys Standalone Balance Sheet (BS) for 2023-24
2. Infosys Standalone Profit & Loss (PL) for 2023-24
3. The extracted values JSON for 2024-25 (with 2025/2024 numbers, source, and unit).

TASK:
- Add ONLY "value_2023" for each line item present in the 2024-25 JSON schema.
- Do not change or remove any keys, sources, or units.
- If a 2023 value is not present in the text, set "value_2023": "-" .
- If you find a line item in 2023 text that is NOT in the 2024-25 JSON, ignore it.

OUTPUT: A JSON object in the SAME schema as the 2024-25 JSON, but with "value_2023" fields filled in.

2024-25 BASE JSON SCHEMA:
{base_schema}

-----BEGIN [BS]-----
{bs_text}
-----END [BS]-----

-----BEGIN [PL]-----
{pl_text}
-----END [PL]-----
""".strip()

def build_prompt_cf_2024_25(cf_text: str) -> str:
    return f"""
You are a meticulous extraction agent. Input is the plain-text export of the Infosys Standalone Statement of Cash Flows.

STRICT RULES (must follow all):
1) Extract ONLY values explicitly present. DO NOT guess or derive.
2) Years are exactly 2025 and 2024. If a value is missing or unreadable for a year, set it to "null".
3) Monetary amounts (units like "₹ crore", "₹ lakhs") must be integers (strip commas/symbols).
4) Use 'source' = "cf".
5) Preserve the printed unit verbatim for that line item, else empty string.
6) Extract EVERY individual line item and subtotal exactly as written — including ops adjustments, WC changes, investing, financing, and cash/FX totals.
7) Do NOT compute; pure transcription by label.
8) Preserve parentheses as strings like "(3699)".

TARGET JSON SHAPE:
{{"<Exact Line Item>": {{"value_2025": <int|"null">, "value_2024": <int|"null">, "source": "cf", "unit": "<unit>"}}}}

-----BEGIN [CF]-----
{cf_text}
-----END [CF]-----
""".strip()

# -------------------------
# Core runner
# -------------------------
def run_extraction_bs_pl(txt_folder: str) -> str:
    """
    2024-25: Extract BS+PL+CF (2025/2024), write canonical JSON.
    2023-24: Only inject BS/PL "value_2023" into existing canonical JSON (no CF here).
    Returns path to the canonical JSON under .../Extractions/extracted_values.json
    """
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
    client = OpenAI(api_key=api_key)

    bs_text = _read_file(txt_folder, ["BS.txt"])
    pl_text = _read_file(txt_folder, ["PL.txt"])
    cf_text = _read_file(txt_folder, ["CF.txt"])  # Only used for 24-25

    year_block = os.path.basename(os.path.dirname(os.path.normpath(txt_folder)))

    # company_root = .../Standalone
    company_root = os.path.dirname(os.path.dirname(os.path.dirname(txt_folder)))
    final_dir = os.path.join(company_root, "Extractions")  # Capitalized as per requirement
    os.makedirs(final_dir, exist_ok=True)
    out_path = os.path.join(final_dir, "extracted_values.json")

    # 24-25: build canonical base for all statements (BS/PL + CF for 24/25)
    if year_block == "2024-25":
        prompt_bs_pl = build_prompt_bs_pl_2024_25(bs_text, pl_text)
        resp_1 = client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {"role": "system", "content": "Return only a single valid JSON object."},
                {"role": "user", "content": prompt_bs_pl},
            ],
            response_format={"type": "json_object"},
            max_tokens=7000
        )
        parsed_bs_pl = json.loads(resp_1.choices[0].message.content)

        parsed = parsed_bs_pl

        if cf_text.strip():
            prompt_cf = build_prompt_cf_2024_25(cf_text)
            resp_2 = client.chat.completions.create(
                model=GPT_MODEL,
                messages=[
                    {"role": "system", "content": "Return only a single valid JSON object."},
                    {"role": "user", "content": prompt_cf},
                ],
                response_format={"type": "json_object"},
            )
            parsed_cf = json.loads(resp_2.choices[0].message.content)
            parsed = _merge_dicts(parsed, parsed_cf)

        cleaned = _postprocess_payload(parsed)

        # If a prior canonical exists, carry forward its value_2023 (for when CF 2023 is inserted later)
        if os.path.isfile(out_path):
            with open(out_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            for k, rec in cleaned.items():
                if k in existing and isinstance(existing[k], dict):
                    v3 = existing[k].get("value_2023", "-")
                    if "value_2023" not in rec or rec["value_2023"] in (None, "", "-"):
                        rec["value_2023"] = v3

        cleaned = _prune_value(cleaned, ("value_2025", "value_2024", "value_2023", "source", "unit"))
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(cleaned, f, ensure_ascii=False, indent=2)

        return out_path

    # 23-24: only inject BS/PL value_2023 into existing canonical file
    elif year_block == "2023-24":
        base_json = {}
        if os.path.isfile(out_path):
            with open(out_path, "r", encoding="utf-8") as f:
                base_json = json.load(f)

        prompt_bs_pl = build_prompt_bs_pl_2023_24(bs_text, pl_text, base_json)
        resp = client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {"role": "system", "content": "Return only a single valid JSON object."},
                {"role": "user", "content": prompt_bs_pl},
            ],
            response_format={"type": "json_object"},
        )
        parsed_2023 = json.loads(resp.choices[0].message.content)

        cleaned_2023 = _postprocess_payload(parsed_2023)
        cleaned_2023 = _prune_value(cleaned_2023, ("value_2023",))

        # inject ONLY for existing keys (BS/PL only)
        for k, rec in base_json.items():
            if rec.get("source") in ("bs", "pl"):
                rec["value_2023"] = cleaned_2023.get(k, {}).get("value_2023", "-")

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(base_json, f, ensure_ascii=False, indent=2)

        return out_path

    # Other folders ignored
    return out_path
