const mongoose = require('mongoose');

const RiskTimelineSchema = new mongoose.Schema({
  parameter: String,
  FY2022: String,
  FY2023: String,
  FY2024: String,
  FY2025: String,
  flag: String
});

const RiskSchema = new mongoose.Schema({
  borrower: String,
  loan_id: String,
  loan_amount: Number,
  flags: {
    red: Number,
    orange: Number,
    green: Number
  },
  last_updated: String,
  overall_risk: String,
  flag_summary: {
    overall: String,
    categories: {
      financial_health: {
        label: String,
        flag: String,
        note: String
      },
      operational: {
        label: String,
        flag: String,
        note: String
      },
      compliance: {
        label: String,
        flag: String,
        note: String
      },
      legal: {
        label: String,
        flag: String,
        note: String
      },
      governance: {
        label: String,
        flag: String
      }
    }
  },
  risk_timeline: [RiskTimelineSchema]
});

// Force mongoose to use 'risk' as the collection name
module.exports = mongoose.model('Risk', RiskSchema, 'risk');
