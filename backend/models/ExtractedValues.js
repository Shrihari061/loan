const mongoose = require('mongoose');

// Schema for yearly values of each financial item
const YearlyValueSchema = new mongoose.Schema(
  {
    value_2025: { type: mongoose.Schema.Types.Mixed, default: null }, // can be number or string
    value_2024: { type: mongoose.Schema.Types.Mixed, default: null },
    value_2023: { type: mongoose.Schema.Types.Mixed, default: null },
    source: { type: String, default: null }, // bs, pl, cf
    unit: { type: String, default: null },   // e.g., ₹ crore, ₹ per share, in shares
    fieldName: { type: String, default: null },
  },
  { _id: false }
);

// Main schema
const ExtractedValuesSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    lead_id: { type: String, required: true },

    balanceSheet: { type: Map, of: YearlyValueSchema, default: {} },
    profitAndLoss: { type: Map, of: YearlyValueSchema, default: {} },
    cashFlows: { type: Map, of: YearlyValueSchema, default: {} },
    // Dynamic financial items: each key (like "Revenue from operations") is a YearlyValueSchema
    data: {
      type: Map,
      of: YearlyValueSchema,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ExtractedValues ||
  mongoose.model('ExtractedValues', ExtractedValuesSchema);
