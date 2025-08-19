const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  lead_id: { type: String },           // 🔹 link to lead
  customer_name: { type: String },     // 🔹 customer name
  loan_type: { type: String },         // 🔹 NEW: loan type from cq
  created_by: { type: String },        // user/system creating it
  date: { type: String },
  last_updated: { type: String },
  status: { type: String, default: "Draft" },

  // Table-specific display fields
  loan_purpose_table: { type: String },

  // Enriched data from summaries
  executive_summary: { type: String },

  // 🔹 Dynamic financial summary (flexible headers + arrays of bullet points)
  financial_summary_and_ratios: {
    type: Map,
    of: [String]   // each header → array of bullet points
  },

  loan_purpose: [{ type: String }],   // 🔹 dynamic array
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

  recommendation: [{ type: String }], // 🔹 dynamic array

  // Optional extras
  summary_highlights: { type: String },
  comments: { type: String },
  attachments: [String]
}, { timestamps: true });

module.exports = mongoose.model('Memo', memoSchema);
