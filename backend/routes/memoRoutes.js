const express = require('express');
const router = express.Router();
const Memo = require('../models/Memo');
const Summary = require('../models/Summary'); // make sure model exists

// 🔹 Normalize: works for both objects & arrays
const normalizeToArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;      // already array
  return Object.values(data);                // numbered object → array
};

// 🔹 Get all memos
router.get('/', async (req, res) => {
  try {
    const memos = await Memo.find();
    res.json(memos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔹 Get single memo by ID
router.get('/:id', async (req, res) => {
  try {
    const memo = await Memo.findById(req.params.id);
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    res.json(memo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔹 Create a new memo
router.post('/create', async (req, res) => {
  try {
    const { customer_name, loan_id, ...rest } = req.body;

    // Find matching summary
    const summaryData = await Summary.findOne({ customer_name, loan_id });
    if (!summaryData) {
      return res.status(404).json({ message: "No summary found for this customer/loan" });
    }

    const summaryObj = summaryData.toObject();

    const memoData = {
      ...rest,
      loan_id,
      executive_summary: summaryObj.executive_summary,
      financial_summary_and_ratios: summaryObj["financial_summary_&_ratios"],
      loan_purpose: normalizeToArray(summaryObj.loan_purpose),
      swot_analysis: summaryObj.swot_analysis,
      security_offered: summaryObj.security_offered,
      recommendation: normalizeToArray(summaryObj.recommendation),
    };

    const memo = new Memo(memoData);
    await memo.save();

    res.status(201).json(memo);
  } catch (error) {
    console.error("Error creating memo:", error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
