const express = require("express");
const multer = require("multer");
const Lead = require("../models/Lead");
const ExtractedValues = require("../models/ExtractedValues");
const Ratios = require("../models/Ratios");
const Risk = require("../models/Risk");
const Summary = require("../models/Summary");
const fs = require("fs");
const path = require("path");
const { aiInstance } = require("../ai/aiInstance");
const router = express.Router();
const { jsonrepair } = require("jsonrepair");
const {
  calculateSummary,
  calculateRisk,
  calculateRatios,
} = require("../ai/ratioAndAIUtils");
const { ObjectId } = require("mongodb");

// Multer setup - store files in memory to save directly in MongoDB
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------------------- GET ALL LEADS --------------------
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find({})
      .sort({ created_date: -1 })
      .select("-financialDocuments");
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// -------------------- GET LEAD BY ID --------------------
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).select(
      "-financialDocuments"
    );
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// -------------------- GET DATA BY LEAD ID (mock JSON) --------------------
router.get("/:id/data", async (req, res) => {
  try {
    const recordId = req.params.id;

    // Load JSON file
    const mockDataPath = path.join(__dirname, "../data/mockData.json");
    const raw = fs.readFileSync(mockDataPath, "utf8");
    const mockData = JSON.parse(raw);

    // Verify CIN in the JSON
    if (!mockData.company || !mockData.company.cin) {
      return res.status(500).json({ error: "Mock data is missing CIN field" });
    }

    // Here, treat recordId as CIN (or adapt if your ID is Mongo _id)
    if (recordId !== mockData.company.cin) {
      return res.status(404).json({ error: "No data found for this CIN" });
    }

    res.json({
      success: true,
      company: mockData.company,
      directors: mockData.directors,
      contactPersons: mockData.contactPersons,
      loanTypes: mockData.loanTypes,
    });
  } catch (err) {
    console.error("Error fetching mock data:", err);
    res.status(500).json({ error: "Failed to fetch mock data" });
  }
});

// -------------------- CREATE NEW LEAD --------------------
router.post(
  "/",
  upload.fields([
    { name: "financialDocuments", maxCount: 10 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let leadData = {};

      // If JSON is sent in body as "data" string (multipart/form-data with files)
      if (req.body.data) {
        try {
          leadData = JSON.parse(req.body.data);
        } catch {
          return res.status(400).json({ error: "Invalid JSON in data field" });
        }
      } else {
        leadData = req.body;
      }

      // -------------------- Ensure proper structured fields --------------------
      if (leadData.address && typeof leadData.address === "string") {
        try {
          leadData.address = JSON.parse(leadData.address);
        } catch {}
      }
      if (leadData.directors && typeof leadData.directors === "string") {
        try {
          leadData.directors = JSON.parse(leadData.directors);
        } catch {
          leadData.directors = [];
        }
      }

      leadData.aml_company_status = leadData.aml_company_status || "idle";
      leadData.aml_director_status = leadData.aml_director_status || "idle";
      leadData.last_updated = new Date().toISOString();

      // -------------------- Handle uploaded files --------------------
      if (req.files?.financialDocuments) {
        leadData.financialDocuments = req.files.financialDocuments.map(
          (file) => ({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            fileData: file.buffer,
          })
        );
      }
      if (req.files?.signature?.[0]) {
        leadData.signature = {
          fileName: req.files.signature[0].originalname,
          fileType: req.files.signature[0].mimetype,
          fileSize: req.files.signature[0].size,
          fileData: req.files.signature[0].buffer,
        };
      }

      // -------------------- Save to MongoDB --------------------
      const newLead = new Lead(leadData);
      await newLead.save();

      // -------------------- Send response --------------------
      res.status(201).json(newLead);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create lead" });
    }
  }
);

// -------------------- UPDATE LEAD --------------------
router.put("/:id", upload.none(), async (req, res) => {
  try {
    let updateData = req.body;

    // If body contains JSON strings for structured fields, parse them
    if (updateData.address && typeof updateData.address === "string") {
      try {
        updateData.address = JSON.parse(updateData.address);
      } catch {}
    }

    if (updateData.directors && typeof updateData.directors === "string") {
      try {
        updateData.directors = JSON.parse(updateData.directors);
      } catch {
        updateData.directors = [];
      }
    }

    // Update last_updated timestamp
    updateData.last_updated = new Date().toISOString();

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// -------------------- DELETE LEAD --------------------
router.delete("/:id", async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);
    if (!deletedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// 🔹 Revert a CQ record (set status = "In Progress")
router.put("/:id/revert", async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { status: "In Progress" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Customer not found" });

    res.json({
      message: "Customer status reverted to In Progress",
      record: updated,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to revert status" });
  }
});

async function triggerRatioGeneration(leadId, customerName, hasChanges) {
  console.info(`🔄 Starting ratio generation for ${customerName} (${leadId})`);
  console.info(`📊 Data changed: ${hasChanges}`);

  try {
    console.info(`📈 Calculating ratios for ${customerName}...`);
    const ratiosResponse = await calculateRatios(leadId);
    console.info(`✅ Ratios calculated successfully for ${customerName}`);

    console.info(`⚖️ Calculating risk for ${customerName}...`);
    const riskResponse = await calculateRisk(leadId);
    console.info(`✅ Risk calculated successfully for ${customerName}`);

    console.info(`📝 Generating summary for ${customerName}...`);
    const summaryResponse = await calculateSummary(leadId);
    console.info(`✅ Summary generated successfully for ${customerName}`);

    console.info(`🎉 Ratio generation completed for ${customerName}`);
    return {
      status: "processing",
      message: "Ratio generation initiated",
      ratios: ratiosResponse,
      risk: riskResponse,
      summary: summaryResponse,
    };
  } catch (error) {
    console.error(`❌ Ratio generation failed for ${customerName}:`, error);
    throw error;
  }
}

// 🔹 Approve a CQ record (set status = "approved")
router.put("/:id/approve", async (req, res) => {
  try {
    const { hasChanges } = req.body;
    console.info(
      `🚀 Approving lead ${req.params.id} with hasChanges: ${hasChanges}`
    );

    // First check if lead exists
    const leadExists = await Lead.findById(req.params.id).select(
      "-financialDocuments"
    );
    if (!leadExists) {
      console.info(`❌ Lead not found for ID: ${req.params.id}`);
      return res.status(404).json({ error: "Customer not found" });
    }

    console.info(
      `✅ Lead found: ${
        leadExists.business_name || leadExists.customer_name || "Unknown"
      }`
    );

    // Update lead status
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { status: "Approved" },
      { new: true }
    );

    if (!updated) {
      console.info(`❌ Failed to update lead status for ID: ${req.params.id}`);
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get customer details for ratio generation check
    const customerName = updated.business_name;
    const leadId = updated.lead_id;
    console.info(`👤 Processing approval for ${customerName} (${leadId})`);

    // Check if Ratios, Risk, and Summary documents exist
    console.info(
      `🔍 Checking existing ratios/risk/summaries for ${customerName}...`
    );
    const ratiosExist = await Ratios.findOne({
      customer_name: customerName,
      lead_id: leadId,
    });
    const riskExist = await Risk.findOne({
      customer_name: customerName,
      lead_id: leadId,
    });
    const summaryExist = await Summary.findOne({
      customer_name: customerName,
      lead_id: leadId,
    });

    console.info(
      `📊 Existing documents - Ratios: ${!!ratiosExist}, Risk: ${!!riskExist}, Summary: ${!!summaryExist}`
    );

    const needsGeneration =
      hasChanges || !ratiosExist || !riskExist || !summaryExist;

    if (needsGeneration) {
      console.info(
        `🔄 Ratio generation needed for ${customerName} (hasChanges: ${hasChanges})`
      );
      // Trigger ratio generation asynchronously
      triggerRatioGeneration(leadId, customerName, hasChanges)
        .then((result) => {
          console.log(
            `Ratio generation completed for ${customerName}:`,
            result
          );
        })
        .catch((error) => {
          console.error(
            `❌ Ratio generation failed for ${customerName}:`,
            error
          );
        });

      res.json({
        message:
          "Customer approved successfully. Ratios are being generated in the background.",
        record: updated,
        ratioGeneration: "initiated",
      });
    } else {
      console.info(
        `⏭️ Skipping ratio generation for ${customerName} - all documents exist and no changes`
      );
      res.json({
        message: "Customer approved successfully",
        record: updated,
        ratioGeneration: "skipped",
      });
    }
  } catch (err) {
    console.error("❌ Approve error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// 🔹 Reject a CQ record (set status = "rejected")
router.put("/:id/reject", async (req, res) => {
  try {
    console.info(`🚫 Rejecting lead ${req.params.id}`);

    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Customer not found" });

    console.info(`✅ Lead rejected successfully for ${updated.customer_name}`);
    res.json({
      message: "Customer rejected successfully",
      record: updated,
    });
  } catch (err) {
    console.error("❌ Reject error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// -------------------- TRIGGER BFSI-LOS PIPELINE --------------------
router.post("/:id/analyze", async (req, res) => {
  try {
    const recordId = req.params.id; // Mongo _id of the record
    const lead = await Lead.findById(recordId);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (!lead.financialDocuments || lead.financialDocuments.length === 0) {
      return res
        .status(400)
        .json({ error: "No financial documents found for analysis" });
    }

    // 👉 use actual business lead_id stored in the document
    const actualLeadId = lead.lead_id;
    const customerName = lead.business_name || "Unknown Company";

    // Create temporary directory for BFSI-LOS processing
    const tempDir = path.join(__dirname, "../temp_uploads", recordId);
    const standaloneDir = path.join(tempDir, "Standalone");
    const year2024Dir = path.join(standaloneDir, "2024-25");
    const year2023Dir = path.join(standaloneDir, "2023-24");

    // Create directory structure
    fs.mkdirSync(year2024Dir, { recursive: true });
    fs.mkdirSync(year2023Dir, { recursive: true });

    // Save uploaded files to appropriate directories
    let filesProcessed = 0;
    const processedFiles = new Map(); // Track what files we've already saved

    for (const doc of lead.financialDocuments) {
      const fileName = doc.fileName;
      const fileBuffer = doc.fileData;

      // Determine document type and year from filename
      let docType = "";
      let year = "";

      if (fileName.includes("Balance Sheet") || fileName.includes("BS")) {
        docType = "BS.pdf";
      } else if (fileName.includes("Profit") || fileName.includes("PL")) {
        docType = "PL.pdf";
      } else if (fileName.includes("Cash Flow") || fileName.includes("CF")) {
        docType = "CF.pdf";
      }

      if (fileName.includes("2024") || fileName.includes("2025")) {
        year = "2024-25";
      } else if (fileName.includes("2023")) {
        year = "2023-24";
      }

      if (docType && year) {
        const targetDir = year === "2024-25" ? year2024Dir : year2023Dir;
        const filePath = path.join(targetDir, docType);
        const fileKey = `${year}-${docType}`;

        // Check if we already processed this year-docType combination
        if (!processedFiles.has(fileKey)) {
          // For 2024-25, prioritize files with '2025' in name, then '2024'
          if (year === "2024-25") {
            if (fileName.includes("2025")) {
              fs.writeFileSync(filePath, fileBuffer);
              processedFiles.set(fileKey, filePath);
              filesProcessed++;
              console.log(`Saved ${fileName} as ${fileKey} (prioritized 2025)`);
            } else if (
              fileName.includes("2024") &&
              !processedFiles.has(fileKey)
            ) {
              fs.writeFileSync(filePath, fileBuffer);
              processedFiles.set(fileKey, filePath);
              filesProcessed++;
              console.log(`Saved ${fileName} as ${fileKey} (2024 fallback)`);
            }
          } else {
            // For 2023-24, save directly
            fs.writeFileSync(filePath, fileBuffer);
            processedFiles.set(fileKey, filePath);
            filesProcessed++;
            console.log(`Saved ${fileName} as ${fileKey}`);
          }
        } else if (year === "2024-25" && fileName.includes("2025")) {
          // Override with 2025 file if we previously saved 2024
          const previousFile = processedFiles.get(fileKey);
          if (previousFile && previousFile.includes("2024")) {
            fs.writeFileSync(filePath, fileBuffer);
            processedFiles.set(fileKey, filePath);
            console.log(
              `Overrode ${previousFile} with ${fileName} (2025 priority)`
            );
          }
        }
      }
    }

    if (filesProcessed === 0) {
      return res
        .status(400)
        .json({ error: "No valid financial documents found for processing" });
    }

    console.info("filesProcessed", filesProcessed, { processedFiles });

    const balanceSheetResponsePromise = aiInstance.extractBalanceSheet({
      BS_2024_25_FILENAME: processedFiles.get("2024-25-BS.pdf"),
      BS_2023_24_FILENAME: processedFiles.get("2023-24-BS.pdf"),
    });

    const profitLossResponsePromise = aiInstance.extractProfitLoss({
      PL_2024_25_FILENAME: processedFiles.get("2024-25-PL.pdf"),
      PL_2023_24_FILENAME: processedFiles.get("2023-24-PL.pdf"),
    });

    const cashFlowResponsePromise = aiInstance.extractCashFlow({
      CF_2024_25_FILENAME: processedFiles.get("2024-25-CF.pdf"),
      CF_2023_24_FILENAME: processedFiles.get("2023-24-CF.pdf"),
    });

    const [balanceSheetResponse, profitLossResponse, cashFlowResponse] =
      await Promise.all([
        balanceSheetResponsePromise,
        profitLossResponsePromise,
        cashFlowResponsePromise,
      ]);

    if (
      balanceSheetResponse.status == "failed" ||
      profitLossResponse.status == "failed" ||
      cashFlowResponse.status == "failed"
    ) {
      await Lead.findByIdAndUpdate(recordId, {
        analysis_status: "failed",
        analysis_date: new Date().toISOString(),
      });
      return res.status(500).json({ error: "Failed to extract data" });
    }

    if (
      balanceSheetResponse.status == "completed" &&
      profitLossResponse.status == "completed" &&
      cashFlowResponse.status == "completed"
    ) {
      let bsJson, plJson, cfJson;

      try {
        console.info("Parsing Balance Sheet JSON...");
        bsJson = JSON.parse(
          jsonrepair(balanceSheetResponse.output_text)
        ).balanceSheet;
        console.info("Balance Sheet parsed successfully");
      } catch (error) {
        console.error("Balance Sheet JSON parsing error:", error);
        console.error(
          "Balance Sheet raw output:",
          balanceSheetResponse.output_text
        );
        await Lead.findByIdAndUpdate(recordId, {
          analysis_status: "failed",
          analysis_date: new Date().toISOString(),
        });
        return res
          .status(500)
          .json({ error: "Failed to parse Balance Sheet JSON" });
      }

      try {
        console.info("Parsing Profit Loss JSON...");
        plJson = JSON.parse(
          jsonrepair(profitLossResponse.output_text)
        ).profitAndLoss;
        console.info("Profit Loss parsed successfully");
      } catch (error) {
        console.error("Profit Loss JSON parsing error:", error);
        console.error(
          "Profit Loss raw output:",
          profitLossResponse.output_text
        );
        await Lead.findByIdAndUpdate(recordId, {
          analysis_status: "failed",
          analysis_date: new Date().toISOString(),
        });
        return res
          .status(500)
          .json({ error: "Failed to parse Profit Loss JSON" });
      }

      try {
        console.info("Parsing Cash Flow JSON...");
        cfJson = JSON.parse(jsonrepair(cashFlowResponse.output_text)).cashFlows;
        console.info("Cash Flow parsed successfully");
      } catch (error) {
        console.error("Cash Flow JSON parsing error:", error);
        console.error("Cash Flow raw output:", cashFlowResponse.output_text);
        await Lead.findByIdAndUpdate(recordId, {
          analysis_status: "failed",
          analysis_date: new Date().toISOString(),
        });
        return res
          .status(500)
          .json({ error: "Failed to parse Cash Flow JSON" });
      }

      console.info("All JSON parsing completed successfully");
      console.info("Balance Sheet data:", bsJson ? "Present" : "Missing");
      console.info("Profit Loss data:", plJson ? "Present" : "Missing");
      console.info("Cash Flow data:", cfJson ? "Present" : "Missing");

      const isExists = await ExtractedValues.findOne({
        customer_name: customerName,
        lead_id: actualLeadId,
      });
      if (isExists) {
        console.info("Updating existing record...");
        const dbUpdate = await ExtractedValues.findOneAndUpdate(
          {
            customer_name: customerName,
            lead_id: actualLeadId,
          },
          {
            balanceSheet: bsJson,
            profitLoss: plJson,
            cashFlow: cfJson,
          },
          {
            new: true,
          }
        );
        console.info("Updated record:", {
          balanceSheet: dbUpdate.balanceSheet ? "Present" : "Missing",
          profitLoss: dbUpdate.profitLoss ? "Present" : "Missing",
          cashFlow: dbUpdate.cashFlow ? "Present" : "Missing",
        });
      } else {
        console.info("Creating new record...");
        const dbUpdate = new ExtractedValues({
          customer_name: customerName,
          lead_id: actualLeadId,
          balanceSheet: bsJson,
          profitLoss: plJson,
          cashFlow: cfJson,
        });
        await dbUpdate.save();
        console.info("Created record:", {
          balanceSheet: dbUpdate.balanceSheet ? "Present" : "Missing",
          profitLoss: dbUpdate.profitLoss ? "Present" : "Missing",
          cashFlow: dbUpdate.cashFlow ? "Present" : "Missing",
        });
      }
    }

    if (
      balanceSheetResponse.status == "completed" &&
      profitLossResponse.status == "completed" &&
      cashFlowResponse.status == "completed"
    ) {
      await Lead.findByIdAndUpdate(recordId, {
        analysis_status: "completed",
        analysis_date: new Date().toISOString(),
      });
    }

    triggerRatioGeneration(actualLeadId, customerName, true).then(() => {
      console.info("Ratios generated successfully");
    });

    return res.json({
      success: true,
      message: "Financial analysis completed successfully",
      recordId: recordId,
      leadId: actualLeadId,
      customerName: customerName,
    });
  } catch (error) {
    console.error("Error in BFSI-LOS pipeline:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// -------------------- CALCULATE RATIOS --------------------

router.post("/:leadId/ratios", async (req, res) => {
  try {
    const actualLeadId = req.params.leadId;
    const ratiosResponse = await calculateRatios(actualLeadId);
    return res.json(ratiosResponse);
  } catch (error) {
    console.error("Error in ratios calculation:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// -------------------- CALCULATE RISK --------------------

router.post("/:leadId/risk", async (req, res) => {
  try {
    const actualLeadId = req.params.leadId;
    const riskResponse = await calculateRisk(actualLeadId);
    return res.json(riskResponse);
  } catch (error) {
    console.error("Error in risk calculation:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// -------------------- CALCULATE SUMMARY --------------------
router.post("/:leadId/summary", async (req, res) => {
  try {
    const actualLeadId = req.params.leadId;
    const summaryResponse = await calculateSummary(actualLeadId);
    return res.json(summaryResponse);
  } catch (error) {
    console.error("Error in summary calculation:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;
