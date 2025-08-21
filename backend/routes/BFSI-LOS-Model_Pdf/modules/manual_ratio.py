import os
import json
import re
from typing import Any, Dict
from pymongo import MongoClient

# ------------------------
# Parsing helpers
# ------------------------
def _safe_number(value):
    """
    Convert a string with commas, currency symbols, or units into a float. 
    Handles "₹ crore", "lakh", "%" etc. Returns None if invalid.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None
    s = value.strip().lower()
    if s in ("null", ""):
        return None
    # Remove commas, ₹, $, etc.
    s = re.sub(r"[₹$,]", "", s)

    # Crore/Lakh conversion
    multiplier = 1
    if "crore" in s:
        multiplier = 1e7
        s = re.sub(r"[^\d.\-]", "", s)
    elif "lakh" in s:
        multiplier = 1e5
        s = re.sub(r"[^\d.\-]", "", s)
    else:
        s = re.sub(r"[^\d.\-]", "", s)
    try:
        return float(s) * multiplier
    except:
        return None

def _to_number(x: Any) -> float:
    """
    Convert extracted JSON values to float.
    Handles 'null', None, strings with commas, parentheses negatives (e.g., '(963)').
    """
    if x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if s.lower() in ("null", ""):
        return 0.0
    s = s.replace(",", "")
    if s.startswith("(") and s.endswith(")"):
        s = "-" + s[1:-1]
    try:
        return float(s)
    except:
        return 0.0

def _round4(x: float) -> float:
    """
    Round to 4 decimal places for precision in financial ratios.
    """
    return round(x, 4)

def _round_or_none(value):
    """Round to 4 decimals if not None."""
    return round(value, 4) if value is not None else None

def _safe_div(n: float, d: float) -> float:
    """Safe division, returns 0 if denominator is 0 or None."""
    return 0.0 if d in (0, None) else n / d

def _percent(n: float) -> float:
    """Convert ratio to percentage."""
    return n * 100.0

def _build_ratio(value: float, threshold: str, crossed: bool) -> Dict[str, Any]:
    """Build a ratio dict with value, threshold, red_flag."""
    return {"value": value, "threshold": threshold, "red_flag": bool(crossed)}

def _check_threshold(value: float, threshold: str) -> bool:
    """Check if a value crosses its threshold."""
    if not threshold or threshold == "N/A":
        return False
    thr = threshold.strip()
    val = value
    thr_num = _to_number(thr.rstrip("%").lstrip("<>"))
    if thr.startswith("<"):
        return val < thr_num
    elif thr.startswith(">"):
        return val > thr_num
    return False

def _get_current(d: Dict[str, Any], key: str) -> float:
    """
    Get latest or 2025 value from extracted dict under the exact key as in JSON.
    Returns 0.0 if missing.
    """
    node = d.get(key, {})
    return _to_number(node.get("value_2025") or node.get("value_latest"))

# ------------------------
# Core ratio computations
# ------------------------
def compute_ratios(financial_data: Any) -> Dict[str, Dict[str, Any]]:
    """
    Compute 13+ financial ratios using extracted JSON values.

    Ratios:
    1) DSCR = (PAT + Depreciation + Finance cost) / (Finance cost + Lease payments)
    2) Debt/Equity = Lease liabilities / Total equity
    3) PAT Margin (%) = PAT / Revenue * 100
    4) Current Ratio = Current assets / Current liabilities
    5) Quick Ratio = (Current assets - Inventory) / Current liabilities
    6) Interest Coverage = EBIT / Finance cost
    7) Net profit Margin (%) = PAT / Revenue * 100
    8) Return on Assets (%) = PAT / Total assets * 100
    9) Return on Equity (%) = PAT / Total equity * 100
    10) EBITDA Margin (%) = (EBIT + Depreciation) / Revenue * 100
    11) Accounts Receivable Days = Trade receivables / Revenue * 365
    12) Accounts Payable Days = Trade payables / Total expenses * 365
    13) Asset Turnover Ratio = Revenue / Total assets
    """
    if isinstance(financial_data, dict):
        ev = financial_data
    else:
        with open(financial_data, "r", encoding="utf-8") as f:
            ev = json.load(f)

    ratios: Dict[str, Dict[str, Any]] = {}

    # ----------------- Simple manual ratios -----------------
    pat = _get_current(ev, "Profit for the year") or _get_current(ev, "Net Profit")
    interest = _get_current(ev, "Finance cost") or _get_current(ev, "Interest Expense")
    dep = _get_current(ev, "Depreciation and amortization expenses") or _get_current(ev, "Depreciation")
    principal = _get_current(ev, "Payment of lease liabilities") or _get_current(ev, "Principal")
    total_debt = _get_current(ev, "Total Debt")
    net_worth = _get_current(ev, "Total equity") or _get_current(ev, "Shareholder's Equity")
    revenue = _get_current(ev, "Revenue from operations") or _get_current(ev, "Revenue")
    current_assets = _get_current(ev, "Total current assets") or _get_current(ev, "Current Assets")
    current_liabilities = _get_current(ev, "Total current liabilities") or _get_current(ev, "Current Liabilities")

    # DSCR
    if all(v is not None for v in [pat, interest, dep, principal]) and (interest + principal) != 0:
        dscr_val = _round_or_none((pat + interest + dep) / (interest + principal))
        ratios["DSCR"] = _build_ratio(dscr_val, "<1.2", dscr_val < 1.2)

    # Debt/Equity
    if total_debt and net_worth not in (None, 0):
        de_val = _round_or_none(total_debt / net_worth)
        ratios["Debt/Equity"] = _build_ratio(de_val, ">2.0", de_val > 2.0)

    # PAT Margin
    if pat and revenue not in (None, 0):
        pat_margin_val = _round_or_none((pat / revenue) * 100)
        ratios["PAT Margin"] = _build_ratio(pat_margin_val, "<10%", pat_margin_val < 10)

    # Current Ratio
    if current_assets and current_liabilities not in (None, 0):
        curr_ratio_val = _round_or_none(current_assets / current_liabilities)
        ratios["Current Ratio"] = _build_ratio(curr_ratio_val, "<1.0", curr_ratio_val < 1.0)

    # ----------------- Extended ratios -----------------
    lease_nc = _get_current(ev, "Lease liabilities (Non-current)")
    lease_c = _get_current(ev, "Lease liabilities (Current)")
    lease_liabilities = lease_nc + lease_c
    total_equity = _get_current(ev, "Total equity")
    EBIT = _get_current(ev, "Profit before tax")
    total_assets = _get_current(ev, "Total assets")
    inventory = _get_current(ev, "Inventories") or 0
    trade_receivables = _get_current(ev, "Trade receivables")
    trade_payables_micro = _get_current(ev, "Trade payables - Total outstanding dues of micro enterprises and small enterprises")
    trade_payables_others = _get_current(ev, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises")
    total_expenses = _get_current(ev, "Total expenses")

    # Current + Quick Ratio
    curr_ratio = _round4(_safe_div(current_assets, current_liabilities))
    ratios["Current Ratio"] = _build_ratio(curr_ratio, "<1.0", _check_threshold(curr_ratio, "<1.0"))
    quick_ratio = _round4(_safe_div(max(current_assets - inventory, 0.0), current_liabilities))
    ratios["Quick Ratio"] = _build_ratio(quick_ratio, "<1.0", _check_threshold(quick_ratio, "<1.0"))

    # Extended ratios calculations
    dscr_val2 = _round4(_safe_div(pat + dep + interest, interest + abs(principal)))
    ratios["DSCR"] = _build_ratio(dscr_val2, "<1.2", _check_threshold(dscr_val2, "<1.2"))

    de_val2 = _round4(_safe_div(lease_liabilities, total_equity))
    ratios["Debt/Equity"] = _build_ratio(de_val2, ">2.0", _check_threshold(de_val2, ">2.0"))

    pat_margin2 = _round4(_percent(_safe_div(pat, revenue)))
    ratios["PAT Margin"] = _build_ratio(pat_margin2, "<10%", _check_threshold(pat_margin2, "<10%"))

    int_cov = _round4(_safe_div(EBIT, interest))
    ratios["Interest Coverage"] = _build_ratio(int_cov, "<1.5", _check_threshold(int_cov, "<1.5"))

    npm = _round4(_percent(_safe_div(pat, revenue)))
    ratios["Net Profit Margin"] = _build_ratio(npm, "<5%", _check_threshold(npm, "<5%"))

    roa = _round4(_percent(_safe_div(pat, total_assets)))
    ratios["Return on Assets"] = _build_ratio(roa, "<5%", _check_threshold(roa, "<5%"))

    roe = _round4(_percent(_safe_div(pat, total_equity)))
    ratios["Return on equity"] = _build_ratio(roe, "<8%", _check_threshold(roe, "<8%"))

    ebitda_margin = _round4(_percent(_safe_div(EBIT + dep, revenue)))
    ratios["EBITDA Margin"] = _build_ratio(ebitda_margin, "<10%", _check_threshold(ebitda_margin, "<10%"))

    ar_days = _round4(_safe_div(trade_receivables, revenue) * 365)
    ratios["Accounts Receivable Days"] = _build_ratio(ar_days, ">90", _check_threshold(ar_days, ">90"))

    trade_payables = trade_payables_micro + trade_payables_others
    ap_days = _round4(_safe_div(trade_payables, total_expenses) * 365)
    ratios["Accounts payable days"] = _build_ratio(ap_days, ">30", _check_threshold(ap_days, ">30"))

    asset_turnover = _round4(_safe_div(revenue, total_assets))
    ratios["Asset Turnover Ratio"] = _build_ratio(asset_turnover, "<1.0", _check_threshold(asset_turnover, "<1.0"))

    return ratios

# ------------------------
# Compute + persist to JSON and MongoDB
# ------------------------
def compute_and_persist(financial_data_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Public entrypoint:
    - computes ratios (manual + extended)
    - writes ratios.json next to the input JSON
    - inserts plain ratios dict into MongoDB: LOMAS.ratios
    """
    ratios = compute_ratios(financial_data_path)
    out_path = os.path.join(os.path.dirname(financial_data_path), "ratios.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ratios, f, indent=2, ensure_ascii=False)
    print(f"Ratios computed. Saved to {out_path}")

    # MongoDB output
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["ratios"]

    doc = ratios.copy()
    if customer_name := os.getenv("CUSTOMER_NAME"):
        doc["customer_name"] = customer_name
    if loan_id := os.getenv("LOAN_ID"):
        doc["lead_id"] = loan_id

    result = col.insert_one(doc)
    print(f"Ratios saved to MongoDB 'LOMAS.ratios' with _id={result.inserted_id}")
    return ratios
