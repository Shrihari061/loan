const mongoose = require('mongoose');

const RatioDetailSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  threshold: { type: String, required: true },
  red_flag: { type: Boolean, default: false }
});

const RatiosSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  loan_id: { type: String, required: true },
  DSCR: { type: RatioDetailSchema, required: true },
  DebtEquity: { type: RatioDetailSchema, required: true },
  PATMargin: { type: RatioDetailSchema, required: true },
  CurrentRatio: { type: RatioDetailSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Ratios', RatiosSchema);
