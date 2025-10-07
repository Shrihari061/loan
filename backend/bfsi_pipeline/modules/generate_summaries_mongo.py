# bfsi_pipeline/modules/generate_summaries_mongo.py

import json
from openai import OpenAI
from config.config import OPENAI_API_KEY, GPT_MODEL


# Create client using imported API key
client = OpenAI(api_key=OPENAI_API_KEY)


def _build_system_prompt() -> str:
    return """
You are a senior credit and loan approval manager. You will receive three JSON objects:
1) EXTRACTED_VALUES_JSON  (2023, 2024, 2025 year line items)
2) RATIOS_JSON            (13 ratios with thresholds & red flags across 3 years of data)
3) RISK_RATING_JSON       (weighted score, bucket, red flags for each of 2023/2024/2025)

You must return ONLY the following JSON object and NOTHING else (no markdown, no commentary):
{
  "financial_summary_&_ratios": "<5-7 concise bullets along the sub-headers: Revenue and Profitability; Operational efficiency; Leverage and liquidity. Each bullet must reference concrete figures and clearly indicate 3-year trends (2023 to 2024 to 2025).>",
  "executive_summary": "<2-4 sentences summarizing the business context, overall 3-year trajectory, risk tone, and the latest year’s risk bucket.>",
  "loan_purpose": "Purchase of Machinery"
  "swot_analysis": "<Provide 2-3 short bullets EACH for: Strengths; Weaknesses; Opportunities; Threats—grounded in 3-year data/ratios where possible.>",
  "security_offered": "Primary Security: , Collateral Security: , Personal Guarantees: "
  "recommendation": "<6-8 concise bullets that read like a real credit memo conclusion. Start with a decisive verdict (Approve / Decline / Defer) and then justify it using 3-year evidence. Explicitly reference: DSCR, Debt/Equity, PAT Margin, Current Ratio, and the per-year risk buckets/scores from RISK_RATING_JSON. Call out material red flags and how they affect the decision. If Approve/Defer, include specific conditions (e.g., minimum DSCR covenant, additional collateral, promoter guarantee, information covenants, periodic monitoring). Close with a crisp risk-aware rationale tied to observed trends (improving, stable, weakening) from 2023→2025.>"
}

STRICT INSTRUCTIONS
- The loan purpose is always “Purchase of Machinery”.
- The security offered must show: Primary Security: , Collateral Security: , Personal Guarantees: 
- KEEP EXACTLY these six top-level keys. Do not add or remove keys. Values must be strings (the long text you write goes inside the string for each key).
- Always analyze TRENDS across 2023, 2024, 2025. Prefer explicit year tags (e.g., “PAT Margin: 12.4% in 2023 to 14.1% in 2024 to 10.2% in 2025”).
- Reference these if present: Revenue, PAT, DSCR, Debt/Equity, PAT Margin, Current Ratio. If any are missing, say “Not available” briefly and move on.
- Use the RISK_RATING_JSON to report (a) per-year financial strength subtotals, (b) per-year total scores & buckets, and (c) top red-flagged ratios for each year; weave those into the narrative.
- Be factual, concise, and neutral; avoid generic filler. Don't use direction-of-change (↑/↓/→) but instead use descriptive language.
- Formatting inside strings:
  • Use short bullets with semicolons/commas for readability.
  • For “financial_summary_&_ratios”, group bullets under the three sub-headers exactly as: “Revenue and Profitability: …”, “Operational efficiency: …”, “Leverage and liquidity: …”.
  • In “swot_analysis” and “security_offered”, prefix each sub-heading name once, then list the bullets.
  • In “recommendation”, start with “Verdict: <Approve/Decline/Defer>.” then provide justifications for the verdict by analyzing the company's performance and projects through the lens of the provided data.
- Never invent numbers; only compute obvious percentages from provided values if both numerator and denominator are present. If uncertain, state “approx.” or “Not available”.
- Output must be valid JSON (double quotes, escaped characters if any). No markdown. No extra commentary.
""".strip()


def generate_summaries(extracted_values: dict, ratios: dict, risk: dict) -> dict:
    """
    Generate summaries using OpenAI API with the same strict system prompt and
    response formatting as generate_summaries.py, but return a dict (no file writes).
    """

    system_prompt = _build_system_prompt()
    user_prompt = (
        "EXTRACTED_VALUES_JSON:\n" + json.dumps(extracted_values, ensure_ascii=False) +
        "\n\nRATIOS_JSON:\n" + json.dumps(ratios, ensure_ascii=False) +
        "\n\nRISK_RATING_JSON:\n" + json.dumps(risk, ensure_ascii=False)
    )

    resp = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    content = resp.choices[0].message.content
    try:
        obj = json.loads(content)
    except Exception:
        # Fallback minimal object preserving keys
        obj = {
            "financial_summary_&_ratios": content or "",
            "executive_summary": "",
            "loan_purpose": "Purchase of Machinery",
            "swot_analysis": "",
            "security_offered": "Primary Security: , Collateral Security: , Personal Guarantees: ",
            "recommendation": "",
        }

    # Ensure all required keys exist
    for key in [
        "financial_summary_&_ratios",
        "executive_summary",
        "loan_purpose",
        "swot_analysis",
        "security_offered",
        "recommendation",
    ]:
        obj.setdefault(key, "")

    return obj
