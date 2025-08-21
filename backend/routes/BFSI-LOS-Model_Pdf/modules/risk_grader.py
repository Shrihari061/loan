import os, json
from typing import Optional, Dict, Any
from pymongo import MongoClient

# Weights
FS_WEIGHT = 50.0    # Financial Strength
MGMT_WEIGHT = 30.0  # Management Quality
IND_WEIGHT  = 20.0  # Industry Risk

# The 13 ratios we expect from manual_ratio.py
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

PER_RATIO_MAX = FS_WEIGHT / 13.0  # ≈ 3.8461538462


def _load_json(p: str) -> Dict[str, Any]:
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def compute_risk(
    extracted_values_path: str,
    ratios_path: str,
    seed: Optional[int] = None,
    out_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compute weighted risk score using updated 13-ratio logic.
    Financial Strength: sum of 13 ratios, each = FS_WEIGHT/13 if red_flag == False else 0
    Management Quality: fixed 25
    Industry Risk: fixed 15
    Total = FS + Management + Industry
    """
    if not os.path.isfile(extracted_values_path):
        raise FileNotFoundError(extracted_values_path)
    if not os.path.isfile(ratios_path):
        raise FileNotFoundError(ratios_path)

    ratios = _load_json(ratios_path)

    # Build per-ratio scoring
    fs_total = 0.0
    red_flags = []
    ratio_scores: Dict[str, Any] = {}

    for name in RATIO_NAMES:
        obj = ratios.get(name) or {}
        rf = bool(obj.get("red_flag", True))  # default to True if missing -> conservative
        score = 0.0 if rf else PER_RATIO_MAX

        ratio_scores[name] = {
            "value": obj.get("value"),
            "threshold": obj.get("threshold"),
            "red_flag": rf,
            "score": round(score, 4),
            "max": round(PER_RATIO_MAX, 4),
        }

        if rf:
            # Human-friendly reason
            if name == "Debt/Equity":
                red_flags.append("Debt/Equity above threshold")
            elif name in ("PAT Margin", "Net profit Margin"):
                red_flags.append(f"{name} below threshold")
            elif name == "Current Ratio":
                red_flags.append("Current Ratio below threshold")
            elif name == "Accounts Receivable Days":
                red_flags.append("Receivable days above threshold")
            elif name == "Accounts payable days":
                red_flags.append("Payable days above threshold")
            else:
                red_flags.append(f"{name} breached threshold or missing")

        fs_total += score

    # Fixed components
    mgmt_score = 25
    ind_score  = 15

    total = round(fs_total + mgmt_score + ind_score, 2)
    # Bucket heuristic
    bucket = "Low Risk" if total > 80 else "Medium Risk" if total >= 50 else "High Risk"

    out = {
        "weights": {
            "financial_strength": FS_WEIGHT,
            "management_quality": MGMT_WEIGHT,
            "industry_risk": IND_WEIGHT
        },
        "financial_strength": {
            "per_ratio_max": round(PER_RATIO_MAX, 4),
            "scores": ratio_scores,
            "subtotal": round(fs_total, 4)
        },
        "management_quality": {"score": mgmt_score},
        "industry_risk": {"score": ind_score},
        "total_score": total,
        "risk_bucket": bucket,
        "red_flags": red_flags,
    }

    out_path = out_path or os.path.join(os.path.dirname(extracted_values_path), "risk_rating.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f" Risk rating saved to {out_path}")
    
    # --- MongoDB output ---
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["risk"]

    # Insert with fields at root (not nested under "risk")
    doc = out if isinstance(out, dict) else {"data": out}

    # Attach identifiers from env vars
    if customer_name := os.getenv("CUSTOMER_NAME"):
        doc["customer_name"] = customer_name
    if loan_id := os.getenv("LOAN_ID"):
        doc["lead_id"] = loan_id

    result = col.insert_one(doc)
    print(f" Risk rating saved to MongoDB 'LOMAS.risk' with _id={result.inserted_id}")

    return out
