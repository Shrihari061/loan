// models/Dashboard.js
const mongoose = require('mongoose');

const RecentApplicationSchema = new mongoose.Schema({
  borrower: String,
  loan_type: String,
  amount: Number,
  risk_level: String,
  status: String
});

const TopCardSchema = new mongoose.Schema({
  value: Number,
  change: Number
}, { _id: false });

const DashboardSchema = new mongoose.Schema({
  year: Number,
  total_applicants: Number,

  top_cards: {
    total_disbursement: TopCardSchema,
    companies_in_draft: TopCardSchema,
    financial_capture_stage: TopCardSchema,
    rejected_companies: TopCardSchema
  },

  monthly_disbursement: {
    January: Number,
    February: Number,
    March: Number,
    April: Number,
    May: Number,
    June: Number,
    July: Number,
    August: Number,
    September: Number,
    October: Number,
    November: Number,
    December: Number
  },

  monthly_breakdown: {
    January: Number,
    February: Number,
    March: Number,
    April: Number,
    May: Number,
    June: Number,
    July: Number
  },

  application_pipeline: {
    New: Number,
    "Under KYC": Number,
    "Under Financial Review": Number,
    "Under Approval": Number,
    Sanctioned: Number,
    Disbursed: Number
  },

  pending_progress: {
    "Lead ID": Number,
    KYC: Number,
    "Financial Analysis": Number
  },

  applications_summary: {
    in_progress: Number,
    rejected: Number,
    approved: Number
  },

  recent_applications: [RecentApplicationSchema],

  risk_ratio: {
    "Financial History": Number,
    "Management Strength": Number,
    "Industry Risk": Number
  },

  risk_category_breakdown: {
    "Low Risk": Number,
    "Medium Risk": Number,
    "High Risk": Number
  }
});

// Export the model
module.exports = mongoose.model('Dashboard', DashboardSchema, 'dashboard');
