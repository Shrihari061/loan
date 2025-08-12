const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  loan_id: { type: String, required: true },
  last_updated: { type: String }, // or Date if you're storing as ISO
  net_worth: Number,
  debt_to_equity: Number,
  dscr: Number,
  year_range: String,
  ratio_health: String,

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

}, { collection: 'analysis' });

module.exports = mongoose.model('Analysis', analysisSchema);
