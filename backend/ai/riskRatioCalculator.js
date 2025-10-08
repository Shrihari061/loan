class RiskRatioCalculator {
  constructor() {
    // Fixed weights as per requirements
    this.weights = {
      financial_strength: 50.0,
      management_quality: 30.0,
      industry_risk: 20.0,
    };

    // Fixed scores for management and industry
    this.management_score = 25.0;
    this.industry_score = 15.0;

    // The 13 ratios that contribute to financial strength
    this.ratioNames = [
      "DSCR",
      "Debt/Equity",
      "PAT Margin",
      "Current Ratio",
      "Quick Ratio",
      "Interest Coverage",
      "Net profit Margin",
      "Return on Assets",
      "Return on equity",
      "EBITDA Margin",
      "Accounts Receivable Days",
      "Accounts payable days",
      "Asset Turnover Ratio",
    ];

    this.years = [2023, 2024, 2025];

    // Calculate per-ratio max score (financial strength weight / number of ratios)
    this.per_ratio_max =
      this.weights.financial_strength / this.ratioNames.length;
  }

  /**
   * Calculate risk scores from ratios data
   * @param {Object} ratiosData - The ratios data from ratioCalculatorSchema.js
   * @returns {Object} - Complete risk assessment with scores and buckets
   */
  calculateRiskScores(ratiosData) {
    console.log(ratiosData);
    const result = {
      weights: this.weights,
      financial_strength: {
        per_ratio_max: this.per_ratio_max,
        scores: {},
        subtotals: {},
      },
      management_quality: {
        scores: {},
      },
      industry_risk: {
        scores: {},
      },
      total_score: {},
      risk_bucket: {},
      red_flags: {},
    };

    // Initialize financial strength subtotals for each year
    this.years.forEach((year) => {
      result.financial_strength.subtotals[year] = 0.0;
      result.management_quality.scores[year] = this.management_score;
      result.industry_risk.scores[year] = this.industry_score;
      result.red_flags[year] = [];
    });

    // Process each ratio
    this.ratioNames.forEach((ratioName) => {
      const ratioData = ratiosData[ratioName];
      if (!ratioData) {
        console.warn(`Missing ratio data for: ${ratioName}`);
        return;
      }

      const ratioResult = {
        threshold: ratioData.threshold,
        max: this.per_ratio_max,
      };

      // Calculate scores for each year
      this.years.forEach((year) => {
        const valueKey = `value_${year}`;
        const redFlagKey = `red_flag_${year}`;
        const scoreKey = `score_${year}`;

        const value = ratioData[valueKey];
        const redFlag = ratioData[redFlagKey] || false;

        // Calculate score: 0 if red flag is true, otherwise max score
        const score = redFlag ? 0.0 : this.per_ratio_max;

        // Store the results
        ratioResult[valueKey] = value;
        ratioResult[redFlagKey] = redFlag;
        ratioResult[scoreKey] = parseFloat(score.toFixed(2));

        // Add to financial strength subtotal
        result.financial_strength.subtotals[year] += score;

        // Track red flags
        if (redFlag) {
          result.red_flags[year].push(
            this.getRedFlagDescription(ratioName, value)
          );
        }
      });

      result.financial_strength.scores[ratioName] = ratioResult;
    });

    // Calculate total scores and risk buckets for each year
    this.years.forEach((year) => {
      const financialScore = result.financial_strength.subtotals[year];
      const managementScore = result.management_quality.scores[year];
      const industryScore = result.industry_risk.scores[year];

      const totalScore = financialScore + managementScore + industryScore;

      result.total_score[year] = parseFloat(totalScore.toFixed(2));
      result.risk_bucket[year] = this.getRiskBucket(totalScore);
    });

    return result;
  }

  /**
   * Get risk bucket based on total score
   * @param {number} totalScore - The total calculated score
   * @returns {string} - Risk bucket category
   */
  getRiskBucket(totalScore) {
    if (totalScore > 80) {
      return "Low Risk";
    } else if (totalScore >= 50) {
      return "Medium Risk";
    } else {
      return "High Risk";
    }
  }

  /**
   * Get human-readable red flag description
   * @param {string} ratioName - Name of the ratio
   * @param {any} value - The ratio value
   * @returns {string} - Description of the red flag
   */
  getRedFlagDescription(ratioName, value) {
    const descriptions = {
      DSCR: "Poor debt service coverage ratio",
      "Debt/Equity": "High Debt/Equity ratio",
      "PAT Margin": "Low PAT Margin",
      "Current Ratio": "Weak liquidity ratio",
      "Quick Ratio": "Poor quick liquidity ratio",
      "Interest Coverage": "Low Interest Coverage ratio",
      "Net profit Margin": "Low Net profit Margin",
      "Return on Assets": "Low Return on Assets",
      "Return on equity": "Low Return on equity",
      "EBITDA Margin": "Low EBITDA Margin",
      "Accounts Receivable Days": "High Accounts Receivable Days",
      "Accounts payable days": "High Accounts payable days",
      "Asset Turnover Ratio": "Low Asset Turnover Ratio",
    };

    return descriptions[ratioName] || `${ratioName} red flag`;
  }

  /**
   * Process ratios file and calculate risk scores
   * @param {string} inputFilePath - Path to the ratios JSON file
   * @param {string} outputFilePath - Path to save the risk assessment
   * @returns {Object} - The calculated risk assessment
   */
  processRatiosFile(inputFilePath, outputFilePath) {
    try {
      const fs = require("fs");

      console.log(`Reading ratios from: ${inputFilePath}`);
      const ratiosData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));

      const riskAssessment = this.calculateRiskScores(ratiosData);

      // Save to file if output path provided
      if (outputFilePath) {
        fs.writeFileSync(
          outputFilePath,
          JSON.stringify(riskAssessment, null, 2)
        );
        console.log(`Risk assessment saved to: ${outputFilePath}`);
      }

      return riskAssessment;
    } catch (error) {
      console.error("Error processing ratios file:", error.message);
      throw error;
    }
  }
}

module.exports = { RiskRatioCalculator };
