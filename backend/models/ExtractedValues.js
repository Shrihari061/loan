const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  value: { type: Number, default: null },
  threshold: { type: String, default: null },
  red_flag: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
});

const FinancialStrengthSchema = new mongoose.Schema({
  per_ratio_max: { type: Number, default: 0 },
  scores: {
    DSCR: { type: ScoreSchema, default: () => ({}) },
    "Debt/Equity": { type: ScoreSchema, default: () => ({}) },
    "PAT Margin": { type: ScoreSchema, default: () => ({}) },
    "Current Ratio": { type: ScoreSchema, default: () => ({}) },
  },
  subtotal: { type: Number, default: 0 },
});

const WeightsSchema = new mongoose.Schema({
  financial_strength: { type: Number, default: 0 },
  management_quality: { type: Number, default: 0 },
  industry_risk: { type: Number, default: 0 },
});

const ExtractedValuesSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    lead_id: { type: String, required: true },
    weights: { type: WeightsSchema, default: () => ({}) },
    financial_strength: { type: FinancialStrengthSchema, default: () => ({}) },
    management_quality: {
      score: { type: Number, default: 0 },
    },
    industry_risk: {
      score: { type: Number, default: 0 },
    },
    total_score: { type: Number, default: 0 },
    risk_bucket: { type: String, default: "Low Risk" },
    red_flags: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ExtractedValues ||
  mongoose.model('ExtractedValues', ExtractedValuesSchema);