const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  customer_name: { type: String, required: false }, // some records may not have it
  loan_id: { type: String, required: false },

  financial_summary: { type: String, required: false },
  executive_summary: { type: String, required: false },

  financial_summary_and_ratios: {
    "Revenue and Profitability": { type: String },
    "Operational Efficiency": { type: String },
    "Leverage and Liquidity": { type: String }
  },

  loan_purpose: [{ type: String }],   // ✅ dynamic array of strings
  swot_analysis: {
    Strengths: [{ type: String }],
    Weaknesses: [{ type: String }],
    Opportunities: [{ type: String }],
    Threats: [{ type: String }]
  },

  security_offered: {
    primary_security: [{ type: String }],
    collateral_security: [{ type: String }],
    personal_guarantees: [{ type: String }]
  },

  recommendation: [{ type: String }]  // ✅ dynamic array of strings
}, { timestamps: true });

module.exports = mongoose.model('Summary', SummarySchema);
