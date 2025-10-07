"""
bfsi_pipeline/modules/manual_ratio_mongo.py

Replicate the logic and output structure of manual_ratio.py, but operate on
extracted values already loaded from Mongo (dict in-memory), and return the
merged ratios dict with thresholds, value_YYYY, red_flag_YYYY for 2023/2024/2025.
"""

from typing import Any, Dict


def _to_number(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if s.lower() == "null" or s == "":
        return 0.0
    s = s.replace(",", "")
    if s.startswith("(") and s.endswith(")"):
        s = "-" + s[1:-1]
    try:
        return float(s)
    except ValueError:
        return 0.0


def _normalize_key(k: str) -> str:
    return k.strip().lower().replace("&", "and")


def _get_current(d: Dict[str, Any], key: str, year_key: str) -> float:
    norm_target = _normalize_key(key)
    for existing_key, node in d.items():
        if _normalize_key(existing_key) == norm_target:
            return _to_number(node.get(year_key))
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
        try:
            thr_num = float(thr[:-1])
        except Exception:
            thr_num = 0.0
    else:
        try:
            thr_num = float(thr.lstrip("<>").strip())
        except Exception:
            thr_num = 0.0
    if thr.startswith("<"):
        return val < thr_num
    elif thr.startswith(">"):
        return val > thr_num
    return False


def compute_ratios(extracted_values: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
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
        else:
            ratios_2025: Dict[str, Dict[str, Any]] = {}
            ratios = ratios_2025
            year = 2025

        # 1) DSCR
        pat = _get_current(extracted_values, "Profit for the year", key)
        finance_cost = _get_current(extracted_values, "Finance cost", key) or _get_current(extracted_values, "Finance costs", key)
        dep = _get_current(extracted_values, "Depreciation and amortization expenses", key) or _get_current(extracted_values, "Depreciation and amortisation expense", key)
        lease_payments = _get_current(extracted_values, "Payment of lease liabilities", key)
        lease_payments_abs = abs(lease_payments)
        dscr_num = pat + dep + finance_cost
        dscr_den = finance_cost + lease_payments_abs
        dscr_val = _round2(_safe_div(dscr_num, dscr_den))
        ratios[f"DSCR_{year}"] = _build_ratio(dscr_val, "<1.2", _check_threshold(dscr_val, "<1.2"), year)

        # 2) Debt/Equity (lease liabilities / total equity)
        lease_nc = _get_current(extracted_values, "Financial liabilities - Lease liabilities (Non-current)", key)
        lease_c = _get_current(extracted_values, "Financial liabilities - Lease liabilities (Current)", key)
        lease_liabilities = lease_nc + lease_c
        total_equity = _get_current(extracted_values, "Total equity", key)
        de_val = _round2(_safe_div(lease_liabilities, total_equity))
        ratios[f"Debt/Equity_{year}"] = _build_ratio(de_val, ">2.0", _check_threshold(de_val, ">2.0"), year)

        # 3) PAT Margin (%)
        revenue = _get_current(extracted_values, "Revenue from operations", key)
        pat_margin = _round2(_percent(_safe_div(pat, revenue)))
        ratios[f"PAT Margin_{year}"] = _build_ratio(pat_margin, "<10%", _check_threshold(pat_margin, "<10%"), year)

        # 4) Current Ratio
        total_current_assets = _get_current(extracted_values, "Total current assets", key)
        total_current_liabilities = _get_current(extracted_values, "Total current liabilities", key)
        curr_ratio = _round2(_safe_div(total_current_assets, total_current_liabilities))
        ratios[f"Current Ratio_{year}"] = _build_ratio(curr_ratio, "<1.0", _check_threshold(curr_ratio, "<1.0"), year)

        # 5) Quick Ratio
        inventory = _get_current(extracted_values, "Inventories", key) or 0.0
        quick_ratio = _round2(_safe_div(max(total_current_assets - inventory, 0.0), total_current_liabilities))
        ratios[f"Quick Ratio_{year}"] = _build_ratio(quick_ratio, "<1.0", _check_threshold(quick_ratio, "<1.0"), year)

        # 6) Interest Coverage
        EBIT = _get_current(extracted_values, "Profit before tax", key)
        int_cov = _round2(_safe_div(EBIT, finance_cost))
        ratios[f"Interest Coverage_{year}"] = _build_ratio(int_cov, "<1.5", _check_threshold(int_cov, "<1.5"), year)

        # 7) Net Profit Margin (%)
        npm = _round2(_percent(_safe_div(pat, revenue)))
        ratios[f"Net profit Margin_{year}"] = _build_ratio(npm, "<5%", _check_threshold(npm, "<5%"), year)

        # 8) Return on Assets (%)
        total_assets = _get_current(extracted_values, "Total assets", key)
        roa = _round2(_percent(_safe_div(pat, total_assets)))
        ratios[f"Return on Assets_{year}"] = _build_ratio(roa, "<5%", _check_threshold(roa, "<5%"), year)

        # 9) Return on Equity (%)
        roe = _round2(_percent(_safe_div(pat, total_equity)))
        ratios[f"Return on equity_{year}"] = _build_ratio(roe, "<8%", _check_threshold(roe, "<8%"), year)

        # 10) EBITDA Margin (%)
        ebitda_margin = _round2(_percent(_safe_div(EBIT + dep, revenue)))
        ratios[f"EBITDA Margin_{year}"] = _build_ratio(ebitda_margin, "<10%", _check_threshold(ebitda_margin, "<10%"), year)

        # 11) Accounts Receivable Days
        trade_receivables = _get_current(extracted_values, "Trade receivables", key)
        if trade_receivables == 0.0:
            trade_receivables = _get_current(extracted_values, "Financial assets - Trade receivables", key)
            if trade_receivables == 0.0:
                trade_receivables = _get_current(extracted_values, "Financial assets - Trade receivables (Current)", key)
        ar_days = _round2(_safe_div(trade_receivables, revenue) * 365.0)
        ar_days_thr = ">90"
        ratios[f"Accounts Receivable Days_{year}"] = _build_ratio(ar_days, ar_days_thr, _check_threshold(ar_days, ar_days_thr), year)

        # 12) Accounts Payable Days
        c1 = _get_current(extracted_values, "Cost of technical sub-contractors", key)
        c2 = _get_current(extracted_values, "Travel expenses", key)
        c3 = _get_current(extracted_values, "Cost of software packages and others", key)
        c4 = _get_current(extracted_values, "Communication expenses", key)
        c5 = _get_current(extracted_values, "Consultancy and professional charges", key)
        c6 = _get_current(extracted_values, "Other expenses", key)
        Purchase_Proxy = c1 + c2 + c3 + c4 + c5 + c6

        if year == 2023:
            Average_accounts_payable = _get_current(
                extracted_values,
                "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises",
                "value_2023",
            )
        elif year == 2024:
            ap1 = _get_current(extracted_values, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2023")
            ap2 = _get_current(extracted_values, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2024")
            Average_accounts_payable = (ap1 + ap2) / 2.0
        else:
            ap1 = _get_current(extracted_values, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2024")
            ap2 = _get_current(extracted_values, "Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises", "value_2025")
            Average_accounts_payable = (ap1 + ap2) / 2.0

        ap_days = _round2(_safe_div(Average_accounts_payable, Purchase_Proxy) * 365.0)
        ap_thr = ">30"
        ratios[f"Accounts payable days_{year}"] = _build_ratio(ap_days, ap_thr, _check_threshold(ap_days, ap_thr), year)

        # 13) Asset Turnover Ratio
        asset_turnover = _round2(_safe_div(revenue, total_assets))
        ratios[f"Asset Turnover Ratio_{year}"] = _build_ratio(asset_turnover, "<1.0", _check_threshold(asset_turnover, "<1.0"), year)

    # Merge ratios across years
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

    # Enforce the same ratio ordering as manual_ratio.py when returning
    desired_order = [
        "DSCR",
        "Debt/Equity",
        "PAT Margin",
        "Current Ratio",
        "Quick Ratio",
        "Interest Coverage",
        "Net profit Margin",
        "Return on Assets",
        "Return on equity",
        "EBITDA Margin",
        "Accounts Receivable Days",
        "Accounts payable days",
        "Asset Turnover Ratio",
    ]

    ordered: Dict[str, Dict[str, Any]] = {}
    for name in desired_order:
        if name in merged_ratios:
            ordered[name] = merged_ratios[name]

    # Append any unexpected keys at the end to avoid data loss
    for name, val in merged_ratios.items():
        if name not in ordered:
            ordered[name] = val

    return ordered
