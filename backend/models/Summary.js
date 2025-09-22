const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  customer_name: { type: String, required: false }, // some records may not have it
  lead_id: { type: String, required: false },

  // 🔑 all fields are plain strings now, same as 2.json
  "financial_summary_&_ratios": { type: String, required: false },
  executive_summary: { type: String, required: false },
  loan_purpose: { type: String, required: false },
  swot_analysis: { type: String, required: false },
  security_offered: { type: String, required: false },
  recommendation: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.model('Summary', SummarySchema);
