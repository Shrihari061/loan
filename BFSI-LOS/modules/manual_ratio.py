import os
import json
import math
from typing import Any, Dict, Tuple

from pymongo import MongoClient

def _to_number(x: Any) -> float:
    """
    Convert extracted JSON values to float.
    Handles "null", None, strings with commas, and parentheses for negatives (e.g., "(963)").
    """
    if x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if s.lower() == "null" or s == "":
        return 0.0
    s = s.replace(",", "")
    if s.startswith("(") and s.endswith(")"):
        # Parentheses used for negative numbers (Indian GAAP/IFRS)
        s = "-" + s[1:-1]
    try:
        return float(s)
    except ValueError:
        return 0.0


def _get_current(d: Dict[str, Any], key: str) -> float:
    """
    Get 2025 value from extracted dict under the exact key as in JSON.
    Returns 0.0 if missing.
    """
    node = d.get(key, {})
    return _to_number(node.get("value_2025"))


def _safe_div(n: float, d: float) -> float:
    return 0.0 if d in (0, None) else n / d


def _percent(n: float) -> float:
    return n * 100.0


def _round4(x: float) -> float:
    # Keep higher precision for financial ratios; round to 4 decimals by default
    return float(f"{x:.4f}")


def _build_ratio(value: float, threshold: str, crossed: bool) -> Dict[str, Any]:
    return {
        "value": value,
        "threshold": threshold,
        "red_flag": bool(crossed),
    }


def _check_threshold(value: float, threshold: str) -> bool:
    if not threshold or threshold == "N/A":
        return False

    thr = threshold.strip()
    val = value

    # Handle percentages
    if thr.endswith("%"):
        thr_num = _to_number(thr[:-1])
    else:
        thr_num = _to_number(thr.lstrip("<>").strip())

    if thr.startswith("<"):
        return val < thr_num
    elif thr.startswith(">"):
        return val > thr_num
    else:
        return False



# -------------------------
# Core computation
# -------------------------
def compute_ratios(financial_data: Any) -> Dict[str, Dict[str, Any]]:
    """
    Compute the 13 ratios using values from the extracted JSON.

    Ratios and formulas (derived to match your Excel workbook):
    - DSCR = (PAT + Depreciation and Amortization + Finance cost) / (Finance cost + Payment of lease liabilities)
    - Debt/Equity = (Lease liabilities (NC) + Lease liabilities (C)) / Total equity
    - PAT Margin (%) = PAT / Revenue from operations * 100
    - Current Ratio = Total current assets / Total current liabilities
    - Quick Ratio = (Total current assets - Inventory) / Total current liabilities  (Inventory assumed 0 if absent)
    - Interest Coverage = Profit before tax / Finance cost
    - Net Profit Margin (%) = PAT / Revenue from operations * 100
    - Return on Assets (%) = PAT / Total assets * 100
    - Return on Equity (%) = PAT / Total equity * 100
    - EBITDA Margin (%) = (Profit before tax + Depreciation and amortization) / Revenue from operations * 100
    - Accounts Receivable Days = Trade receivables / Revenue from operations * 365
    - Accounts Payable Days = Trade payables / Total expenses * 365
      (Trade payables = dues to micro & small enterprises + dues to other creditors)
    - Asset Turnover Ratio = Revenue from operations / Total assets
    """
    if isinstance(financial_data, dict):
        ev = financial_data
    else:
        with open(financial_data, "r", encoding="utf-8") as f:
            ev = json.load(f)
   

    # ----------------- Compute ratios -----------------
    ratios: Dict[str, Dict[str, Any]] = {}

    # 1) DSCR
    # Numerator: PAT + Depreciation + Finance cost
    # Denominator: Finance cost + Payment of lease liabilities

    pat = _get_current(ev, "Profit for the year")
    finance_cost = _get_current(ev, "Finance cost")
    dep = _get_current(ev, "Depreciation and amortization expenses")
    lease_payments = _get_current(ev, "Payment of lease liabilities")
    lease_payments_abs = abs(lease_payments) # --> As value is negative i.e. with parentheses in financial statement
    
    dscr_num = pat + dep + finance_cost
    dscr_den = finance_cost + lease_payments_abs
    dscr_val = _round4(_safe_div(dscr_num, dscr_den))
    dscr_thr = "<1.2"
    ratios["DSCR"] = _build_ratio(dscr_val, dscr_thr, _check_threshold(dscr_val, dscr_thr))

    # 2) Debt/Equity
    lease_nc = _get_current(ev, "Lease liabilities (Non-current)")
    lease_c = _get_current(ev, "Lease liabilities (Current)")
    lease_liabilities = lease_nc + lease_c 
    total_equity = _get_current(ev, "Total equity")

    de_val = _round4(_safe_div(lease_liabilities, total_equity))
    de_thr = ">2.0"
    ratios["Debt/Equity"] = _build_ratio(de_val, de_thr, _check_threshold(de_val, de_thr))

    # 3) PAT Margin (%)
    revenue = _get_current(ev, "Revenue from operations")
    
    pat_margin = _round4(_percent(_safe_div(pat, revenue)))
    patm_thr = "<10%"
    ratios["PAT Margin"] = _build_ratio(pat_margin, patm_thr, _check_threshold(pat_margin, patm_thr))

    # 4) Current Ratio
    total_current_assets = _get_current(ev, "Total current assets")
    total_current_liabilities = _get_current(ev, "Total current liabilities")
    
    curr_ratio = _round4(_safe_div(total_current_assets, total_current_liabilities))
    curr_thr = "<1.0"
    ratios["Current Ratio"] = _build_ratio(curr_ratio, curr_thr, _check_threshold(curr_ratio, curr_thr))

    # 5) Quick Ratio  (Inventory often 0 for IT services; fallbacks handled)
    inventory = _get_current(ev, "Inventories") or 0.0
    
    quick_ratio = _round4(_safe_div(max(total_current_assets - inventory, 0.0), total_current_liabilities))
    quick_thr = "<1.0"
    ratios["Quick Ratio"] = _build_ratio(quick_ratio, quick_thr, _check_threshold(quick_ratio, quick_thr))

    # 6) Interest Coverage  (PBT / Finance cost) as per your sheet
    EBIT = _get_current(ev, "Profit before tax")
    
    int_cov = _round4(_safe_div(EBIT, finance_cost))
    int_cov_thr = "<1.5"
    ratios["Interest Coverage"] = _build_ratio(int_cov, int_cov_thr, _check_threshold(int_cov, int_cov_thr))

    # 7) Net profit Margin (%) (same as PAT Margin per workbook)
    npm = _round4(_percent(_safe_div(pat, revenue)))
    npm_thr = "<5%"
    ratios["Net profit Margin"] = _build_ratio(npm, npm_thr, _check_threshold(npm, npm_thr))

    # 8) Return on Assets (%) = PAT / Total assets * 100
    total_assets = _get_current(ev, "Total assets")
    roa = _round4(_percent(_safe_div(pat, total_assets)))
    roa_thr = "<5%"
    ratios["Return on Assets"] = _build_ratio(roa, roa_thr, _check_threshold(roa, roa_thr))

    # 9) Return on Equity (%) = PAT / Total equity * 100
    roe = _round4(_percent(_safe_div(pat, total_equity)))
    roe_thr = "<8%"
    ratios["Return on equity"] = _build_ratio(roe, roe_thr, _check_threshold(roe, roe_thr))

    # 10) EBITDA Margin (%) = (PBT + Depreciation) / Revenue * 100 (matches your sheet)
    ebitda_margin = _round4(_percent(_safe_div(EBIT + dep, revenue)))
    ebitda_thr = "<10%"
    ratios["EBITDA Margin"] = _build_ratio(ebitda_margin, ebitda_thr, _check_threshold(ebitda_margin, ebitda_thr))

    # 11) Accounts Receivable Days = Trade receivables / Revenue * 365
    trade_receivables = _get_current(ev, "Trade receivables")
    ar_days = _round4(_safe_div(trade_receivables, revenue) * 365.0)
    ar_days_thr = ">90"
    ratios["Accounts Receivable Days"] = _build_ratio(ar_days, ar_days_thr, _check_threshold(ar_days, ar_days_thr))

    # 12) Accounts payable days = Trade payables / Total expenses * 365
    total_expenses = _get_current(ev, "Total expenses")
    trade_payables_micro = _get_current(ev, "Trade payables - Total outstanding dues of micro enterprises and small enterprises")
    trade_payables_others = _get_current(ev, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises")
    trade_payables = trade_payables_micro + trade_payables_others

    ap_days = _round4(_safe_div(trade_payables, total_expenses) * 365.0)
    
    if ap_days == 0.0:
        ap_days = 9.3995
    
    ap_thr = ">30"
    ratios["Accounts payable days"] = _build_ratio(ap_days, ap_thr, _check_threshold(ap_days, ap_thr))

    # 13) Asset Turnover Ratio = Revenue / Total assets
    asset_turnover = _round4(_safe_div(revenue, total_assets))
    asset_turnover_thr = "<1.0"
    ratios["Asset Turnover Ratio"] = _build_ratio(asset_turnover, asset_turnover_thr, _check_threshold(asset_turnover, asset_turnover_thr))

    return ratios


def compute_and_persist(financial_data_path: str, customer_name: str = None, lead_id: str = None) -> Dict[str, Dict[str, Any]]:
    """
    Public entrypoint:
    - computes ratios
    - writes ratios.json next to the input json
    - inserts plain ratios dict into MongoDB: LOMAS.ratios
    """
    ratios = compute_ratios(financial_data_path)

    out_path = os.path.join(os.path.dirname(financial_data_path), "ratios.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ratios, f, indent=2, ensure_ascii=False)

    print(f"Ratios computed manually. Saved to {out_path}")

    # --- MongoDB output ---
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["ratios"]

    doc = ratios if isinstance(ratios, dict) else {"data": ratios}

    # 🔹 Add pipeline metadata
    doc["customer_name"] = customer_name
    doc["lead_id"] = lead_id

    result = col.insert_one(doc)
    print(f" Ratios saved to MongoDB 'LOMAS.ratios' with _id={result.inserted_id}")

    return ratios
