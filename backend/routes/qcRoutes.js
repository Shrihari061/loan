const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// CQ Document Schema
const documentSchema = new mongoose.Schema({
  filename: String,
  upload_date: Date,
  file_data: Buffer,
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Declined'],
    default: 'Pending',
  },
});

// CQ Main Schema
const cqSchema = new mongoose.Schema({
  customer_id: String,
  customer_name: String,
  loan_id: String,
  documents: [documentSchema],
});

const CQ = mongoose.model('cq', cqSchema);

// 🔹 Get ALL QC entries (minimal info for listing)
router.get('/', async (req, res) => {
  try {
    const records = await CQ.find({}, 'customer_id customer_name loan_id documents.status');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch QC records.' });
  }
});

// 🔹 Get full customer entry (including all documents and PDF file_data) using Mongo _id
router.get('/:id', async (req, res) => {
  try {
    const entry = await CQ.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Customer not found' });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

// 🔹 Get single PDF file by customer ID + document ID
router.get('/:id/document/:docId', async (req, res) => {
  try {
    const customer = await CQ.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const doc = customer.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    res.set('Content-Type', 'application/pdf');
    res.send(doc.file_data);
  } catch (err) {
    console.error('Error retrieving document:', err);
    res.status(500).json({ error: 'Error retrieving document' });
  }
});


module.exports = router;
