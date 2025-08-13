const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  business_name: { type: String, required: true },
  loan_type: { type: String, required: true },
  loan_amount: { type: Number, required: true },
  last_updated: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  loan_id: { type: String, unique: true },
  user_id: { type: String, default: 'default_rm' }, // RM/BM assigned to this lead
  contact_person: String,
  contact_email: String,
  contact_phone: String,
  business_address: String,
  industry: String,
  created_date: { type: Date, default: Date.now },
  notes: String
});

// Force mongoose to use 'leads' as the collection name
module.exports = mongoose.model('Lead', LeadSchema, 'leads'); 