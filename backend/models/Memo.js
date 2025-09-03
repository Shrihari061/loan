const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  lead_id: { type: String, required: true },
  customer_name: { type: String, required: true },
  loan_type: { type: String },
  created_by: { type: String },
  date: { type: String },
  last_updated: { type: String },
  status: { type: String, default: "Draft" },

  // 🔹 All fields can store either string or array (Mixed)
  executive_summary: { type: String },
  financial_summary_and_ratios: { type: String },
  loan_purpose: { type: mongoose.Schema.Types.Mixed },   // string OR array
  swot_analysis: { type: String },
  security_offered: { type: String },
  recommendation: { type: mongoose.Schema.Types.Mixed }, // string OR array

  attachments: [String]
}, { timestamps: true });

module.exports = mongoose.model('Memo', memoSchema);
