const express = require("express");
const router = express.Router();
const ExtractedValues = require("../models/Analysis"); // extracted_values model
const Ratios = require("../models/Ratios"); // <-- New model for LOMAS.ratios collection
const Lead = require("../models/Lead");
const mongoose = require("mongoose");

// Utility: safe division
const safeDivide = (a, b) => (b && b !== 0 ? a / b : null);

// Utility: handle Map or plain Object for `doc.data`
const createDataAccessor = (data) => {
  const isMap =
    data &&
    typeof data.get === "function" &&
    typeof data.entries === "function";
  return {
    isMap,
    get: (key) => (isMap ? data.get(key) : data ? data[key] : undefined),
    entries: () => (isMap ? data.entries() : Object.entries(data || {})),
  };
};

// 🔹 Get ALL analysis data
router.get("/", async (req, res) => {
  try {
    const docs = await ExtractedValues.find();

    const result = docs.map((doc) => {
      const accessor = createDataAccessor(doc.data || {});

      const totalAssets = accessor.get("Total assets")?.value_2025 || 0;
      const totalNonCurrentLiab =
        accessor.get("Total non-current liabilities")?.value_2025 || 0;
      const totalCurrentLiab =
        accessor.get("Total current liabilities")?.value_2025 || 0;

      const netWorth = totalAssets - (totalNonCurrentLiab + totalCurrentLiab);

      return {
        _id: doc._id,
        company_name: doc.customer_name || "N/A",
        lead_id: doc.lead_id || "N/A",
        last_updated: doc.updatedAt
          ? new Date(doc.updatedAt).toISOString().split("T")[0]
          : "N/A",
        net_worth: netWorth,
        year_range: "2023-2025",
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching analysis:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Debug route to check data structure
router.get("/debug/all", async (req, res) => {
  try {
    const docs = await ExtractedValues.find();
    res.json({
      count: docs.length,
      documents: docs.map((doc) => ({
        _id: doc._id,
        customer_name: doc.customer_name,
        lead_id: doc.lead_id,
        hasData: !!doc.data,
        fields: doc.data ? Array.from(doc.data.keys()) : [],
      })),
    });
  } catch (err) {
    console.error("Error in debug route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Debug route to check specific document data
router.get("/debug/:id", async (req, res) => {
  try {
    const doc = await ExtractedValues.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const data = doc.data || {};
    const accessor = createDataAccessor(data);
    const sampleFields = {};

    // Get sample fields with their year values
    for (const [key, value] of accessor.entries()) {
      if (value && typeof value === "object" && value.source) {
        sampleFields[key] = {
          source: value.source,
          unit: value.unit,
          value_2023: value.value_2023,
          value_2024: value.value_2024,
          value_2025: value.value_2025,
        };
      }
    }

    res.json({
      _id: doc._id,
      customer_name: doc.customer_name,
      lead_id: doc.lead_id,
      sampleFields: sampleFields,
    });
  } catch (err) {
    console.error("Error in debug route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Get all ratios
router.get("/ratios", async (req, res) => {
  try {
    const ratios = await Ratios.find();

    const formatted = ratios.map((doc) => {
      const ratiosArray = Object.entries(doc._doc)
        .filter(
          ([key]) =>
            ![
              "_id",
              "customer_name",
              "lead_id",
              "__v",
              "createdAt",
              "updatedAt",
              "financial_strength",
            ].includes(key)
        )
        .map(([key, val]) => ({
          name: key,
          threshold: val?.threshold ?? null,
          value_2023: val?.value_2023 ?? null,
          red_flag_2023: val?.red_flag_2023 ?? false,
          value_2024: val?.value_2024 ?? null,
          red_flag_2024: val?.red_flag_2024 ?? false,
          value_2025: val?.value_2025 ?? null,
          red_flag_2025: val?.red_flag_2025 ?? false,
        }));

      return {
        _id: doc._id,
        customer_name: doc.customer_name,
        lead_id: doc.lead_id,
        ratios: ratiosArray,
        // ✅ include subtotal so frontend can calculate ratio_health
        financial_strength: {
          subtotal: doc.financial_strength?.subtotal ?? null,
        },
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching all ratios:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:leadId", async (req, res) => {
  try {
    const lead_id = req.params.leadId;
    const leadDoc = await Lead.findById(lead_id);
    const company_name = leadDoc.business_name;
    const actualLeadId = leadDoc.lead_id;

    let doc = await ExtractedValues.findOne({
      lead_id: actualLeadId,
      customer_name: company_name,
    });

    if (!doc) {
      return res.status(404).json({ message: "Matching company not found" });
    }

    return res.json(doc);
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Get Ratios by customer_name & lead_id
router.get("/:leadId/ratios", async (req, res) => {
  try {
    const lead_id = req.params.leadId;
    const leadDoc = await Lead.findById(lead_id);

    if (!leadDoc) return res.status(404).json({ message: "Lead not found" });

    const company_name = leadDoc.business_name;
    const actualLeadId = leadDoc.lead_id;

    const ratioDoc = await Ratios.findOne({
      customer_name: company_name,
      lead_id: actualLeadId,
    });

    if (!ratioDoc) {
      return res.json([]);
    }

    const ratiosArray = Object.entries(ratioDoc._doc)
      .filter(
        ([key]) =>
          ![
            "_id",
            "customer_name",
            "lead_id",
            "__v",
            "createdAt",
            "updatedAt",
          ].includes(key)
      )
      .map(([key, val]) => ({
        name: key,
        threshold: val?.threshold ?? null,
        value_2023: val?.value_2023 ?? null,
        red_flag_2023: val?.red_flag_2023 ?? false,
        value_2024: val?.value_2024 ?? null,
        red_flag_2024: val?.red_flag_2024 ?? false,
        value_2025: val?.value_2025 ?? null,
        red_flag_2025: val?.red_flag_2025 ?? false,
      }));

    res.json(ratiosArray);
  } catch (err) {
    console.error("Error fetching ratios:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Update analysis data
router.put("/analysisByid/:id", async (req, res) => {
  try {
    // Fix: Use camelCase to match frontend
    const { balanceSheet, profitLoss, cashFlow } = req.body;

    const doc = await ExtractedValues.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    const updatedDoc = await ExtractedValues.findByIdAndUpdate(
      req.params.id,
      { $set: { balanceSheet, profitLoss, cashFlow } },
      { new: true }
    );

    res.json({ message: "Analysis data updated successfully", updatedDoc });
  } catch (err) {
    console.error("Error updating analysis:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
