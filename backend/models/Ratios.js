const mongoose = require('mongoose');

const RatioDetailSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  threshold: { type: String, required: true },
  red_flag: { type: Boolean, default: false }
});

const RatiosSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    lead_id: { type: String, required: true },

    DSCR: { type: RatioDetailSchema, required: true },
    "Debt/Equity": { type: RatioDetailSchema, required: true },
    "PAT Margin": { type: RatioDetailSchema, required: true },
    "Current Ratio": { type: RatioDetailSchema, required: true },
    "Quick Ratio": { type: RatioDetailSchema, required: true },
    "Interest Coverage": { type: RatioDetailSchema, required: true },
    "Net profit Margin": { type: RatioDetailSchema, required: true },
    "Return on Assets": { type: RatioDetailSchema, required: true },
    "Return on equity": { type: RatioDetailSchema, required: true },
    "EBITDA Margin": { type: RatioDetailSchema, required: true },
    "Accounts Receivable Days": { type: RatioDetailSchema, required: true },
    "Accounts payable days": { type: RatioDetailSchema, required: true },
    "Asset Turnover Ratio": { type: RatioDetailSchema, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ratios', RatiosSchema);
