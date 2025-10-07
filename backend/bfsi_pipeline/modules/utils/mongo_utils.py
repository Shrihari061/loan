# bfsi_pipeline/modules/utils/mongo_utils.py

import re
from typing import Any, Dict, Optional
from pymongo import MongoClient


def _normalize_value(val: Any) -> Any:
    """
    Normalize values from Mongo:
    - "0" -> 0
    - "123.45" -> 123.45
    - "(963)" -> "(963)"  (preserve bracket style negatives as string)
    - "-" or "" -> 0
    - int/float -> unchanged
    """
    if isinstance(val, (int, float)):
        return val
    if not isinstance(val, str):
        return 0

    val = val.strip()

    # Empty or dash -> treat as zero
    if val in ["", "-", "–", None]:
        return 0

    # Preserve bracket negatives exactly as string
    if val.startswith("(") and val.endswith(")"):
        return val

    # Try numeric conversion
    try:
        if "." in val:
            return float(val)
        return int(val)
    except ValueError:
        return val


def get_extracted_values(
    lead_id: str,
    customer_name: str,
    mongo_uri: str = "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    db_name: str = "LOMAS"
) -> Optional[Dict[str, Any]]:
    """
    Fetch extracted_values from Mongo for a given lead_id AND customer_name.
    Returns a normalized dict ready for ratios/risk/summaries code.
    """
    client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=60000,
    )
    try:
        db = client[db_name]
        query = {"lead_id": lead_id, "customer_name": customer_name}
        doc = db.extracted_values.find_one(query, projection={"data": 1, "_id": 0})
        if not doc:
            return None

        normalized = {}
        for k, v in doc.get("data", {}).items():
            normalized[k] = {
                "value_2025": _normalize_value(v.get("value_2025")),
                "value_2024": _normalize_value(v.get("value_2024")),
                "value_2023": _normalize_value(v.get("value_2023")),
                "source": v.get("source"),
                "unit": v.get("unit"),
            }
        return normalized
    finally:
        try:
            client.close()
        except Exception:
            pass


def upsert_ratios(
    lead_id: str,
    customer_name: str,
    ratios: Dict[str, Any],
    mongo_uri: str = "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    db_name: str = "LOMAS"
):
    client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=60000,
    )
    try:
        db = client[db_name]
        db.ratios.update_one(
            {"lead_id": lead_id, "customer_name": customer_name},
            {"$set": {"lead_id": lead_id, "customer_name": customer_name, **ratios}},
            upsert=True,
        )
    finally:
        try:
            client.close()
        except Exception:
            pass


def upsert_risk(
    lead_id: str,
    customer_name: str,
    risk: Dict[str, Any],
    mongo_uri: str = "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    db_name: str = "LOMAS"
):
    client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=60000,
    )
    try:
        db = client[db_name]
        db.risk.update_one(
            {"lead_id": lead_id, "customer_name": customer_name},
            {"$set": {"lead_id": lead_id, "customer_name": customer_name, **risk}},
            upsert=True,
        )
    finally:
        try:
            client.close()
        except Exception:
            pass


def upsert_summaries(
    lead_id: str,
    customer_name: str,
    summaries: Dict[str, Any],
    mongo_uri: str = "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    db_name: str = "LOMAS"
):
    client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=60000,
    )
    try:
        db = client[db_name]
        db.summaries.update_one(
            {"lead_id": lead_id, "customer_name": customer_name},
            {"$set": {"lead_id": lead_id, "customer_name": customer_name, **summaries}},
            upsert=True,
        )
    finally:
        try:
            client.close()
        except Exception:
            pass
