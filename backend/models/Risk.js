const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    value: Number,
    threshold: String,
    red_flag: Boolean,
    score: Number,
    max: Number,
  },
  { _id: false }
);

const FinancialStrengthSchema = new mongoose.Schema(
  {
    per_ratio_max: Number,
    scores: { type: Map, of: ScoreSchema }, // dynamic keys like DSCR, Debt/Equity, etc.
    subtotal: Number,
  },
  { _id: false }
);

const ManagementQualitySchema = new mongoose.Schema(
  {
    score: Number,
  },
  { _id: false }
);

const IndustryRiskSchema = new mongoose.Schema(
  {
    score: Number,
  },
  { _id: false }
);

const WeightsSchema = new mongoose.Schema(
  {
    financial_strength: Number,
    management_quality: Number,
    industry_risk: Number,
  },
  { _id: false }
);

const RiskSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    loan_id: { type: String, required: true },
    weights: WeightsSchema,
    financial_strength: FinancialStrengthSchema,
    management_quality: ManagementQualitySchema,
    industry_risk: IndustryRiskSchema,
    total_score: Number,
    risk_bucket: String,
    red_flags: [String], // array of flags
  },
  { timestamps: true } // adds createdAt & updatedAt
);

// ⚠️ Adjust collection name to match your DB.
// If the collection is "risk11111", set that as the 3rd argument.
module.exports = mongoose.model("Risk", RiskSchema, "risk");
