const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    value: { type: Number },
    threshold: { type: String },
    red_flag: { type: Boolean },
    score: { type: Number },
    max: { type: Number },
  },
  { _id: false }
);

const FinancialStrengthSchema = new mongoose.Schema(
  {
    per_ratio_max: { type: Number },
    scores: { type: Map, of: ScoreSchema }, // dynamic keys like DSCR, Debt/Equity, etc.
    subtotal: { type: Number },
  },
  { _id: false }
);

const ManagementQualitySchema = new mongoose.Schema(
  {
    score: { type: Number },
  },
  { _id: false }
);

const IndustryRiskSchema = new mongoose.Schema(
  {
    score: { type: Number },
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
    total_score: { type: Number },
    risk_bucket: { type: String },
    red_flags: [{ type: String }], // array of flags
  },
  { timestamps: true } // adds createdAt & updatedAt
);

// ✅ Explicitly bind this to the "risk" collection
module.exports = mongoose.model("Risk", RiskSchema, "risk");
