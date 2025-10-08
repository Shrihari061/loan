class FinancialRatioCalculator {
  constructor() {
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
    this.years = [2025, 2024, 2023];

    // Thresholds for red flag logic
    this.thresholds = {
      DSCR: { value: 1.2, condition: "less_than", description: "<1.2" },
      "Debt/Equity": {
        value: 2.0,
        condition: "greater_than",
        description: ">2.0",
      },
      "PAT Margin": { value: 0.1, condition: "less_than", description: "<10%" },
      "Current Ratio": {
        value: 1.0,
        condition: "less_than",
        description: "<1.0",
      },
      "Quick Ratio": {
        value: 1.0,
        condition: "less_than",
        description: "<1.0",
      },
      "Interest Coverage": {
        value: 1.5,
        condition: "less_than",
        description: "<1.5",
      },
      "Net profit Margin": {
        value: 0.05,
        condition: "less_than",
        description: "<5%",
      },
      "Return on Assets": {
        value: 0.05,
        condition: "less_than",
        description: "<5%",
      },
      "Return on equity": {
        value: 0.08,
        condition: "less_than",
        description: "<8%",
      },
      "EBITDA Margin": {
        value: 0.1,
        condition: "less_than",
        description: "<10%",
      },
      "Accounts Receivable Days": {
        value: 90,
        condition: "greater_than",
        description: ">90",
      },
      "Accounts payable days": {
        value: 30,
        condition: "greater_than",
        description: ">30",
      },
      "Asset Turnover Ratio": {
        value: 1.0,
        condition: "less_than",
        description: "<1.0",
      },
    };
  }

  toNumber(x) {
    if (x === null || x === undefined) return 0.0;
    if (typeof x === "number") return x;
    let s = String(x).trim();
    if (s.toLowerCase() === "null" || s === "") return 0.0;
    s = s.replace(/,/g, "");
    if (s.startsWith("(") && s.endsWith(")")) {
      s = "-" + s.slice(1, -1);
    }
    const num = parseFloat(s);
    return isNaN(num) ? 0.0 : num;
  }

  getValue(data, path, year) {
    const keys = path.split(".");
    let current = data;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return 0.0;
      }
    }
    const valueKey = `value_${year}`;
    return this.toNumber(current ? current[valueKey] : 0.0);
  }

  // Helper function to access flexible group items with partial matching
  getFlexibleGroupValue(data, sectionPath, searchFieldName, year) {
    try {
      const keys = sectionPath.split(".");
      let current = data;
      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return 0.0;
        }
      }

      if (!current || !Array.isArray(current.flexibleGroupItems)) {
        return 0.0;
      }

      // Search for field with partial matching
      const flexibleItems = current.flexibleGroupItems;
      for (const item of flexibleItems) {
        if (item && item.fieldName) {
          const fieldName = item.fieldName.toLowerCase();
          const searchName = searchFieldName.toLowerCase();

          // Exact match first
          if (fieldName === searchName) {
            return this.toNumber(item[`value_${year}`]);
          }

          // Partial match for common variations
          if (
            fieldName.includes(searchName) ||
            searchName.includes(fieldName)
          ) {
            return this.toNumber(item[`value_${year}`]);
          }

          // Handle common field name variations
          const variations = this.getFieldNameVariations(searchFieldName);
          for (const variation of variations) {
            if (fieldName.includes(variation.toLowerCase())) {
              return this.toNumber(item[`value_${year}`]);
            }
          }
        }
      }

      return 0.0;
    } catch (error) {
      console.warn(
        `Error accessing flexible group item for ${searchFieldName}:`,
        error.message
      );
      return 0.0;
    }
  }

  // Get common variations of field names for flexible group matching
  getFieldNameVariations(fieldName) {
    const variations = {
      Inventories: [
        "inventory",
        "stock",
        "inventories",
        "raw materials",
        "finished goods",
      ],
      "Trade Receivables": [
        "receivables",
        "debtors",
        "accounts receivable",
        "trade debtors",
      ],
      "Trade Payables": [
        "payables",
        "creditors",
        "accounts payable",
        "trade creditors",
      ],
      "Cash and Cash Equivalents": [
        "cash",
        "bank",
        "cash equivalents",
        "bank balance",
      ],
      "Property, Plant and Equipment": [
        "ppe",
        "fixed assets",
        "plant",
        "equipment",
        "property",
      ],
      "Financial Liabilities - Borrowings": [
        "borrowings",
        "loans",
        "debt",
        "borrowed funds",
      ],
      "Financial Liabilities - Lease": [
        "lease",
        "lease liability",
        "lease obligations",
      ],
      "Employee Benefits Expense": [
        "employee",
        "salaries",
        "wages",
        "benefits",
        "payroll",
      ],
      "Depreciation, Amortisation and Impairment Expenses": [
        "depreciation",
        "amortization",
        "impairment",
      ],
      "Finance Costs": [
        "interest",
        "finance cost",
        "borrowing cost",
        "interest expense",
      ],
    };

    return variations[fieldName] || [fieldName];
  }

  // Enhanced getValue with fallback mechanisms
  getValueWithFallback(data, primaryPath, fallbackPaths, year) {
    // Try primary path first
    let value = this.getValue(data, primaryPath, year);
    if (value !== 0.0) {
      return value;
    }

    // Try fallback paths
    for (const fallbackPath of fallbackPaths) {
      value = this.getValue(data, fallbackPath, year);
      if (value !== 0.0) {
        console.log(`Using fallback for ${primaryPath}: ${fallbackPath}`);
        return value;
      }
    }

    return 0.0;
  }

  // --- PRIVATE CALCULATION METHODS (Unchanged) ---

  _calculateDSCR(data, year) {
    // FALLBACK LOCATION 1: DSCR Calculation with fallbacks
    const profitForTheYear = this.getValueWithFallback(
      data,
      "profitAndLoss.profitForTheYear",
      [
        "profitAndLoss.profitBeforeTax", // Fallback to PBT if PAT not available
        "profitAndLoss.totalComprehensiveIncomeForTheYear", // Last resort
      ],
      year
    );

    const depreciation = this.getValueWithFallback(
      data,
      "profitAndLoss.depreciationAndAmortizationExpenses",
      [
        "cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.depreciationAndAmortization", // Fallback to CF depreciation
      ],
      year
    );

    const financeCost = this.getValueWithFallback(
      data,
      "profitAndLoss.financeCost",
      [
        "cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.financeCost", // Fallback to CF finance cost
      ],
      year
    );

    const leasePayments = this.getValue(
      data,
      "cashFlows.paymentOfLeaseLiabilities",
      year
    );
    const numerator = profitForTheYear + depreciation + financeCost;
    const denominator = financeCost + leasePayments * -1; // Lease payments are negative in CF
    return denominator === 0 ? 0 : numerator / denominator;
  }

  _calculateDebtEquity(data, year) {
    // FALLBACK LOCATION 2: Debt/Equity Calculation with fallbacks
    const nonCurrentBorrowings = this.getValueWithFallback(
      data,
      "balanceSheet.equityAndLiabilities.nonCurrentLiabilities.financialLiabilitiesBorrowings",
      [
        "balanceSheet.equityAndLiabilities.nonCurrentLiabilities.otherFinancialLiabilities", // Fallback to other financial liabilities
      ],
      year
    );

    const currentBorrowings = this.getValueWithFallback(
      data,
      "balanceSheet.equityAndLiabilities.currentLiabilities.financialLiabilitiesBorrowings",
      [
        "balanceSheet.equityAndLiabilities.currentLiabilities.otherFinancialLiabilities", // Fallback to other financial liabilities
      ],
      year
    );

    const nonCurrentLease = this.getValue(
      data,
      "balanceSheet.equityAndLiabilities.nonCurrentLiabilities.financialLiabilitiesLease",
      year
    );
    const currentLease = this.getValue(
      data,
      "balanceSheet.equityAndLiabilities.currentLiabilities.financialLiabilitiesLease",
      year
    );
    const totalDebt =
      nonCurrentBorrowings + currentBorrowings + nonCurrentLease + currentLease;

    const totalEquity = this.getValueWithFallback(
      data,
      "balanceSheet.equityAndLiabilities.totalEquity",
      [
        "balanceSheet.equityAndLiabilities.equityShareCapital", // Fallback to just share capital
        "balanceSheet.equityAndLiabilities.otherEquity", // Last resort - other equity only
      ],
      year
    );

    return totalEquity === 0 ? 0 : totalDebt / totalEquity;
  }

  _calculatePATMargin(data, year) {
    // FALLBACK LOCATION 3: PAT Margin Calculation with fallbacks
    const pat = this.getValueWithFallback(
      data,
      "profitAndLoss.profitForTheYear",
      [
        "profitAndLoss.profitBeforeTax", // Fallback to PBT if PAT not available
        "profitAndLoss.totalComprehensiveIncomeForTheYear", // Last resort
      ],
      year
    );

    const revenue = this.getValueWithFallback(
      data,
      "profitAndLoss.revenueFromOperations",
      [
        "profitAndLoss.totalIncome", // Fallback to total income
        "profitAndLoss.otherIncomeNet", // Last resort - other income only
      ],
      year
    );

    return revenue === 0 ? 0 : pat / revenue;
  }

  _calculateCurrentRatio(data, year) {
    // FALLBACK LOCATION 4: Current Ratio Calculation with fallbacks
    const currentAssets = this.getValueWithFallback(
      data,
      "balanceSheet.currentAssets.total",
      [
        "balanceSheet.currentAssets.cashAndCashEquivalents", // Fallback to cash only
        "balanceSheet.currentAssets.tradeReceivables", // Last resort - receivables only
      ],
      year
    );

    const currentLiabilities = this.getValueWithFallback(
      data,
      "balanceSheet.equityAndLiabilities.currentLiabilities.total",
      [
        "balanceSheet.equityAndLiabilities.currentLiabilities.financialLiabilitiesBorrowings", // Fallback to borrowings only
        "balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesMicroAndSmall", // Last resort - trade payables only
      ],
      year
    );

    return currentLiabilities === 0 ? 0 : currentAssets / currentLiabilities;
  }

  _calculateQuickRatio(data, year) {
    // FALLBACK LOCATION 5: Quick Ratio Calculation with flexible group access
    const currentAssets = this.getValueWithFallback(
      data,
      "balanceSheet.currentAssets.total",
      [
        "balanceSheet.currentAssets.cashAndCashEquivalents", // Fallback to cash only
        "balanceSheet.currentAssets.tradeReceivables", // Last resort - receivables only
      ],
      year
    );

    // Enhanced inventory access with flexible group fallback
    let inventories = this.getValue(
      data,
      "balanceSheet.currentAssets.flexibleGroupItems.0.Inventories",
      year
    );
    if (inventories === 0.0) {
      inventories = this.getValue(
        data,
        "balanceSheet.currentAssets.Inventories",
        year
      );
    }
    if (inventories === 0.0) {
      // Try flexible group search for inventories
      inventories = this.getFlexibleGroupValue(
        data,
        "balanceSheet.currentAssets",
        "Inventories",
        year
      );
    }

    const currentLiabilities = this.getValueWithFallback(
      data,
      "balanceSheet.equityAndLiabilities.currentLiabilities.total",
      [
        "balanceSheet.equityAndLiabilities.currentLiabilities.financialLiabilitiesBorrowings", // Fallback to borrowings only
        "balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesMicroAndSmall", // Last resort - trade payables only
      ],
      year
    );

    return currentLiabilities === 0
      ? 0
      : (currentAssets - inventories) / currentLiabilities;
  }

  _calculateInterestCoverage(data, year) {
    // FALLBACK LOCATION 6: Interest Coverage Calculation with fallbacks
    const pbt = this.getValueWithFallback(
      data,
      "profitAndLoss.profitBeforeTax",
      [
        "profitAndLoss.profitForTheYear", // Fallback to PAT if PBT not available
        "profitAndLoss.totalComprehensiveIncomeForTheYear", // Last resort
      ],
      year
    );

    const financeCost = this.getValueWithFallback(
      data,
      "profitAndLoss.financeCost",
      [
        "cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.financeCost", // Fallback to CF finance cost
      ],
      year
    );

    return financeCost === 0 ? 0 : pbt / financeCost;
  }

  _calculateROA(data, year) {
    // FALLBACK LOCATION 7: ROA Calculation with fallbacks
    const pat = this.getValueWithFallback(
      data,
      "profitAndLoss.profitForTheYear",
      [
        "profitAndLoss.profitBeforeTax", // Fallback to PBT if PAT not available
        "profitAndLoss.totalComprehensiveIncomeForTheYear", // Last resort
      ],
      year
    );

    const totalAssets = this.getValueWithFallback(
      data,
      "balanceSheet.totalAssets",
      [
        "balanceSheet.nonCurrentAssets.total", // Fallback to non-current assets only
        "balanceSheet.currentAssets.total", // Last resort - current assets only
      ],
      year
    );

    return totalAssets === 0 ? 0 : pat / totalAssets;
  }

  _calculateROE(data, year) {
    // FALLBACK LOCATION 8: ROE Calculation with fallbacks
    const pat = this.getValueWithFallback(
      data,
      "profitAndLoss.profitForTheYear",
      [
        "profitAndLoss.profitBeforeTax", // Fallback to PBT if PAT not available
        "profitAndLoss.totalComprehensiveIncomeForTheYear", // Last resort
      ],
      year
    );

    const totalEquity = this.getValueWithFallback(
      data,
      "balanceSheet.equityAndLiabilities.totalEquity",
      [
        "balanceSheet.equityAndLiabilities.equityShareCapital", // Fallback to just share capital
        "balanceSheet.equityAndLiabilities.otherEquity", // Last resort - other equity only
      ],
      year
    );

    return totalEquity === 0 ? 0 : pat / totalEquity;
  }

  _calculateEBITDAMargin(data, year) {
    // FALLBACK LOCATION 9: EBITDA Margin Calculation with fallbacks
    const pbt = this.getValueWithFallback(
      data,
      "profitAndLoss.profitBeforeTax",
      [
        "profitAndLoss.profitForTheYear", // Fallback to PAT if PBT not available
        "profitAndLoss.totalComprehensiveIncomeForTheYear", // Last resort
      ],
      year
    );

    const depreciation = this.getValueWithFallback(
      data,
      "profitAndLoss.depreciationAndAmortizationExpenses",
      [
        "cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.depreciationAndAmortization", // Fallback to CF depreciation
      ],
      year
    );

    const revenue = this.getValueWithFallback(
      data,
      "profitAndLoss.revenueFromOperations",
      [
        "profitAndLoss.totalIncome", // Fallback to total income
        "profitAndLoss.otherIncomeNet", // Last resort - other income only
      ],
      year
    );

    return revenue === 0 ? 0 : (pbt + depreciation) / revenue;
  }

  _calculateARDays(data, year) {
    // FALLBACK LOCATION 10: AR Days Calculation with flexible group access
    let receivables = this.getValue(
      data,
      "balanceSheet.currentAssets.tradeReceivables",
      year
    );
    if (receivables === 0.0) {
      // Try flexible group search for trade receivables
      receivables = this.getFlexibleGroupValue(
        data,
        "balanceSheet.currentAssets",
        "Trade Receivables",
        year
      );
    }

    const revenue = this.getValueWithFallback(
      data,
      "profitAndLoss.revenueFromOperations",
      [
        "profitAndLoss.totalIncome", // Fallback to total income
        "profitAndLoss.otherIncomeNet", // Last resort - other income only
      ],
      year
    );

    return revenue === 0 ? 0 : (receivables / revenue) * 365;
  }

  _calculateAPDays(data, year) {
    // FALLBACK LOCATION 11: AP Days Calculation with flexible group access
    const priorYear = year - 1;
    const earliestYear = Math.min(...this.years);
    if (year === earliestYear) {
      return 0; // Cannot calculate average for the earliest year
    }

    // Enhanced payables calculation with flexible group fallback
    let payablesCurrentYear =
      this.getValue(
        data,
        "balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesMicroAndSmall",
        year
      ) +
      this.getValue(
        data,
        "balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesOtherCreditors",
        year
      );

    if (payablesCurrentYear === 0.0) {
      // Try flexible group search for trade payables
      payablesCurrentYear = this.getFlexibleGroupValue(
        data,
        "balanceSheet.equityAndLiabilities.currentLiabilities",
        "Trade Payables",
        year
      );
    }

    let payablesPriorYear =
      this.getValue(
        data,
        "balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesMicroAndSmall",
        priorYear
      ) +
      this.getValue(
        data,
        "balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesOtherCreditors",
        priorYear
      );

    if (payablesPriorYear === 0.0) {
      // Try flexible group search for trade payables for prior year
      payablesPriorYear = this.getFlexibleGroupValue(
        data,
        "balanceSheet.equityAndLiabilities.currentLiabilities",
        "Trade Payables",
        priorYear
      );
    }

    const averagePayables = (payablesCurrentYear + payablesPriorYear) / 2;

    let purchasesProxy = this.getValueWithFallback(
      data,
      "profitAndLoss.coreOperatingCosts",
      [
        "profitAndLoss.totalExpenses", // Fallback to total expenses
        "profitAndLoss.employeeBenefitExpenses", // Last resort - employee expenses only
      ],
      year
    );

    return purchasesProxy === 0 ? 0 : (averagePayables / purchasesProxy) * 365;
  }

  _calculateAssetTurnover(data, year) {
    // FALLBACK LOCATION 12: Asset Turnover Calculation with fallbacks
    const revenue = this.getValueWithFallback(
      data,
      "profitAndLoss.revenueFromOperations",
      [
        "profitAndLoss.totalIncome", // Fallback to total income
        "profitAndLoss.otherIncomeNet", // Last resort - other income only
      ],
      year
    );

    const totalAssets = this.getValueWithFallback(
      data,
      "balanceSheet.totalAssets",
      [
        "balanceSheet.nonCurrentAssets.total", // Fallback to non-current assets only
        "balanceSheet.currentAssets.total", // Last resort - current assets only
      ],
      year
    );

    return totalAssets === 0 ? 0 : revenue / totalAssets;
  }

  // --- MAIN PUBLIC METHOD (Updated with Flagging Logic) ---

  computeRatiosFromSchema(schemaData) {
    const results = {};

    this.ratioNames.forEach((name) => {
      results[name] = {};
      const thresholdInfo = this.thresholds[name];
      if (thresholdInfo) {
        results[name].threshold = thresholdInfo.description;
      }

      this.years.forEach((year) => {
        let value = 0;
        // This switch maps the ratio name to its dedicated calculation function
        switch (name) {
          case "DSCR":
            value = this._calculateDSCR(schemaData, year);
            break;
          case "Debt/Equity":
            value = this._calculateDebtEquity(schemaData, year);
            break;
          case "PAT Margin":
            value = this._calculatePATMargin(schemaData, year);
            break;
          case "Current Ratio":
            value = this._calculateCurrentRatio(schemaData, year);
            break;
          case "Quick Ratio":
            value = this._calculateQuickRatio(schemaData, year);
            break;
          case "Interest Coverage":
            value = this._calculateInterestCoverage(schemaData, year);
            break;
          case "Net profit Margin":
            value = this._calculatePATMargin(schemaData, year);
            break;
          case "Return on Assets":
            value = this._calculateROA(schemaData, year);
            break;
          case "Return on equity":
            value = this._calculateROE(schemaData, year);
            break;
          case "EBITDA Margin":
            value = this._calculateEBITDAMargin(schemaData, year);
            break;
          case "Accounts Receivable Days":
            value = this._calculateARDays(schemaData, year);
            break;
          case "Accounts payable days":
            value = this._calculateAPDays(schemaData, year);
            break;
          case "Asset Turnover Ratio":
            value = this._calculateAssetTurnover(schemaData, year);
            break;
        }

        // Add the calculated value to the results
        results[name][`value_${year}`] = value;

        // --- NEW: Red Flag Logic ---
        let red_flag = false;
        if (thresholdInfo) {
          if (
            thresholdInfo.condition === "less_than" &&
            value < thresholdInfo.value &&
            value !== 0
          ) {
            red_flag = true;
          } else if (
            thresholdInfo.condition === "greater_than" &&
            value > thresholdInfo.value
          ) {
            red_flag = true;
          }
        }
        results[name][`red_flag_${year}`] = red_flag;
      });
    });
    return results;
  }
}

module.exports = {
  FinancialRatioCalculator,
};
