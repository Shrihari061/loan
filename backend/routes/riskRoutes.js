const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk'); // ✅ updated model bound to "risk" collection
const ExtractedValues = require('../models/ExtractedValues'); // ✅ uncommented & imported

// -------------------- GET all risks --------------------
router.get('/', async (req, res) => {
  try {
    // Check if lead_id query parameter is provided
    const { lead_id } = req.query;
    if (lead_id) {
      const data = await Risk.find({ lead_id: lead_id });
      return res.json(data);
    }
    
    // Otherwise return all risks
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
      customer_name: riskRecord.customer_name,
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
      total_score: {
        2023: riskRecord.total_score?.["2023"] ?? null,
        2024: riskRecord.total_score?.["2024"] ?? null,
        2025: riskRecord.total_score?.["2025"] ?? null
      },
      risk_bucket: {
        2023: riskRecord.risk_bucket?.["2023"] ?? null,
        2024: riskRecord.risk_bucket?.["2024"] ?? null,
        2025: riskRecord.risk_bucket?.["2025"] ?? null
      },
      red_flags: {
        2023: riskRecord.red_flags?.["2023"] ?? [],
        2024: riskRecord.red_flags?.["2024"] ?? [],
        2025: riskRecord.red_flags?.["2025"] ?? []
      },
      weights: riskRecord.weights,
      financial_strength: riskRecord.financial_strength,
      management_quality: riskRecord.management_quality,
      industry_risk: riskRecord.industry_risk,

      // ✅ pulled from extracted_values
      revenue: extractedDoc["Revenue"]?.value_latest ?? null,
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
