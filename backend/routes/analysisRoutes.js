const express = require('express');
const router = express.Router();
const ExtractedValues = require('../models/Analysis'); // extracted_values model
const Ratios = require('../models/Ratios'); // <-- New model for LOMAS.ratios collection

const mongoose = require('mongoose');

// Utility: safe division
const safeDivide = (a, b) => (b && b !== 0 ? a / b : null);

// 🔹 Get ALL analysis data
router.get('/', async (req, res) => {
  try {
    const docs = await ExtractedValues.find();

    const result = docs.map(doc => {
      const data = doc._doc; // access the actual fields

      const totalAssets = data["Total assets"]?.value_2025 || 0;
      const totalNonCurrentLiab = data["Total non-current liabilities"]?.value_2025 || 0;
      const totalCurrentLiab = data["Total current liabilities"]?.value_2025 || 0;

      const netWorth = totalAssets - (totalNonCurrentLiab + totalCurrentLiab);

      return {
        _id: doc._id,
        company_name: data.customer_name || 'N/A',
        lead_id: data.lead_id || 'N/A',
        last_updated: doc.updatedAt
          ? new Date(doc.updatedAt).toISOString().split('T')[0]
          : 'N/A',
        net_worth: netWorth,
        year_range: '2024-2025'
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching analysis:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




// 🔹 Get all ratios
router.get('/ratios', async (req, res) => {
  try {
    const ratios = await Ratios.find();

    const formatted = ratios.map((doc) => {
      const ratiosArray = Object.entries(doc._doc)
        .filter(([key]) => !['_id', 'customer_name', 'lead_id', '__v', 'createdAt', 'updatedAt', 'financial_strength'].includes(key))
        .map(([key, val]) => ({
          name: key,
          value: val?.value ?? null,
          threshold: val?.threshold ?? null,
          red_flag: val?.red_flag ?? false,
        }));

      return {
        _id: doc._id,
        customer_name: doc.customer_name,
        lead_id: doc.lead_id,
        ratios: ratiosArray,
        // ✅ include subtotal so frontend can calculate ratio_health
        financial_strength: {
          subtotal: doc.financial_strength?.subtotal ?? null
        }
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching all ratios:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// 🔹 Get SINGLE company details by ID
router.get('/:id', async (req, res) => {
  try {
    const baseDoc = await ExtractedValues.findById(req.params.id, {
      customer_name: 1,
      lead_id: 1
    });
    if (!baseDoc) return res.status(404).json({ message: 'Company not found' });

    const doc = await ExtractedValues.findOne({
      customer_name: baseDoc.customer_name,
      lead_id: baseDoc.lead_id
    });
    if (!doc) return res.status(404).json({ message: 'Matching company not found' });

    const data = doc._doc; // Access the actual fields

    // ---------------- Tables ----------------
    const balance_sheet = [];
    const profit_loss = [];
    const cash_flow = [];

    const traverse = (obj, parentKey = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value.source) {
          const itemObj = {
            _id: `${doc._id}-${parentKey}${key}`,
            item: key,
            FY2024: value.value_2024 ?? null,
            FY2025: value.value_2025 ?? null
          };
          if (value.source === 'bs') balance_sheet.push(itemObj);
          else if (value.source === 'pl') profit_loss.push(itemObj);
          else if (value.source === 'cf') cash_flow.push(itemObj);
        }
      });
    };

    traverse(data);

    // ---------------- Compute Net Worth ----------------
    const totalAssets = data["Total assets"]?.value_2025 || 0;
    const totalNonCurrentLiab = data["Total non-current liabilities"]?.value_2025 || 0;
    const totalCurrentLiab = data["Total current liabilities"]?.value_2025 || 0;
    const netWorth = totalAssets - (totalNonCurrentLiab + totalCurrentLiab);

    // ---------------- Get Ratio Data ----------------
    const ratioDoc = await Ratios.findOne({
      customer_name: doc.customer_name,
      lead_id: doc.lead_id
    });

    let dscr = 'N/A';
    let debt_to_equity = 'N/A';
    let ratio_health = 'N/A';

    if (ratioDoc) {
      const dscrRatio = ratioDoc.DSCR;
      const debtToEquityRatio = ratioDoc['Debt/Equity'];
      
      dscr = dscrRatio?.value ?? 'N/A';
      debt_to_equity = debtToEquityRatio?.value ?? 'N/A';
      ratio_health = ratioDoc.financial_strength?.subtotal ? 
        (ratioDoc.financial_strength.subtotal >= 3 ? 'Good' : 
         ratioDoc.financial_strength.subtotal >= 2 ? 'Moderate' : 'Poor') : 'N/A';
    }

    // ---------------- Response ----------------
    res.json({
      _id: doc._id,
      company_name: doc.customer_name || 'N/A',
      lead_id: doc.lead_id || 'N/A',
      last_updated: doc.updatedAt
        ? new Date(doc.updatedAt).toISOString().split('T')[0]
        : 'N/A',
      net_worth: netWorth,
      dscr: dscr,
      debt_to_equity: debt_to_equity,
      ratio_health: ratio_health,
      year_range: '2024-2025',
      balance_sheet,
      profit_loss,
      cash_flow
    });
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// 🔹 Get Ratios by customer_name & lead_id
router.get('/:id/ratios', async (req, res) => {
  try {
    const baseDoc = await ExtractedValues.findById(req.params.id, {
      customer_name: 1,
      lead_id: 1
    });
    if (!baseDoc) return res.status(404).json({ message: 'Company not found' });

    const ratioDoc = await Ratios.findOne({
      customer_name: baseDoc.customer_name,
      lead_id: baseDoc.lead_id
    });

    if (!ratioDoc) {
      return res.json([]);
    }

    // Convert ratioDoc to array format for frontend
    const ratiosArray = Object.entries(ratioDoc._doc)
      .filter(([key]) => !['_id', 'customer_name', 'lead_id', '__v', 'createdAt', 'updatedAt'].includes(key))
      .map(([key, val]) => ({
        name: key,
        value: val?.value ?? null,
        threshold: val?.threshold ?? null,
        red_flag: val?.red_flag ?? false
      }));

    res.json(ratiosArray);
  } catch (err) {
    console.error('Error fetching ratios:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 Update analysis data
router.put('/:id', async (req, res) => {
  try {
    const { balance_sheet, profit_loss, cash_flow } = req.body;

    // Find the document to update
    const doc = await ExtractedValues.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // Create update object
    const updateData = {};

    // Helper function to update field values
    const updateField = (item, source) => {
      if (item.item && doc[item.item]) {
        updateData[item.item] = {
          ...doc[item.item],
          FY2022: item.FY2022,
          FY2023: item.FY2023,
          FY2024: item.FY2024,
          FY2025: item.FY2025,
          value_latest: item.FY2025 || item.FY2024 || item.FY2023 || item.FY2022,
          source: source
        };
      }
    };

    // Update balance sheet data
    if (balance_sheet) {
      balance_sheet.forEach(item => updateField(item, 'bs'));
    }

    // Update profit & loss data
    if (profit_loss) {
      profit_loss.forEach(item => updateField(item, 'pl'));
    }

    // Update cash flow data
    if (cash_flow) {
      cash_flow.forEach(item => updateField(item, 'cf'));
    }

    // Apply the updates
    await ExtractedValues.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({ message: 'Analysis data updated successfully' });
  } catch (err) {
    console.error('Error updating analysis:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
