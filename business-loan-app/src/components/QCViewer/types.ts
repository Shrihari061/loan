// TypeScript interfaces for QCViewer schema refactor

export interface FieldValue {
  value_2023: number | string | null;
  value_2024: number | string | null;
  value_2025: number | string | null;
  source: string;
  unit: string;
  fieldName: string;
}

export interface FlexibleGroupItem {
  fieldName: string;
  value_2023: number | string | null;
  value_2024: number | string | null;
  value_2025: number | string | null;
  source: string;
  unit: string;
}

export interface NonCurrentAssets {
  total: FieldValue;
  propertyPlantAndEquipment: FieldValue;
  rightOfUseAssets: FieldValue;
  capitalWorkInProgress: FieldValue;
  goodwill: FieldValue;
  financialAssetsInvestments: FieldValue;
  financialAssetsLoans: FieldValue;
  otherFinancialAssets: FieldValue;
  deferredTaxAssetsNet: FieldValue;
  incomeTaxAssetsNet: FieldValue;
  otherNonCurrentAssets: FieldValue;
  intangibleAssets: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface CurrentAssets {
  total: FieldValue;
  financialAssetsInvestments: FieldValue;
  tradeReceivables: FieldValue;
  cashAndCashEquivalents: FieldValue;
  financialAssetsLoans: FieldValue;
  otherFinancialAssets: FieldValue;
  incomeTaxAssetsNet: FieldValue;
  otherCurrentAssets: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface NonCurrentLiabilities {
  total: FieldValue;
  financialLiabilitiesBorrowings: FieldValue;
  financialLiabilitiesLease: FieldValue;
  otherFinancialLiabilities: FieldValue;
  deferredTaxLiabilitiesNet: FieldValue;
  otherNonCurrentLiabilities: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface CurrentLiabilities {
  total: FieldValue;
  financialLiabilitiesBorrowings: FieldValue;
  financialLiabilitiesLease: FieldValue;
  tradePayablesMicroAndSmall: FieldValue;
  tradePayablesOtherCreditors: FieldValue;
  otherFinancialLiabilities: FieldValue;
  otherCurrentLiabilities: FieldValue;
  provisionsCurrent: FieldValue;
  incomeTaxLiabilitiesNet: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface EquityAndLiabilities {
  totalEquity: FieldValue;
  equityShareCapital: FieldValue;
  otherEquity: FieldValue;
  nonCurrentLiabilities: NonCurrentLiabilities;
  currentLiabilities: CurrentLiabilities;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface BalanceSheetData {
  fileGroup: string;
  sourceFiles: string[];
  totalAssets: FieldValue;
  totalEquityAndLiabilities: FieldValue;
  nonCurrentAssets: NonCurrentAssets;
  currentAssets: CurrentAssets;
  equityAndLiabilities: EquityAndLiabilities;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface EarningsPerShare {
  basic: FieldValue;
  diluted: FieldValue;
}

export interface ProfitLossData {
  fileGroup: string;
  sourceFiles: string[];
  totalIncome: FieldValue;
  revenueFromOperations: FieldValue;
  otherIncomeNet: FieldValue;
  coreOperatingCosts: FieldValue;
  exceptionalItemsNet: FieldValue;
  totalExpenses: FieldValue;
  employeeBenefitExpenses: FieldValue;
  depreciationAndAmortizationExpenses: FieldValue;
  financeCost: FieldValue;
  costOfTechnicalSubContractors: FieldValue;
  travelExpenses: FieldValue;
  communicationExpenses: FieldValue;
  consultancyAndProfessionalCharges: FieldValue;
  otherExpensesAggregated: FieldValue;
  profitBeforeTax: FieldValue;
  profitForTheYear: FieldValue;
  currentTax: FieldValue;
  deferredTax: FieldValue;
  totalComprehensiveIncomeForTheYear: FieldValue;
  earningsPerShare: EarningsPerShare;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface Adjustments {
  depreciationAndAmortization: FieldValue;
  incomeTaxExpense: FieldValue;
  impairmentLossRecognizedReversed: FieldValue;
  financeCost: FieldValue;
  interestAndDividendIncome: FieldValue;
  stockCompensationExpense: FieldValue;
  otherAdjustments: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface ChangesInAssetsAndLiabilities {
  tradeReceivablesAndUnbilledRevenue: FieldValue;
  loansOtherFinancialAssetsAndOtherAssets: FieldValue;
  tradePayables: FieldValue;
  otherFinancialLiabilitiesOtherLiabilitiesAndProvisions: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface PaymentsToAcquireInvestments {
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface ProceedsOnSaleOfInvestments {
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface CashFlowData {
  fileGroup: string;
  sourceFiles: string[];
  netCashGeneratedByOperatingActivities: FieldValue;
  netCashUsedInInvestingActivities: FieldValue;
  netCashUsedInFinancingActivities: FieldValue;
  cashGeneratedFromOperations: FieldValue;
  profitForTheYear: FieldValue;
  incomeTaxesPaid: FieldValue;
  adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities: Adjustments;
  changesInAssetsAndLiabilities: ChangesInAssetsAndLiabilities;
  expenditureOnPropertyPlantAndEquipment: FieldValue;
  depositsPlacedWithCorporation: FieldValue;
  redemptionOfDepositsPlacedWithCorporation: FieldValue;
  interestAndDividendReceived: FieldValue;
  dividendReceivedFromSubsidiary: FieldValue;
  loanGivenToSubsidiaries: FieldValue;
  loanRepaidBySubsidiaries: FieldValue;
  investmentInSubsidiaries: FieldValue;
  paymentTowardsAcquisitionOfEntities: FieldValue;
  receiptPaymentTowardsBusinessTransferForEntitiesUnderCommonControl: FieldValue;
  receiptPaymentFromEntitiesUnderLiquidation: FieldValue;
  otherReceipts: FieldValue;
  paymentsToAcquireInvestments: PaymentsToAcquireInvestments;
  proceedsOnSaleOfInvestments: ProceedsOnSaleOfInvestments;
  paymentOfLeaseLiabilities: FieldValue;
  sharesIssuedOnExerciseOfEmployeeStockOptions: FieldValue;
  otherPayments: FieldValue;
  paymentOfDividends: FieldValue;
  netIncreaseDecreaseInCashAndCashEquivalents: FieldValue;
  effectOfExchangeDifferencesOnTranslationOfForeignCurrencyCashAndCashEquivalents: FieldValue;
  cashAndCashEquivalentsAtTheBeginningOfTheYear: FieldValue;
  cashAndCashEquivalentsAtTheEndOfTheYear: FieldValue;
  flexibleGroupItems: FlexibleGroupItem[];
}

export interface AnalysisData {
  _id?: string;
  customer_name?: string;
  lead_id?: string;
  balanceSheet: BalanceSheetData;
  profitLoss: ProfitLossData;
  cashFlow: CashFlowData;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  __v?: number;
}

export interface QCEntry {
  _id: string;
  customer_name?: string;
  lead_id?: string;
  documents: DocumentType[];
  status?: string;
}
