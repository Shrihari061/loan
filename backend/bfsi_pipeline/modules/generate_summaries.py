import os, json
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from config.config import OPENAI_API_KEY, GPT_MODEL
from pymongo import MongoClient


def _build_system_prompt() -> str:
    return """
You are a senior credit and loan approval manager. You will receive three JSON objects:
1) EXTRACTED_VALUES_JSON  (2023, 2024, 2025 year line items)
2) RATIOS_JSON            (13 ratios with thresholds & red flags across 3 years of data)
3) RISK_RATING_JSON       (weighted score, bucket, red flags for each of 2023/2024/2025)

You must return ONLY the following JSON object and NOTHING else (no markdown, no commentary):
{
  "financial_summary_&_ratios": "<5-7 concise bullets along the sub-headers: Revenue and Profitability; Operational efficiency; Leverage and liquidity. Each bullet must reference concrete figures and clearly indicate 3-year trends (2023→2024→2025).>",
  "executive_summary": "<2-4 sentences summarizing the business context, overall 3-year trajectory, risk tone, and the latest year’s risk bucket.>",
  "loan_purpose": "<3-6 concise bullets covering intended use of proceeds, total project cost (if available), requested amount (if available), tenor, and any refinancing or capex details. If unknown, write 'Not disclosed' succinctly.>",
  "swot_analysis": "<Provide 2-3 short bullets EACH for: Strengths; Weaknesses; Opportunities; Threats—grounded in 3-year data/ratios where possible.>",
  "security_offered": "<Provide 2-3 short bullets EACH for: Primary Security; Collateral Security; Personal Guarantees. If absent, write 'Not disclosed'.>",
  "recommendation": "<6-8 concise bullets that read like a real credit memo conclusion. Start with a decisive verdict (Approve / Decline / Defer) and then justify it using 3-year evidence. Explicitly reference: DSCR, Debt/Equity, PAT Margin, Current Ratio, and the per-year risk buckets/scores from RISK_RATING_JSON. Call out material red flags and how they affect the decision. If Approve/Defer, include specific conditions (e.g., minimum DSCR covenant, additional collateral, promoter guarantee, information covenants, periodic monitoring). Close with a crisp risk-aware rationale tied to observed trends (improving, stable, weakening) from 2023→2025.>"
}

STRICT INSTRUCTIONS
- KEEP EXACTLY these six top-level keys. Do not add or remove keys. Values must be strings (the long text you write goes inside the string for each key).
- Always analyze TRENDS across 2023, 2024, 2025. Prefer explicit year tags (e.g., “PAT Margin: 12.4% (2023) → 14.1% (2024) → 10.2% (2025) ↓ y/y in 2025”).
- Reference these if present: Revenue, PAT, DSCR, Debt/Equity, PAT Margin, Current Ratio. If any are missing, say “Not available” briefly and move on.
- Use the RISK_RATING_JSON to report (a) per-year financial strength subtotals, (b) per-year total scores & buckets, and (c) top red-flagged ratios for each year; weave those into the narrative.
- Be factual, concise, and neutral; avoid generic filler. Prefer numbers and direction-of-change (↑/↓/→).
- Formatting inside strings:
  • Use short bullets with semicolons/commas for readability.
  • For “financial_summary_&_ratios”, group bullets under the three sub-headers exactly as: “Revenue and Profitability: …”, “Operational efficiency: …”, “Leverage and liquidity: …”.
  • In “swot_analysis” and “security_offered”, prefix each sub-heading name once, then list the bullets.
  • In “recommendation”, start with “Verdict: <Approve/Decline/Defer>.” then provide justifications for the verdict by analyzing the company's performance and projects through the lens of the provided data.
- Never invent numbers; only compute obvious percentages from provided values if both numerator and denominator are present. If uncertain, state “approx.” or “Not available”.
- Output must be valid JSON (double quotes, escaped characters if any). No markdown. No extra commentary.
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

     # --- MongoDB output (replaces file write) ---
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

    result = col.insert_one(doc)
    print(f" Summaries saved to MongoDB 'LOMAS.summaries' with _id={result.inserted_id}")
    return content
