import os, json, random
from typing import Optional, Dict, Any
from pymongo import MongoClient

# Weights
FS_WEIGHT = 50.0    # Financial Strength
MGMT_WEIGHT = 30.0  # Management Quality
IND_WEIGHT  = 20.0  # Industry Risk
RATIO_NAMES = ["DSCR", "Debt/Equity", "PAT Margin", "Current Ratio"]
PER_RATIO_MAX = FS_WEIGHT / len(RATIO_NAMES)  # 12.5 each


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
    Compute weighted risk score from explicit paths; save risk_rating.json next to extracted_values.json by default.
    Financial Strength (50%) gives 12.5 points per ratio that PASSES (red_flag == False), else 0.
    Management Quality (30%) and Industry Risk (20%) are random in [0, max].
    """
    if not os.path.isfile(extracted_values_path):
        raise FileNotFoundError(extracted_values_path)
    if not os.path.isfile(ratios_path):
        raise FileNotFoundError(ratios_path)

    ratios = _load_json(ratios_path)

    # Financial Strength
    fs_total, red_flags, ratio_scores = 0.0, [], {}
    for name in RATIO_NAMES:
        obj = ratios.get(name) or {}
        rf = obj.get("red_flag")
        passed = (rf is False)
        score = PER_RATIO_MAX if passed else 0.0
        ratio_scores[name] = {
            "value": obj.get("value"),
            "threshold": obj.get("threshold"),
            "red_flag": rf,
            "score": round(score, 2),
            "max": PER_RATIO_MAX,
        }
        if not passed:
            if name == "Debt/Equity":
                red_flags.append("Debt-to-Equity above threshold")
            elif name == "PAT Margin":
                red_flags.append("PAT margin below threshold")
            else:
                red_flags.append(f"{name} below threshold")
        fs_total += score

    # Random components
    rng = random.Random(seed)
    mgmt_score = round(rng.uniform(0, MGMT_WEIGHT), 2)
    ind_score  = round(rng.uniform(0, IND_WEIGHT), 2)

    total = round(fs_total + mgmt_score + ind_score, 2)
    bucket = "Low Risk" if total > 80 else "Medium Risk" if total >= 50 else "High Risk"

    out = {
        "weights": {
            "financial_strength": FS_WEIGHT,
            "management_quality": MGMT_WEIGHT,
            "industry_risk": IND_WEIGHT
        },
        "financial_strength": {
            "per_ratio_max": PER_RATIO_MAX,
            "scores": ratio_scores,
            "subtotal": round(fs_total, 2)
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
    if isinstance(out, dict):
        doc = out
    else:
        doc = {"data": out}

    # 🔹 Extra Part: attach identifiers from env vars
    if customer_name := os.getenv("CUSTOMER_NAME"):
        doc["customer_name"] = customer_name
    if loan_id := os.getenv("LOAN_ID"):
        doc["lead_id"] = loan_id

    result = col.insert_one(doc)
    print(f" Risk rating saved to MongoDB 'LOMAS.risk' with _id={result.inserted_id}")

    return out
