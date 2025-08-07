const mongoose = require('mongoose');

const RecentApplicationSchema = new mongoose.Schema({
  borrower: String,
  loan_type: String,
  amount: Number,
  risk_level: String,
  status: String
});

const DashboardSchema = new mongoose.Schema({
  year: Number,
  total_applicants: Number,
  monthly_breakdown: {
    January: Number,
    February: Number,
    March: Number,
    April: Number,
    May: Number,
    June: Number,
    July: Number
  },
  applications_summary: {
    in_progress: Number,
    rejected: Number,
    approved: Number
  },
  recent_applications: [RecentApplicationSchema],
  risk_category_breakdown: {
    "Low Risk": Number,
    "Medium Risk": Number,
    "High Risk": Number
  }
});

module.exports = mongoose.model('Dashboard', DashboardSchema, 'dashboard');
