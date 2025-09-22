import os
import json
from typing import Any, Dict

# from pymongo import MongoClient

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


def _normalize_key(k: str) -> str:
    """Normalize keys to reduce mismatches between extracted JSON and ratio formulas."""
    return k.strip().lower().replace("&", "and")


def _get_current(d: Dict[str, Any], key: str, year: str) -> float:
    """
    Get value from extracted dict under the exact (or normalized) key.
    Logs a warning if the key is missing.
    """
    norm_target = _normalize_key(key)
    for existing_key, node in d.items():
        if _normalize_key(existing_key) == norm_target:
            return _to_number(node.get(year))
    print(f"[warn] Missing key: '{key}' for {year} → using 0.0")
    return 0.0


def _safe_div(n: float, d: float) -> float:
    return 0.0 if d in (0, None) else n / d


def _percent(n: float) -> float:
    return n * 100.0


def _round2(x: float) -> float:
    return float(f"{x:.2f}")


def _build_ratio(value: float, threshold: str, crossed: bool, year: int) -> Dict[str, Any]:
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
    if thr.endswith("%"):
        thr_num = _to_number(thr[:-1])
    else:
        thr_num = _to_number(thr.lstrip("<>").strip())
    if thr.startswith("<"):
        return val < thr_num
    elif thr.startswith(">"):
        return val > thr_num
    return False


# -------------------------
# Core computation
# -------------------------
def compute_ratios(financial_data_path: Any) -> Dict[str, Dict[str, Any]]:
    """
    Compute the 13 ratios using values from the extracted JSON.
    """
    if isinstance(financial_data_path, dict):
        ev = financial_data_path
    else:
        with open(financial_data_path, "r", encoding="utf-8") as f:
            ev = json.load(f)

    keys = ["value_2023", "value_2024", "value_2025"]

    for key in keys:
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

        # ----------------- Ratios -----------------

        # 1) DSCR
        pat = _get_current(ev, "Profit for the year", key)
        finance_cost = _get_current(ev, "Finance cost", key)
        dep = _get_current(ev, "Depreciation and amortization expenses", key)
        lease_payments = _get_current(ev, "Payment of lease liabilities", key)
        lease_payments_abs = abs(lease_payments)
        dscr_num = pat + dep + finance_cost
        dscr_den = finance_cost + lease_payments_abs
        dscr_val = _round2(_safe_div(dscr_num, dscr_den))
        ratios[f"DSCR_{year}"] = _build_ratio(dscr_val, "<1.2", _check_threshold(dscr_val, "<1.2"), year)

        # 2) Debt/Equity (reverted to earlier working logic)
        lease_nc = _get_current(ev, "Financial liabilities - Lease liabilities (Non-current)", key)
        lease_c = _get_current(ev, "Financial liabilities - Lease liabilities (Current)", key)
        lease_liabilities = lease_nc + lease_c
        total_equity = _get_current(ev, "Total equity", key)
        de_val = _round2(_safe_div(lease_liabilities, total_equity))
        ratios[f"Debt/Equity_{year}"] = _build_ratio(de_val, ">2.0", _check_threshold(de_val, ">2.0"), year)

        # 3) PAT Margin (%)
        revenue = _get_current(ev, "Revenue from operations", key)
        pat_margin = _round2(_percent(_safe_div(pat, revenue)))
        ratios[f"PAT Margin_{year}"] = _build_ratio(pat_margin, "<10%", _check_threshold(pat_margin, "<10%"), year)

        # 4) Current Ratio
        total_current_assets = _get_current(ev, "Total current assets", key)
        total_current_liabilities = _get_current(ev, "Total current liabilities", key)
        curr_ratio = _round2(_safe_div(total_current_assets, total_current_liabilities))
        ratios[f"Current Ratio_{year}"] = _build_ratio(curr_ratio, "<1.0", _check_threshold(curr_ratio, "<1.0"), year)

        # 5) Quick Ratio
        inventory = _get_current(ev, "Inventories", key) or 0.0
        quick_ratio = _round2(_safe_div(max(total_current_assets - inventory, 0.0), total_current_liabilities))
        ratios[f"Quick Ratio_{year}"] = _build_ratio(quick_ratio, "<1.0", _check_threshold(quick_ratio, "<1.0"), year)

        # 6) Interest Coverage
        EBIT = _get_current(ev, "Profit before tax", key)
        int_cov = _round2(_safe_div(EBIT, finance_cost))
        ratios[f"Interest Coverage_{year}"] = _build_ratio(int_cov, "<1.5", _check_threshold(int_cov, "<1.5"), year)

        # 7) Net Profit Margin (%)
        npm = _round2(_percent(_safe_div(pat, revenue)))
        ratios[f"Net profit Margin_{year}"] = _build_ratio(npm, "<5%", _check_threshold(npm, "<5%"), year)

        # 8) Return on Assets (%)
        total_assets = _get_current(ev, "Total assets", key)
        roa = _round2(_percent(_safe_div(pat, total_assets)))
        ratios[f"Return on Assets_{year}"] = _build_ratio(roa, "<5%", _check_threshold(roa, "<5%"), year)

        # 9) Return on Equity (%)
        roe = _round2(_percent(_safe_div(pat, total_equity)))
        ratios[f"Return on equity_{year}"] = _build_ratio(roe, "<8%", _check_threshold(roe, "<8%"), year)

        # 10) EBITDA Margin (%)
        ebitda_margin = _round2(_percent(_safe_div(EBIT + dep, revenue)))
        ratios[f"EBITDA Margin_{year}"] = _build_ratio(ebitda_margin, "<10%", _check_threshold(ebitda_margin, "<10%"), year)

        # 11) Accounts Receivable Days = Trade receivables / Revenue * 365
        trade_receivables = _get_current(ev, "Trade receivables", key)
        if trade_receivables == 0.0:
            trade_receivables = _get_current(ev, "Financial assets - Trade receivables", key)
            if trade_receivables == 0.0:
                trade_receivables = _get_current(ev, "Financial assets - Trade receivables (Current)", key)
        ar_days = _round2(_safe_div(trade_receivables, revenue) * 365.0)
        ar_days_thr = ">90"
        ratios[f"Accounts Receivable Days_{year}"] = _build_ratio(ar_days, ar_days_thr, _check_threshold(ar_days, ar_days_thr), year)

        # 12) Accounts Payable Days = (Average accounts payable / Purchase Proxy) * 365
        c1 = _get_current(ev, "Cost of technical sub-contractors", key)
        c2 = _get_current(ev, "Travel expenses", key)
        c3 = _get_current(ev, "Cost of software packages and others", key)
        c4 = _get_current(ev, "Communication expenses", key)
        c5 = _get_current(ev, "Consultancy and professional charges", key)
        c6 = _get_current(ev, "Other expenses", key)

        Purchase_Proxy = c1 + c2 + c3 + c4 + c5 + c6

        if year == 2023:
            Average_accounts_payable = _get_current(
                ev,
                "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises",
                "value_2023",
            )
        elif year == 2024:
            ap1 = _get_current(ev, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2023")
            ap2 = _get_current(ev, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2024")
            Average_accounts_payable = (ap1 + ap2) / 2.0
        else:  # 2025
            ap1 = _get_current(ev, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2024")
            ap2 = _get_current(ev, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2025")
            Average_accounts_payable = (ap1 + ap2) / 2.0

        ap_days = _round2(_safe_div(Average_accounts_payable, Purchase_Proxy) * 365.0)
        ap_thr = ">30"
        ratios[f"Accounts payable days_{year}"] = _build_ratio(ap_days, ap_thr, _check_threshold(ap_days, ap_thr), year)

        # 13) Asset Turnover Ratio
        asset_turnover = _round2(_safe_div(revenue, total_assets))
        ratios[f"Asset Turnover Ratio_{year}"] = _build_ratio(asset_turnover, "<1.0", _check_threshold(asset_turnover, "<1.0"), year)

        # Save year-specific ratios
        out_path = os.path.join(os.path.dirname(financial_data_path), f"ratios_{year}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(ratios, f, indent=2, ensure_ascii=False)

    # Merge ratios
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
            if "threshold" not in merged_ratios[ratio_name]:
                merged_ratios[ratio_name]["threshold"] = v.get("threshold")
            merged_ratios[ratio_name][f"value_{year}"] = v.get(f"value_{year}")
            merged_ratios[ratio_name][f"red_flag_{year}"] = v.get(f"red_flag_{year}")

    final_out_path = os.path.join(os.path.dirname(financial_data_path), "ratios.json")
    with open(final_out_path, "w", encoding="utf-8") as f:
        json.dump(merged_ratios, f, indent=2, ensure_ascii=False)

    print(f"Ratios computed manually. Saved to {final_out_path}")
    return final_out_path
