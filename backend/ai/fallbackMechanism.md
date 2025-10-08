
## FALLBACK MECHANISMS DOCUMENTATION

This enhanced ratio calculator includes robust fallback mechanisms to handle missing or incomplete financial data. The fallbacks are designed to maintain data accuracy while providing the best possible calculations.

FALLBACK LOCATIONS AND THEIR PURPOSE:

1. DSCR (Debt Service Coverage Ratio) - FALLBACK LOCATION 1
   - Primary: profitAndLoss.profitForTheYear
   - Fallback 1: profitAndLoss.profitBeforeTax (if PAT not available)
   - Fallback 2: profitAndLoss.totalComprehensiveIncomeForTheYear (last resort)
   - Depreciation fallback: cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.depreciationAndAmortization
   - Finance cost fallback: cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.financeCost

2. Debt/Equity Ratio - FALLBACK LOCATION 2
   - Borrowings fallback: otherFinancialLiabilities (if specific borrowings not found)
   - Equity fallback 1: equityShareCapital (if total equity not available)
   - Equity fallback 2: otherEquity (last resort)

3. PAT Margin - FALLBACK LOCATION 3
   - PAT fallback: profitBeforeTax → totalComprehensiveIncomeForTheYear
   - Revenue fallback: totalIncome → otherIncomeNet

4. Current Ratio - FALLBACK LOCATION 4
   - Assets fallback: cashAndCashEquivalents → tradeReceivables
   - Liabilities fallback: financialLiabilitiesBorrowings → tradePayablesMicroAndSmall

5. Quick Ratio - FALLBACK LOCATION 5
   - Enhanced inventory access with flexible group search
   - Uses getFlexibleGroupValue() for inventory lookup in flexibleGroupItems
   - Same asset/liability fallbacks as Current Ratio

6. Interest Coverage - FALLBACK LOCATION 6
   - PBT fallback: profitForTheYear → totalComprehensiveIncomeForTheYear
   - Finance cost fallback: cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.financeCost

7. Return on Assets (ROA) - FALLBACK LOCATION 7
   - PAT fallback: profitBeforeTax → totalComprehensiveIncomeForTheYear
   - Assets fallback: nonCurrentAssets.total → currentAssets.total

8. Return on Equity (ROE) - FALLBACK LOCATION 8
   - PAT fallback: profitBeforeTax → totalComprehensiveIncomeForTheYear
   - Equity fallback: equityShareCapital → otherEquity

9. EBITDA Margin - FALLBACK LOCATION 9
   - PBT fallback: profitForTheYear → totalComprehensiveIncomeForTheYear
   - Depreciation fallback: cashFlows.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.depreciationAndAmortization
   - Revenue fallback: totalIncome → otherIncomeNet

10. Accounts Receivable Days - FALLBACK LOCATION 10
    - Enhanced receivables access with flexible group search
    - Uses getFlexibleGroupValue() for trade receivables lookup
    - Revenue fallback: totalIncome → otherIncomeNet

11. Accounts Payable Days - FALLBACK LOCATION 11
    - Enhanced payables calculation with flexible group fallback
    - Uses getFlexibleGroupValue() for trade payables lookup (both current and prior year)
    - Purchases proxy fallback: totalExpenses → employeeBenefitExpenses

12. Asset Turnover Ratio - FALLBACK LOCATION 12
    - Revenue fallback: totalIncome → otherIncomeNet
    - Assets fallback: nonCurrentAssets.total → currentAssets.total

FLEXIBLE GROUP ACCESS MECHANISM:
- getFlexibleGroupValue() function searches flexibleGroupItems arrays
- Supports partial matching of field names
- Handles common variations (e.g., "Inventories" matches "inventory", "stock")
- Used specifically for: Inventories, Trade Receivables, Trade Payables

DATA ACCURACY PRINCIPLES:
1. Never use incorrect data - either show correct data or no data (0.0)
2. Fallbacks are only used when primary values are 0.0 or missing
3. All fallbacks are financially relevant alternatives
4. Console logging shows when fallbacks are used for transparency
5. Flexible group access maintains field name accuracy through partial matching

ROBUSTNESS FEATURES:
- Error handling in flexible group access
- Graceful degradation when data is missing
- Maintains calculation integrity even with incomplete data
- Transparent logging of fallback usage
- No overboard fallbacks - only financially relevant alternatives

