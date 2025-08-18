const express = require('express');
const router = express.Router();
const ExtractedValues = require('../models/Analysis'); // extracted_values model
const Ratios = require('../models/Ratios'); // <-- New model for LOMAS.ratios collection

const mongoose = require('mongoose');

// Utility: safe division
const safeDivide = (a, b) => (b && b !== 0 ? a / b : null);

// Utility: format ratio health
const getRatioHealth = (debtToEquity, dscr) => {
  if (debtToEquity == null || dscr == null) return 'Unknown';
  if (debtToEquity < 1 && dscr > 2) return 'Excellent';
  if (debtToEquity < 2 && dscr > 1.5) return 'Good';
  if (debtToEquity < 3 && dscr > 1) return 'Average';
  return 'Poor';
};

// 🔹 Get ALL analysis data
router.get('/', async (req, res) => {
  try {
    const docs = await ExtractedValues.find();

    const result = docs.map(doc => {
      const shareholderEquity = doc["Shareholder's Equity"]?.value_latest || null;
      const totalDebt = doc["Total Debt"]?.value_latest || null;
      const ebit = doc["EBIT"]?.value_latest || null;
      const depreciation = doc["Depreciation"]?.value_latest || 0;
      const interest = doc["Interest Expense"]?.value_latest || null;
      const principal = doc["Principal"]?.value_latest || 0;

      const debtToEquity = safeDivide(totalDebt, shareholderEquity);
      const dscr = safeDivide((ebit ?? 0) + depreciation, (interest ?? 0) + principal);
      const ratioHealth = getRatioHealth(debtToEquity, dscr);

      return {
        _id: doc._id,
        company_name: doc.customer_name || 'N/A',
        loan_id: doc.loan_id || 'N/A',
        last_updated: doc.updatedAt
          ? new Date(doc.updatedAt).toISOString().split('T')[0]
          : 'N/A',
        net_worth: shareholderEquity,
        debt_to_equity: debtToEquity !== null ? debtToEquity.toFixed(2) : 'N/A',
        dscr: dscr !== null ? dscr.toFixed(2) : 'N/A',
        year_range: '2024-2025',
        ratio_health: ratioHealth
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching analysis:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 Get SINGLE company details by customer_name & loan_id (verified)
router.get('/:id', async (req, res) => {
  try {
    const baseDoc = await ExtractedValues.findById(req.params.id, {
      customer_name: 1,
      loan_id: 1
    });
    if (!baseDoc) return res.status(404).json({ message: 'Company not found' });

    const doc = await ExtractedValues.findOne({
      customer_name: baseDoc.customer_name,
      loan_id: baseDoc.loan_id
    });
    if (!doc) return res.status(404).json({ message: 'Matching company not found' });

    // ---------------- Ratios ----------------
    const shareholderEquity = doc["Shareholder's Equity"]?.value_latest || null;
    const totalDebt = doc["Total Debt"]?.value_latest || null;
    const ebit = doc["EBIT"]?.value_latest || null;
    const depreciation = doc["Depreciation"]?.value_latest || 0;
    const interest = doc["Interest Expense"]?.value_latest || null;
    const principal = doc["Principal"]?.value_latest || 0;

    const debtToEquity = safeDivide(totalDebt, shareholderEquity);
    const dscr = safeDivide((ebit ?? 0) + depreciation, (interest ?? 0) + principal);
    const ratioHealth = getRatioHealth(debtToEquity, dscr);

    // ---------------- Tables (recursive scan) ----------------
    const balance_sheet = [];
    const profit_loss = [];
    const cash_flow = [];

    const traverse = (obj, parentKey = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          if (value.source) {
            const itemObj = {
              _id: `${doc._id}-${parentKey}${key}`,
              item: key,
              FY2022: value.FY2022 ?? null,
              FY2023: value.FY2023 ?? null,
              FY2024: value.FY2024 ?? null,
              FY2025: value.value_latest ?? null
            };
            if (value.source === 'bs') balance_sheet.push(itemObj);
            else if (value.source === 'pl') profit_loss.push(itemObj);
            else if (value.source === 'cf') cash_flow.push(itemObj);
          } else {
            // Recurse deeper for nested fields
            traverse(value, parentKey + key + '.');
          }
        }
      });
    };

    traverse(doc._doc);

    // ---------------- Response ----------------
    res.json({
      _id: doc._id,
      company_name: doc.customer_name || 'N/A',
      loan_id: doc.loan_id || 'N/A',
      last_updated: doc.updatedAt
        ? new Date(doc.updatedAt).toISOString().split('T')[0]
        : 'N/A',
      net_worth: shareholderEquity,
      debt_to_equity: debtToEquity !== null ? debtToEquity.toFixed(2) : 'N/A',
      dscr: dscr !== null ? dscr.toFixed(2) : 'N/A',
      year_range: '2024-2025',
      ratio_health: ratioHealth,
      balance_sheet,
      profit_loss,
      cash_flow
    });
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// 🔹 Get Ratios by customer_name & loan_id
router.get('/:id/ratios', async (req, res) => {
  try {
    const baseDoc = await ExtractedValues.findById(req.params.id, {
      customer_name: 1,
      loan_id: 1
    });
    if (!baseDoc) return res.status(404).json({ message: 'Company not found' });

    const ratioDoc = await Ratios.findOne({
      customer_name: baseDoc.customer_name,
      loan_id: baseDoc.loan_id
    });

    if (!ratioDoc) {
      return res.json([]);
    }

    // Convert ratioDoc to array format for frontend
    const ratiosArray = Object.entries(ratioDoc._doc)
      .filter(([key]) => !['_id', 'customer_name', 'loan_id', '__v'].includes(key))
      .map(([key, val]) => ({
        name: key,
        value: val.value,
        threshold: val.threshold,
        red_flag: val.red_flag
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
