const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CQ = require("../models/Cq")

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



// GET data from a chosen collection for a CQ record
router.get('/:id/collection/:collectionName', async (req, res) => {
  const { id, collectionName } = req.params;

  try {
    const cqEntry = await CQ.findById(id);
    if (!cqEntry) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { customer_name, loan_id } = cqEntry;

    // Use native MongoDB collection access
    const collection = mongoose.connection.collection(collectionName);
    if (!collection) {
      return res.status(400).json({ error: 'Collection not found' });
    }

    // Try to find matching document
    const record =
      (await collection.findOne({ customer_name, loan_id })) ||
      (await collection.findOne({ borrower: customer_name, loan_id }));

    if (!record) {
      return res.json({});
    }

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data from collection' });
  }
});



module.exports = router;
