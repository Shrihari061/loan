// models/ExtractedValues.js
const mongoose = require('mongoose');

const ValueSchema = new mongoose.Schema({
  value_2025: { type: mongoose.Schema.Types.Mixed },
  value_2024: { type: mongoose.Schema.Types.Mixed },
  value_2023: { type: mongoose.Schema.Types.Mixed },
  source: String,
  unit: String,
  fieldName: String
}, { _id: false });

const FlexibleGroupItemSchema = new mongoose.Schema({
  fieldName: String,
  value_2025: mongoose.Schema.Types.Mixed,
  value_2024: mongoose.Schema.Types.Mixed,
  value_2023: mongoose.Schema.Types.Mixed,
  source: String,
  unit: String
}, { _id: false });

const SectionSchema = new mongoose.Schema({
  fileGroup: String,
  sourceFiles: [String],
  // Each section has named fields (like totalAssets, profitBeforeTax, etc.)
  // and also flexible items
  flexibleGroupItems: [FlexibleGroupItemSchema]
}, { strict: false, _id: false });

const FinancialsSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  balanceSheet: SectionSchema,
  profitAndLoss: SectionSchema,
  cashFlows: SectionSchema,
}, { timestamps: true });

// ✅ This binds the schema to the 'extractedvalues' Mongo collection
module.exports = mongoose.model('ExtractedValues', FinancialsSchema, 'extractedvalues');
