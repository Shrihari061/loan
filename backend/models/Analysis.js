// models/ExtractedValues.js
const mongoose = require('mongoose');

const extractedValuesSchema = new mongoose.Schema({
  customer_name: { type: String, required: true }, // old "company_name"
  lead_id: { type: String, required: true },

  // Dynamic schema to support any financial metric with year-specific values
  // This allows for flexible field names like "Total assets", "Revenue", etc.
}, {
  collection: 'extracted_values', // match your current collection
  timestamps: true, // adds createdAt & updatedAt for last_updated
  strict: false // Allow dynamic fields
});

module.exports = mongoose.model('ExtractedValues', extractedValuesSchema);
