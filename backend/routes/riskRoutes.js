const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk');
const ExtractedValues = require('../models/ExtractedValues'); // ✅ uncommented & imported

// -------------------- GET all risks --------------------
router.get('/', async (req, res) => {
  try {
    const data = await Risk.find();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------- GET risk by ID + extracted_values --------------------
router.get('/:id', async (req, res) => {
  try {
    // 1️⃣ Get risk record
    const riskRecord = await Risk.findById(req.params.id);
    if (!riskRecord) {
      return res.status(404).json({ message: 'Risk record not found' });
    }

    // 2️⃣ Find matching extracted_values record by customer_name + lead_id
    const extractedDoc = await ExtractedValues.findOne({
      customer_name: riskRecord.customer_name, // ✅ corrected
      lead_id: riskRecord.lead_id
    });

    if (!extractedDoc) {
      return res.status(404).json({
        message: 'Matching extracted_values record not found'
      });
    }

    // 3️⃣ Prepare combined response
    const response = {
      _id: riskRecord._id,
      customer_name: riskRecord.customer_name,
      lead_id: riskRecord.lead_id,
      total_score: riskRecord.total_score,
      risk_bucket: riskRecord.risk_bucket,
      red_flags: riskRecord.red_flags,
      weights: riskRecord.weights,
      financial_strength: riskRecord.financial_strength,
      management_quality: riskRecord.management_quality,
      industry_risk: riskRecord.industry_risk,
      revenue: extractedDoc["Revenue"]?.value_latest ?? null, // ✅ contextual field from extracted values
      net_profit: extractedDoc["Net Profit"]?.value_latest ?? null,
      total_assets: extractedDoc["Total Assets"]?.value_latest ?? null
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
