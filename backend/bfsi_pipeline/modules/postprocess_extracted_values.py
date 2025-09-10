"""
Post-processing rules for extracted_values.json

Rules:
1) Wherever unit is blank/whitespace -> set to "₹ crore"
2) If value_2025 / value_2024 / value_2023 is a negative *integer*, convert it to a string
   of its absolute value (e.g., -19 -> "19"). Do NOT touch values like "(81)".

You can import and call apply_unit_and_negatives_rules(data) from your cf_extraction.py
right before writing to disk / pushing to Mongo.
"""

from __future__ import annotations
from typing import Dict, Any, Tuple

VALUE_KEYS: Tuple[str, ...] = ("value_2025", "value_2024", "value_2023")


def _is_blank(s: Any) -> bool:
    return not isinstance(s, str) or s.strip() == ""


def _process_record(rec: Dict[str, Any], default_unit: str) -> bool:
    """
    Mutates a single line-item record in place.
    Returns True if anything changed, else False.
    """
    changed = False

    # 1) unit "" -> default_unit ("₹ crore")
    if _is_blank(rec.get("unit", "")):
        rec["unit"] = default_unit
        changed = True

    # 2) negative integer -> string of absolute value
    for key in VALUE_KEYS:
        if key in rec:
            v = rec[key]
            # Only convert if it's an int and negative.
            # Leave strings like "(81)" and non-integers as-is.
            if isinstance(v, int) and v < 0:
                rec[key] = f"({abs(v)})"
                changed = True

    return changed


def apply_unit_and_negatives_rules(
    data: Dict[str, Any],
    default_unit: str = "₹ crore",
) -> Dict[str, Any]:
    """
    Applies the rules to every line item in the extracted JSON.

    Parameters
    ----------
    data : dict
        The parsed extracted_values JSON object.
    default_unit : str
        The unit to set when 'unit' is blank. Default: "₹ crore".

    Returns
    -------
    dict
        The mutated `data` dict (also returned for convenience).
    """
    if not isinstance(data, dict):
        return data

    for k, rec in list(data.items()):
        if isinstance(rec, dict):
            _process_record(rec, default_unit=default_unit)

    return data


# Optional: simple CLI to run directly on a file (in-place by default)
if __name__ == "__main__":
    import json, argparse, os

    parser = argparse.ArgumentParser(description="Post-process extracted_values.json")
    parser.add_argument("input", help="Path to extracted_values.json (input)")
    parser.add_argument("-o", "--output", help="Path to write output (defaults to overwrite input)", default=None)
    parser.add_argument("--default-unit", default="₹ crore", help='Default unit for blank entries (default: "₹ crore")')
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    apply_unit_and_negatives_rules(data, default_unit=args.default_unit)

    out_path = args.output or args.input
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Post-processing done → {out_path}")
