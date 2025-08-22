const mongoose = require('mongoose');

// Schema for yearly values of each financial item
const YearlyValueSchema = new mongoose.Schema({
  value_2025: { type: mongoose.Schema.Types.Mixed, default: null }, // can be number or string ("null")
  value_2024: { type: mongoose.Schema.Types.Mixed, default: null },
  source: { type: String, default: null }, // bs, pl, cf
  unit: { type: String, default: null },   // e.g., ₹ crore, ₹ per share
}, { _id: false });

// Main schema
const ExtractedValuesSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    lead_id: { type: String, required: true },

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
