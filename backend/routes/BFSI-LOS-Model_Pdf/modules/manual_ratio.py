import os
import json
import re
from pymongo import MongoClient

def _safe_number(value):
    """Convert a string with commas, currency symbols, or units into a float. Returns None if invalid."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None

    # Remove commas, currency symbols, units like "₹ crore", "%" etc.
    cleaned = re.sub(r"[₹$,]", "", value).strip().lower()

    # Handle crore/lakh conversions
    if "crore" in cleaned:
        try:
            num = float(re.sub(r"[^\d\.\-]", "", cleaned))
            return num * 1e7
        except:
            return None
    if "lakh" in cleaned:
        try:
            num = float(re.sub(r"[^\d\.\-]", "", cleaned))
            return num * 1e5
        except:
            return None

    try:
        return float(re.sub(r"[^\d\.\-]", "", cleaned))
    except:
        return None


def _round_or_none(value):
    """Round to 4 decimal places if value is not None."""
    return round(value, 4) if value is not None else None


def compute_ratio_manual(financial_data: str) -> str:
    """
    Manually compute DSCR, Debt/Equity, PAT Margin, and Current Ratio.

    Args:
        financial_data: Path to extracted_values.json

    Returns:
        Path to saved ratios.json
    """
    if not os.path.isfile(financial_data):
        raise FileNotFoundError(f"extracted_values.json not found at: {financial_data}")

    with open(financial_data, "r", encoding="utf-8") as f:
        extracted_values = json.load(f)

    # Mapping to canonical keys
    def get_metric(name):
        metric_entry = extracted_values.get(name)
        if isinstance(metric_entry, dict):
            return _safe_number(metric_entry.get("value_latest"))
        return None
        
    pat = get_metric("Net Profit")
    interest = get_metric("Interest Expense")
    depreciation = get_metric("Depreciation")
    principal = get_metric("Principal")
    total_debt = get_metric("Total Debt")
    net_worth = get_metric("Shareholder's Equity")
    revenue = get_metric("Revenue")
    current_assets = get_metric("Current Assets")
    current_liabilities = get_metric("Current Liabilities")

    ratios = {
        "DSCR": {
            "value": None,
            "threshold": "<1.2",
            "red_flag": None
        },
        "Debt/Equity": {
            "value": None,
            "threshold": ">2.0",
            "red_flag": None
        },
        "PAT Margin": {
            "value": None,
            "threshold": "<10%",
            "red_flag": None
        },
        "Current Ratio": {
            "value": None,
            "threshold": "<1.0",
            "red_flag": None
        }
    }

    # DSCR calculation
    if all(v is not None for v in [pat, interest, depreciation, principal]) and (interest + principal) != 0:
        dscr_value = (pat + interest + depreciation) / (interest + principal)
        ratios["DSCR"]["value"] = _round_or_none(dscr_value)
        ratios["DSCR"]["red_flag"] = dscr_value < 1.2

    # Debt/Equity calculation
    if total_debt is not None and net_worth not in (None, 0):
        de_value = total_debt / net_worth
        ratios["Debt/Equity"]["value"] = _round_or_none(de_value)
        ratios["Debt/Equity"]["red_flag"] = de_value > 2.0

    # PAT Margin calculation
    if pat is not None and revenue not in (None, 0):
        pat_margin_value = (pat / revenue) * 100
        ratios["PAT Margin"]["value"] = _round_or_none(pat_margin_value)
        ratios["PAT Margin"]["red_flag"] = pat_margin_value < 10.0

    # Current Ratio calculation
    if current_assets is not None and current_liabilities not in (None, 0):
        current_ratio_value = current_assets / current_liabilities
        ratios["Current Ratio"]["value"] = _round_or_none(current_ratio_value)
        ratios["Current Ratio"]["red_flag"] = current_ratio_value < 1.0

    # Save output
    out_path = os.path.join(os.path.dirname(financial_data), "ratios.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ratios, f, indent=2, ensure_ascii=False)

    print(f"Ratios computed manually. Saved to {out_path}")
    
    # --- MongoDB output ---
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["ratios"]

    # Store each ratio at root (no nesting under "ratios" key)
    if isinstance(ratios, dict):
        doc = ratios
    else:
        doc = {"data": ratios}

    # 🔹 Extra Part: attach identifiers from env vars
    if customer_name := os.getenv("CUSTOMER_NAME"):
        doc["customer_name"] = customer_name
    if loan_id := os.getenv("LOAN_ID"):
        doc["lead_id"] = loan_id

    result = col.insert_one(doc)
    print(f" Ratios saved to MongoDB 'LOMAS.ratios' with _id={result.inserted_id}")
    
    return out_path
