const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CQ = require("../models/Cq");

// 🔹 Get ALL QC entries (minimal info for listing)
router.get('/', async (req, res) => {
  try {
    const records = await CQ.find({}, 'customer_id customer_name loan_id status');
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

// 🔹 Approve a CQ record (set status = "approved")
router.put('/:id/approve', async (req, res) => {
  try {
    const updated = await CQ.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved' },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Customer not found' });

    res.json({ message: 'Customer approved successfully', record: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// 🔹 Reject a CQ record (set status = "rejected")
router.put('/:id/reject', async (req, res) => {
  try {
    const updated = await CQ.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Customer not found' });

    res.json({ message: 'Customer rejected successfully', record: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
