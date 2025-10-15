const ExtractedValues = require("../models/ExtractedValues");
const Ratios = require("../models/Ratios");
const Risk = require("../models/Risk");
const Summary = require("../models/Summary");
const { getSummaries } = require("./summariesPrompt");
const { RiskRatioCalculator } = require("./riskRatioCalculator");
const { FinancialRatioCalculator } = require("./ratioCalculatorWithFallback");

const calculateSummary = async (actualLeadId) => {
  const extractedValues = await ExtractedValues.findOne({
    lead_id: actualLeadId,
  });
  if (!extractedValues) {
    throw new Error("Extracted values not found");
  }

  const customerName = extractedValues.customer_name;

  const ratios = await Ratios.findOne({
    lead_id: actualLeadId,
  });
  if (!ratios) {
    throw new Error("Ratios not found");
  }

  const risk = await Risk.findOne({
    lead_id: actualLeadId,
  });
  if (!risk) {
    throw new Error("Risk not found");
  }
  const summary = await getSummaries({
    extractedValues: extractedValues,
    ratios: ratios,
    riskRating: risk,
  });
  const summaryJson = JSON.parse(summary.output_text);

  const isExists = await Summary.findOne({
    customer_name: customerName,
    lead_id: actualLeadId,
  });
  if (isExists) {
    console.info("Updating existing summary...");
    await Summary.findOneAndUpdate(
      { customer_name: customerName, lead_id: actualLeadId },
      {
        customer_name: customerName,
        lead_id: actualLeadId,

        executive_summary: summaryJson["executive_summary"],
        "financial_summary_&_ratios": summaryJson["financial_summary_&_ratios"],
        loan_purpose: summaryJson["loan_purpose"],
        recommendation: summaryJson["recommendation"],
        security_offered:
          "Primary Security: , Collateral Security: , Personal Guarantees:",
        swot_analysis: summaryJson["swot_analysis"],
      }
    );
  } else {
    console.info("Creating new summary...");
    await Summary.create({
      customer_name: customerName,
      lead_id: actualLeadId,
      "financial_summary_&_ratios": summaryJson["financial_summary_&_ratios"],
      executive_summary: summaryJson["executive_summary"],
      loan_purpose: summaryJson["loan_purpose"],
      swot_analysis: summaryJson["swot_analysis"],
      security_offered:
        "Primary Security: , Collateral Security: , Personal Guarantees:",
      recommendation: summaryJson["recommendation"],
    });
  }
  return {
    success: true,
    message: "Summary calculated successfully",
    summary: summary,
  };
};

const calculateRisk = async (actualLeadId) => {
  const ratios = await Ratios.findOne({
    lead_id: actualLeadId,
  });
  if (!ratios) {
    throw new Error("Ratios not found");
  }
  const customerName = ratios.customer_name;
  const riskCalculator = new RiskRatioCalculator();
  const risk = riskCalculator.calculateRiskScores(ratios);
  const isExists = await Risk.findOne({
    customer_name: customerName,
    lead_id: actualLeadId,
  });
  if (isExists) {
    console.info("Updating existing risk...");
    await Risk.findOneAndUpdate(
      {
        customer_name: customerName,
        lead_id: actualLeadId,
      },
      risk
    );
  } else {
    console.info("Creating new risk...");
    await Risk.create({
      lead_id: actualLeadId,
      customer_name: customerName,
      ...risk,
    });
  }
  return {
    success: true,
    message: "Risk calculated successfully",
    risk: risk,
  };
};

const calculateRatios = async (actualLeadId) => {
  const extractedValues = await ExtractedValues.findOne({
    lead_id: actualLeadId,
  });
  if (!extractedValues) {
    throw new Error("Extracted values not found");
  }
  const customerName = extractedValues.customer_name;

  const balanceSheet = extractedValues.balanceSheet;
  const profitAndLoss =
    extractedValues.profitLoss || extractedValues.profitAndLoss;
  const cashFlows = extractedValues.cashFlow || extractedValues.cashFlows;

  const ratioCalculator = new FinancialRatioCalculator();
  const ratios = ratioCalculator.computeRatiosFromSchema({
    balanceSheet,
    profitAndLoss,
    cashFlows,
  });

  const isExists = await Ratios.findOne({
    customer_name: customerName,
    lead_id: actualLeadId,
  });

  if (isExists) {
    console.info("Updating existing ratios...");
    await Ratios.findOneAndUpdate(
      {
        customer_name: customerName,
        lead_id: actualLeadId,
      },
      {
        ...ratios,
      }
    );
  } else {
    console.info("Creating new ratios...");
    await Ratios.create({
      customer_name: customerName,
      lead_id: actualLeadId,
      ...ratios,
    });
  }
  return {
    success: true,
    message: "Ratios calculated successfully",
    ratios: ratios,
  };
};

module.exports = {
  calculateSummary,
  calculateRisk,
  calculateRatios,
};
