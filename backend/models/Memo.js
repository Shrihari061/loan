const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  memo_id: String,
  date: String,
  loan_purpose: String,
  loan_purpose_table: String,
  last_updated: String,
  executive_summary: String,
  loan_details: {
    type: Object
  },
  financial_summary: Object,
  revenue_profitability: Object,
  debt_service_capacity: Object,
  summary_highlights: String,
  SWOT_analysis: Object,
  comments: String,
  attachments: [String]
});

module.exports = mongoose.model('Memo', memoSchema);
