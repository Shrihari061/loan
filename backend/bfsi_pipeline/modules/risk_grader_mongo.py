from typing import Any, Dict


# Fixed weights (same as risk_grader.py)
FS_WEIGHT = 50.0        # Financial Strength
MGMT_WEIGHT = 30.0      # Management Quality (weight only)
IND_WEIGHT  = 20.0      # Industry Risk (weight only)

# The 13 ratios (must match manual_ratio.py keys)
RATIO_NAMES = [
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

PER_RATIO_MAX = FS_WEIGHT / 13.0
YEARS = [2023, 2024, 2025]

# Fixed actual scores (different from weights)
MGMT_SCORE = 25.0
IND_SCORE  = 15.0


def _bucket(total: float) -> str:
    return "Low Risk" if total > 80 else ("Medium Risk" if total >= 50 else "High Risk")


def compute_risk(ratios: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Input ratios are expected in merged structure from manual_ratio(_mongo).py:
      ratios[ratio_name] = {
        "threshold": str,
        "value_2023": Any,
        "red_flag_2023": bool,
        "value_2024": Any,
        "red_flag_2024": bool,
        "value_2025": Any,
        "red_flag_2025": bool
      }

    Returns the same structured dict as risk_grader.py without writing files.
    """
    ratio_scores: Dict[str, Any] = {}
    fs_subtotals = {str(y): 0.0 for y in YEARS}
    mgmt_scores  = {str(y): MGMT_SCORE for y in YEARS}
    ind_scores   = {str(y): IND_SCORE for y in YEARS}
    totals, buckets = {}, {}
    red_flags_by_year = {str(y): [] for y in YEARS}

    # Per-ratio scoring based on red_flags
    for name in RATIO_NAMES:
        obj = ratios.get(name) or {}
        entry = {
            "threshold": obj.get("threshold"),
            "max": round(PER_RATIO_MAX, 2),
        }

        for y in YEARS:
            v_key, f_key, s_key = f"value_{y}", f"red_flag_{y}", f"score_{y}"
            rf = bool(obj.get(f_key, True))
            score = 0.0 if rf else PER_RATIO_MAX

            entry[v_key] = obj.get(v_key)
            entry[f_key] = rf
            entry[s_key] = round(score, 2)

            fs_subtotals[str(y)] += score
            if rf:
                red_flags_by_year[str(y)].append(name)

        ratio_scores[name] = entry

    # Totals & buckets
    for y in YEARS:
        fs = round(fs_subtotals[str(y)], 2)
        mg, ind = mgmt_scores[str(y)], ind_scores[str(y)]
        total = round(fs + mg + ind, 2)
        totals[str(y)], buckets[str(y)] = total, _bucket(total)

    out = {
        "weights": {
            "financial_strength": FS_WEIGHT,
            "management_quality": MGMT_WEIGHT,
            "industry_risk": IND_WEIGHT,
        },
        "financial_strength": {
            "per_ratio_max": round(PER_RATIO_MAX, 2),
            "scores": ratio_scores,
            "subtotals": {k: round(v, 2) for k, v in fs_subtotals.items()},
        },
        "management_quality": {"scores": mgmt_scores},
        "industry_risk": {"scores": ind_scores},
        "total_score": totals,
        "risk_bucket": buckets,
        "red_flags": red_flags_by_year,
    }

    return out
