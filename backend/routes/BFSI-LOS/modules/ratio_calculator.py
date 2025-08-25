import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from config.config import OPENAI_API_KEY, GPT_MODEL


def _build_system_prompt() -> str:
    # The model reads extracted_values.json and returns ONLY the ratios JSON.
    return """
You are a financial ratios assistant. You will receive a JSON object
(EXTRACTED_VALUES_JSON) that contains extracted financial metrics with this shape:

{
  "<Canonical Metric Name>": {
    "matched_value": string|null,
    "value_latest": string|number|null,  // latest-year value; may include commas or a unit like "₹ crore"
    "source": string|null,
    "confidence": number
  },
  ...
}

Compute the following four ratios and return ONLY this strict JSON object:

{
  "DSCR":         {"value": <number|null>, "threshold": "<1.2", "red_flag": <bool|null>},
  "Debt/Equity":  {"value": <number|null>, "threshold": ">2.0", "red_flag": <bool|null>},
  "PAT Margin":   {"value": <number|null>, "threshold": "<10%",  "red_flag": <bool|null>},
  "Current Ratio":{"value": <number|null>, "threshold": "<1.0", "red_flag": <bool|null>}
}

No other keys or text.

### Formulas
- DSCR = (PAT + Interest + Depreciation) / (Interest + Principal)
- Debt/Equity = Total Debt / Net Worth
- PAT Margin = (PAT / Revenue) * 100
- Current Ratio = Current Assets / Current Liabilities

### Mapping rules (use latest-year values)
- PAT: "Net Profit"
- Interest: "Interest Expense".
- Depreciation: "Depreciation".
- Principal: "Principal"
- Total Debt: "Total Debt"
- Net Worth: "Shareholder's Equity".
- Revenue: "Revenue".
- Current Assets: "Current Assets".
- Current Liabilities: "Current Liabilities".

Do not invent any values for the above metrics if they are missing from the input JSON.

### Normalization & numeric handling
- Round each ratio `value` to 4 decimal places (PAT Margin is a percentage number, not a string).

### Threshold evaluation (set red_flag)
- For thresholds given as strings with an operator and a number/percent:
  - For DSCR: "<1.2"  -> red_flag = (value < 1.2)
  - For Debt/Equity: ">2.0"  -> red_flag = (value > 2.0)
  - For PAT Margin: "<10%"   -> red_flag = (value < 10.0)   
  - For Current Ratio: "<1.0"  -> red_flag = (value < 1.0)

If any required input is missing or non-numeric, return the JSON object,
setting that ratio's `value` to null and `red_flag` to null (do not invent numbers or input values).

Return ONLY the JSON object described above.
""".strip()


def _build_user_prompt(extracted_values: dict) -> str:
    return "EXTRACTED_VALUES_JSON:\n" + json.dumps(extracted_values, ensure_ascii=False)


def compute_ratio(financial_data: str) -> dict:
    """
    Compute DSCR, Debt/Equity, PAT Margin, and Current Ratio using values in extracted_values.json.

    Args:
        financial_data: Path to extracted_values.json

    Returns:
        dict: The ratios JSON that is also saved as ratios.json next to the input file.
    """
    if not os.path.isfile(financial_data):
        raise FileNotFoundError(f"extracted_values.json not found at: {financial_data}")

    with open(financial_data, "r", encoding="utf-8") as f:
        extracted_values = json.load(f)

    load_dotenv()
    client = OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(extracted_values)

    resp = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )

    ratios = json.loads(resp.choices[0].message.content)

    out_path = os.path.join(os.path.dirname(financial_data), "ratios.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ratios, f, indent=2, ensure_ascii=False)

    print(f" Ratios computed. Saved to {out_path}")
    return out_path
