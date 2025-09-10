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


def _get_current(d: Dict[str, Any], key: str, year: str) -> float:
    """
    Get value from extracted dict under the exact key as in JSON.
    Returns 0.0 if missing.
    """
    node = d.get(key, {})
    return _to_number(node.get(year))


def _safe_div(n: float, d: float) -> float:
    return 0.0 if d in (0, None) else n / d


def _percent(n: float) -> float:
    return n * 100.0


def _round2(x: float) -> float:
    # Keep higher precision for financial ratios; round to 2 decimals by default
    return float(f"{x:.2f}")


def _build_ratio(value: float, threshold: str, crossed: bool, year: int) -> Dict[str, Any]:
    # If threshold ends with %, format value as percentage string
    if isinstance(value, (int, float)) and threshold and threshold.strip().endswith("%"):
        value_str = f"{value:.2f}%"
    else:
        value_str = value
    return {
        "threshold": threshold,
        f"value_{year}": value_str,
        f"red_flag_{year}": bool(crossed),
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
def compute_ratios(financial_data_path: Any) -> Dict[str, Dict[str, Any]]:
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
    - Accounts Payable Days = (Average accounts payable/Purchase Proxy) * 365
    - Asset Turnover Ratio = Revenue from operations / Total assets
    """
    if isinstance(financial_data_path, dict):
        ev = financial_data_path
    else:
        with open(financial_data_path, "r", encoding="utf-8") as f:
            ev = json.load(f)
   
    keys = ["value_2023", "value_2024", "value_2025"]
    
    for key in keys:
        # ----------------- Compute ratios -----------------
        
        if key == "value_2023":
            ratios_2023: Dict[str, Dict[str, Any]] = {}
            ratios = ratios_2023
            year = 2023

        elif key == "value_2024":
            ratios_2024: Dict[str, Dict[str, Any]] = {}
            ratios = ratios_2024
            year = 2024
            
        elif key == "value_2025":
            ratios_2025: Dict[str, Dict[str, Any]] = {}
            ratios = ratios_2025
            year = 2025

        # 1) DSCR
        # Numerator: PAT + Depreciation + Finance cost
        # Denominator: Finance cost + Payment of lease liabilities

        pat = _get_current(ev, "Profit for the year",key)
        finance_cost = _get_current(ev, "Finance cost",key)
        dep = _get_current(ev, "Depreciation and amortization expenses",key)
        lease_payments = _get_current(ev, "Payment of lease liabilities",key)
        lease_payments_abs = abs(lease_payments) # --> As value is negative i.e. with parentheses in financial statement
        
        dscr_num = pat + dep + finance_cost
        dscr_den = finance_cost + lease_payments_abs
        dscr_val = _round2(_safe_div(dscr_num, dscr_den))
        dscr_thr = "<1.2"
        ratios[f"DSCR_{year}"] = _build_ratio(dscr_val, dscr_thr, _check_threshold(dscr_val, dscr_thr), year)

        # 2) Debt/Equity
        lease_nc = _get_current(ev, "Financial liabilities - Lease liabilities (Non-current)",key)
        lease_c = _get_current(ev, "Financial liabilities - Lease liabilities (Current)",key)
        lease_liabilities = lease_nc + lease_c
        total_equity = _get_current(ev, "Total equity",key)

        de_val = _round2(_safe_div(lease_liabilities, total_equity))
        de_thr = ">2.0"
        ratios[f"Debt/Equity_{year}"] = _build_ratio(de_val, de_thr, _check_threshold(de_val, de_thr), year)

        # 3) PAT Margin (%)
        revenue = _get_current(ev, "Revenue from operations", key)
        
        pat_margin = _round2(_percent(_safe_div(pat, revenue)))
        patm_thr = "<10%"
        ratios[f"PAT Margin_{year}"] = _build_ratio(pat_margin, patm_thr, _check_threshold(pat_margin, patm_thr), year)

        # 4) Current Ratio
        total_current_assets = _get_current(ev, "Total current assets",key)
        total_current_liabilities = _get_current(ev, "Total current liabilities",key)

        curr_ratio = _round2(_safe_div(total_current_assets, total_current_liabilities))
        curr_thr = "<1.0"
        ratios[f"Current Ratio_{year}"] = _build_ratio(curr_ratio, curr_thr, _check_threshold(curr_ratio, curr_thr), year)

        # 5) Quick Ratio  (Inventory often 0 for IT services; fallbacks handled)
        inventory = _get_current(ev, "Inventories",key) or 0.0

        quick_ratio = _round2(_safe_div(max(total_current_assets - inventory, 0.0), total_current_liabilities))
        quick_thr = "<1.0"
        ratios[f"Quick Ratio_{year}"] = _build_ratio(quick_ratio, quick_thr, _check_threshold(quick_ratio, quick_thr), year)

        # 6) Interest Coverage  (PBT / Finance cost) as per your sheet
        EBIT = _get_current(ev, "Profit before tax",key)

        int_cov = _round2(_safe_div(EBIT, finance_cost))
        int_cov_thr = "<1.5"
        ratios[f"Interest Coverage_{year}"] = _build_ratio(int_cov, int_cov_thr, _check_threshold(int_cov, int_cov_thr), year)

        # 7) Net profit Margin (%) (same as PAT Margin per workbook)
        npm = _round2(_percent(_safe_div(pat, revenue)))
        npm_thr = "<5%"
        ratios[f"Net profit Margin_{year}"] = _build_ratio(npm, npm_thr, _check_threshold(npm, npm_thr), year)

        # 8) Return on Assets (%) = PAT / Total assets * 100
        total_assets = _get_current(ev, "Total assets",key)
        roa = _round2(_percent(_safe_div(pat, total_assets)))
        roa_thr = "<5%"
        ratios[f"Return on Assets_{year}"] = _build_ratio(roa, roa_thr, _check_threshold(roa, roa_thr), year)

        # 9) Return on Equity (%) = PAT / Total equity * 100
        roe = _round2(_percent(_safe_div(pat, total_equity)))
        roe_thr = "<8%"
        ratios[f"Return on equity_{year}"] = _build_ratio(roe, roe_thr, _check_threshold(roe, roe_thr), year)

        # 10) EBITDA Margin (%) = (PBT + Depreciation) / Revenue * 100 (matches your sheet)
        ebitda_margin = _round2(_percent(_safe_div(EBIT + dep, revenue)))
        ebitda_thr = "<10%"
        ratios[f"EBITDA Margin_{year}"] = _build_ratio(ebitda_margin, ebitda_thr, _check_threshold(ebitda_margin, ebitda_thr), year)

        # 11) Accounts Receivable Days = Trade receivables / Revenue * 365
        trade_receivables = _get_current(ev, "Trade receivables",key)
        ar_days = _round2(_safe_div(trade_receivables, revenue) * 365.0)
        ar_days_thr = ">90"
        ratios[f"Accounts Receivable Days_{year}"] = _build_ratio(ar_days, ar_days_thr, _check_threshold(ar_days, ar_days_thr), year)

        # 12) Accounts payable days = (Average accounts payable/Purchase Proxy) * 365
        Cost_of_technical_sub_contractors = _get_current(ev, "Cost of technical sub-contractors",key)
        Travel_Expenses = _get_current(ev, "Travel expenses",key)
        Cost_of_software_packages_and_others = _get_current(ev, "Cost of software packages and others",key)
        Communication_expenses = _get_current(ev, "Communication expenses",key)
        Consultancy_and_professional_fees = _get_current(ev, "Consultancy and professional charges",key)
        Other_Expenses = _get_current(ev, "Other expenses",key)

        Purchase_Proxy = Cost_of_technical_sub_contractors + Travel_Expenses + Cost_of_software_packages_and_others \
                        + Communication_expenses + Consultancy_and_professional_fees + Other_Expenses

        if year == 2023:
            # As we are only considering data from 2023-2025, we directly take the value for 2023 instead of taking the average of 2022 and 2023 valeus
            Average_accounts_payable = _get_current(ev,"Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises","value_2023")

        elif year == 2024:
            Average_accounts_payable_1 = _get_current(ev,"Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises","value_2023")
            Average_accounts_payable_2 = _get_current(ev,"Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises","value_2024")

            Average_accounts_payable = (Average_accounts_payable_1 + Average_accounts_payable_2) / 2.0
        
        elif year == 2025:
            Average_accounts_payable_1 = _get_current(ev,"Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises","value_2024")
            Average_accounts_payable_2 = _get_current(ev,"Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises","value_2025")

            Average_accounts_payable = (Average_accounts_payable_1 + Average_accounts_payable_2) / 2.0


        ap_days = _round2(_safe_div(Average_accounts_payable, Purchase_Proxy) * 365.0)

        ap_thr = ">30"
        ratios[f"Accounts payable days_{year}"] = _build_ratio(ap_days, ap_thr, _check_threshold(ap_days, ap_thr), year)

        # 13) Asset Turnover Ratio = Revenue / Total assets
        asset_turnover = _round2(_safe_div(revenue, total_assets))
        asset_turnover_thr = "<1.0"
        ratios[f"Asset Turnover Ratio_{year}"] = _build_ratio(asset_turnover, asset_turnover_thr, _check_threshold(asset_turnover, asset_turnover_thr), year)

        out_path = os.path.join(os.path.dirname(financial_data_path), f"ratios_{year}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(ratios, f, indent=2, ensure_ascii=False)
        
        

    # Merge ratios_2023, ratios_2024, ratios_2025 into one JSON file
    merged_ratios: Dict[str, Dict[str, Any]] = {}

    for ratios_dict, year in [
        (ratios_2023, 2023),
        (ratios_2024, 2024),
        (ratios_2025, 2025),
    ]:
        for k, v in ratios_dict.items():
            ratio_name = k.rsplit("_", 1)[0]
            if ratio_name not in merged_ratios:
                merged_ratios[ratio_name] = {}
            # Only add threshold if not already present
            if "threshold" not in merged_ratios[ratio_name]:
                merged_ratios[ratio_name]["threshold"] = v.get("threshold")
            merged_ratios[ratio_name][f"value_{year}"] = v.get(f"value_{year}")
            merged_ratios[ratio_name][f"red_flag_{year}"] = v.get(f"red_flag_{year}")

    final_out_path = os.path.join(os.path.dirname(financial_data_path), "ratios.json")
    with open(final_out_path, "w", encoding="utf-8") as f:
        json.dump(merged_ratios, f, indent=2, ensure_ascii=False)
    

    print(f"Ratios computed manually. Saved to {final_out_path}")
    
    return final_out_path

def push_ratio_to_Mongo(ratio_path: str) -> Dict[str, Dict[str, Any]]:
        """
        Public entrypoint:
        - computes ratios
        - writes ratios.json next to the input json
        - inserts plain ratios dict into MongoDB: LOMAS.ratios
        """

        # --- MongoDB output ---
        mongo_client = MongoClient(
            "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        )
        db = mongo_client["LOMAS"]
        col = db["ratios"]

        with open(ratio_path, "r", encoding="utf-8") as f:
            ratios = json.load(f)

        doc = ratios if isinstance(ratios, dict) else {"data": ratios}
        result = col.insert_one(doc)
        print(f" Ratios saved to MongoDB 'LOMAS.ratios' with _id={result.inserted_id}")

        return ratios
