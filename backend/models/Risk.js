const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    threshold: { type: String },
    max: { type: Number },
    value_2023: { type: mongoose.Schema.Types.Mixed },
    red_flag_2023: { type: Boolean },
    score_2023: { type: Number },
    value_2024: { type: mongoose.Schema.Types.Mixed },
    red_flag_2024: { type: Boolean },
    score_2024: { type: Number },
    value_2025: { type: mongoose.Schema.Types.Mixed },
    red_flag_2025: { type: Boolean },
    score_2025: { type: Number },
  },
  { _id: false }
);

const FinancialStrengthSchema = new mongoose.Schema(
  {
    per_ratio_max: { type: Number },
    scores: { type: Map, of: ScoreSchema }, // dynamic keys like DSCR, Debt/Equity, etc.
    subtotals: {
      2023: { type: Number },
      2024: { type: Number },
      2025: { type: Number },
    },
  },
  { _id: false }
);

const ManagementQualitySchema = new mongoose.Schema(
  {
    scores: {
      2023: { type: Number },
      2024: { type: Number },
      2025: { type: Number },
    },
  },
  { _id: false }
);

const IndustryRiskSchema = new mongoose.Schema(
  {
    scores: {
      2023: { type: Number },
      2024: { type: Number },
      2025: { type: Number },
    },
  },
  { _id: false }
);

const WeightsSchema = new mongoose.Schema(
  {
    financial_strength: { type: Number },
    management_quality: { type: Number },
    industry_risk: { type: Number },
  },
  { _id: false }
);

const RiskSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    lead_id: { type: String, required: true },
    weights: WeightsSchema,
    financial_strength: FinancialStrengthSchema,
    management_quality: ManagementQualitySchema,
    industry_risk: IndustryRiskSchema,
    total_score: {
      2023: { type: Number },
      2024: { type: Number },
      2025: { type: Number },
    },
    risk_bucket: {
      2023: { type: String },
      2024: { type: String },
      2025: { type: String },
    },
    red_flags: {
      2023: [{ type: String }],
      2024: [{ type: String }],
      2025: [{ type: String }],
    },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

// ✅ Explicitly bind this to the "risk" collection
module.exports = mongoose.model("Risk", RiskSchema, "risk");
