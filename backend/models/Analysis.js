// models/ExtractedValues.js
const mongoose = require('mongoose');

const extractedValuesSchema = new mongoose.Schema({
  customer_name: { type: String, required: true }, // old "company_name"
  lead_id: { type: String, required: true },

  // These are extracted metrics from your JSON
  "Shareholder's Equity": {
    value_latest: Number,
    source: String,
    confidence: Number,
    unit: String
  },
  "Total Debt": {
    value_latest: Number,
    source: String,
    confidence: Number,
    unit: String
  },
  "EBIT": {
    value_latest: Number,
    source: String,
    confidence: Number,
    unit: String
  },
  "Depreciation": {
    value_latest: Number,
    source: String,
    confidence: Number,
    unit: String
  },
  "Interest Expense": {
    value_latest: Number,
    source: String,
    confidence: Number,
    unit: String
  },
  "Principal": {
    value_latest: Number,
    source: String,
    confidence: Number,
    unit: String
  },

  // Optional: if you want to store balance sheet, P/L, cash flow separately
  balance_sheet: [
    {
      item: String,
      FY2022: Number,
      FY2023: Number,
      FY2024: Number,
      FY2025: Number
    }
  ],
  profit_loss: [
    {
      item: String,
      FY2022: Number,
      FY2023: Number,
      FY2024: Number,
      FY2025: Number
    }
  ],
  cash_flow: [
    {
      item: String,
      FY2022: Number,
      FY2023: Number,
      FY2024: Number,
      FY2025: Number
    }
  ]
}, {
  collection: 'extracted_values', // match your current collection
  timestamps: true // adds createdAt & updatedAt for last_updated
});

module.exports = mongoose.model('ExtractedValues', extractedValuesSchema);
