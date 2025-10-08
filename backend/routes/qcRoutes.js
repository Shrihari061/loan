const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CQ = require("../models/Cq");
const ExtractedValues = require('../models/ExtractedValues'); // your schema file

// 🔹 Get ALL QC entries (minimal info for listing)
router.get('/', async (req, res) => {
  try {
    const records = await CQ.find({}, 'customer_id customer_name lead_id loan_type status');
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

// 🔹 Revert a CQ record (set status = "In Progress")
router.put('/:id/revert', async (req, res) => {
  try {
    const updated = await CQ.findByIdAndUpdate(
      req.params.id,
      { status: 'In Progress' },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Customer not found' });

    res.json({ message: 'Customer status reverted to In Progress', record: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revert status' });
  }
});

// ✅ Update financial field for a specific customer/lead/year
router.put('/update', async (req, res) => {
  try {
    const { customer_name, lead_id, item, year, value, section } = req.body;

    if (!customer_name || !lead_id || !item || !year || !section) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert to the correct field name, e.g. FY2025 → value_2025
    const yearKey = `value_${year}`;

    // Find the document first
    const doc = await ExtractedValues.findOne({ customer_name, lead_id });
    if (!doc) {
      return res.status(404).json({ error: 'No matching document found' });
    }

    // Update the specific field in the appropriate section
    let updated = false;
    
    // Check if it's a flexible group item
    const sectionData = doc[section];
    if (sectionData && sectionData.flexibleGroupItems) {
      const flexibleItem = sectionData.flexibleGroupItems.find(
        flexItem => flexItem.fieldName === item
      );
      if (flexibleItem) {
        flexibleItem[yearKey] = value;
        updated = true;
      }
    }

    // If not found in flexible items, check direct section fields
    if (!updated && sectionData) {
      sectionData[item] = sectionData[item] || {};
      sectionData[item][yearKey] = value;
      updated = true;
    }

    if (updated) {
      await doc.save();
      res.json({
        success: true,
        updated: { customer_name, lead_id, item, year, value, section }
      });
    } else {
      res.status(404).json({ error: 'Field not found in document' });
    }
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
