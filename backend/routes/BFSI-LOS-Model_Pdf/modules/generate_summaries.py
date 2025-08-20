import os, json
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from config.config import OPENAI_API_KEY, GPT_MODEL
from pymongo import MongoClient


def _build_system_prompt() -> str:
    return """
You are a credit analyst. You will receive three JSON objects:
1) EXTRACTED_VALUES_JSON  (latest-year line items)
2) RATIOS_JSON            (four ratios with thresholds & red flags)
3) RISK_RATING_JSON       (weighted score, bucket, red flags)

Return ONLY this JSON:
{
  "financial_summary_&_ratios": "<5-7 concise bullets along with the following headers; Revenue and Profitability, Operational efficiency, Leverage and liquidity>",
  "executive_summary": "<2-4 sentence overview including business context and overall risk tone>",
  "loan_purpose": "<3-6 concise bullets explaining the use of loan proceeds, project cost, loan requested>",
  "swot_analysis": "<2-3 concise bullets for each sub-heading; Strengths, weaknesses, opportunities and threats>",
  "security_offered":"<2-3 concise bullets for each sub-heading; primary security, collateral security, personal guarantees>",
  "recommendation":"<4-6 concise bullets summarizing the key recommendations for the loan>"
}

Guidelines:
- State overall risk bucket and list red flags from the risk JSON.
- Reference key figures if present (Revenue, PAT, DSCR, Debt/Equity, PAT Margin, Current Ratio).
- Be factual and concise. If some values are null, acknowledge briefly and move on.
- If information for a certain sub-heading doesn't exist, create it.
""".strip()


def _load_json(p: str) -> Dict[str, Any]:
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_summaries(
    extracted_values_path: str,
    ratios_path: str,
    risk_path: Optional[str] = None,
    out_path: Optional[str] = None
) -> Dict[str, str]:
    """
    Create executive & financial summaries from explicit paths.
    Saves summaries.json next to extracted_values.json by default.
    """
    if not os.path.isfile(extracted_values_path):
        raise FileNotFoundError(extracted_values_path)
    if not os.path.isfile(ratios_path):
        raise FileNotFoundError(ratios_path)

    risk_path = risk_path or os.path.join(os.path.dirname(extracted_values_path), "risk_rating.json")
    if not os.path.isfile(risk_path):
        raise FileNotFoundError(f"{risk_path} (run compute_risk first or pass risk_path)")

    extracted = _load_json(extracted_values_path)
    ratios = _load_json(ratios_path)
    risk = _load_json(risk_path)

    load_dotenv()
    client = OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = _build_system_prompt()
    user_prompt = (
        "EXTRACTED_VALUES_JSON:\n" + json.dumps(extracted, ensure_ascii=False) +
        "\n\nRATIOS_JSON:\n" + json.dumps(ratios, ensure_ascii=False) +
        "\n\nRISK_RATING_JSON:\n" + json.dumps(risk, ensure_ascii=False)
    )

    resp = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[{"role": "system", "content": system_prompt},
                  {"role": "user", "content": user_prompt}],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    content = json.loads(resp.choices[0].message.content)

    summaries_path = os.path.join(os.path.dirname(extracted_values_path), "summaries.json")
    with open(summaries_path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    print(f"Summaries saved to {summaries_path}")

    # --- MongoDB output ---
    mongo_client = MongoClient(
        "mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    db = mongo_client["LOMAS"]
    col = db["summaries"]

    doc = {
        "financial_summary_&_ratios": content.get("financial_summary_&_ratios"),
        "executive_summary": content.get("executive_summary"),
        "loan_purpose": content.get("loan_purpose"),
        "swot_analysis": content.get("swot_analysis"),
        "security_offered": content.get("security_offered"),
        "recommendation": content.get("recommendation"),
    }

    # 🔹 Extra Part: attach identifiers from env vars
    if customer_name := os.getenv("CUSTOMER_NAME"):
        doc["customer_name"] = customer_name
    if loan_id := os.getenv("LOAN_ID"):
        doc["lead_id"] = loan_id

    result = col.insert_one(doc)
    print(f" Summaries saved to MongoDB 'LOMAS.summaries' with _id={result.inserted_id}")
    return content
