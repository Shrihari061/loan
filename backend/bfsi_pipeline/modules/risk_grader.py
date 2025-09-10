import os, json
from typing import Optional, Dict, Any
from pymongo import MongoClient

# Fixed weights (remain the same)
FS_WEIGHT = 50.0        # Financial Strength
MGMT_WEIGHT = 30.0      # Management Quality (weight only)
IND_WEIGHT  = 20.0      # Industry Risk (weight only)

# The 13 ratios
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


def _load_json(p: str) -> Dict[str, Any]:
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def _bucket(total: float) -> str:
    return "Low Risk" if total > 80 else ("Medium Risk" if total >= 50 else "High Risk")


def compute_risk(
    extracted_values_path: str,
    ratios_path: str,
    out_path: Optional[str] = None
) -> Dict[str, Any]:
    if not os.path.isfile(ratios_path):
        raise FileNotFoundError(ratios_path)

    ratios = _load_json(ratios_path)

    ratio_scores: Dict[str, Any] = {}
    fs_subtotals = {str(y): 0.0 for y in YEARS}
    mgmt_scores  = {str(y): MGMT_SCORE for y in YEARS}
    ind_scores   = {str(y): IND_SCORE for y in YEARS}
    totals, buckets = {}, {}
    red_flags_by_year = {str(y): [] for y in YEARS}

    # Per-ratio scoring
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
        "weights": {   # keep full weights
            "financial_strength": FS_WEIGHT,
            "management_quality": MGMT_WEIGHT,
            "industry_risk": IND_WEIGHT
        },
        "financial_strength": {
            "per_ratio_max": round(PER_RATIO_MAX, 2),
            "scores": ratio_scores,
            "subtotals": {k: round(v, 2) for k, v in fs_subtotals.items()}
        },
        "management_quality": {"scores": mgmt_scores},
        "industry_risk": {"scores": ind_scores},
        "total_score": totals,
        "risk_bucket": buckets,
        "red_flags": red_flags_by_year
    }

    out_path = out_path or os.path.join(os.path.dirname(extracted_values_path), "risk_rating.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f" Risk rating saved to {out_path}")

    # Mongo insert
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["risk"]

    doc = out if isinstance(out, dict) else {"data": out}
    result = col.insert_one(doc)
    print(f" Risk rating saved to MongoDB 'LOMAS.risk' with _id={result.inserted_id}")

    return out
