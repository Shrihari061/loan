// models/CQ.ts
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: String,
  upload_date: Date,
  file_data: Buffer,
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Declined'],
    default: 'Pending'
  }
});

const cqSchema = new mongoose.Schema({
  customer_id: String,
  customer_name: String,
  loan_id: String,
  // documents: [documentSchema],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Declined'],
    default: 'Pending'
  }
});

module.exports = mongoose.model('cq', cqSchema);
