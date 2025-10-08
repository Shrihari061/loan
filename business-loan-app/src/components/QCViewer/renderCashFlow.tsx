import React from 'react';
import RenderHeading from './RenderHeading';
import RenderRow from './RenderRow';
import RenderFlexibleGroup from './RenderFlexibleGroup';
import type { AnalysisData } from './types';

interface RenderCashFlowProps {
  analysisData: AnalysisData;
  selectedYear: string;
  updateFieldValue: (path: string, year: string, newValue: string) => void;
  updateFlexibleItem: (path: string, index: number, year: string, newValue: string) => void;
  getValueInputClass: (val: string | number | null | undefined, emphasize?: boolean) => string;
}

const renderCashFlow: React.FC<RenderCashFlowProps> = ({
  analysisData,
  selectedYear,
  updateFieldValue,
  updateFlexibleItem,
  getValueInputClass
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">
          Statement of Cash Flows{" "}
          <span className="text-sm font-normal text-gray-500">
            (all amounts in Crores of Rs.)
          </span>
        </h3>
      </div>
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Item
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                {selectedYear}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* CASH FLOW FROM OPERATING ACTIVITIES */}
            <RenderHeading label="CASH FLOW FROM OPERATING ACTIVITIES" indentLevel={0} isRedHeading={true} />
            <RenderRow
              fieldPath="cashFlow.profitForTheYear"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />

            {/* Adjustments */}
            <RenderHeading label="Adjustments to reconcile net profit to net cash" indentLevel={1} />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.depreciationAndAmortization"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.incomeTaxExpense"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.impairmentLossRecognizedReversed"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.financeCost"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.interestAndDividendIncome"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.stockCompensationExpense"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.otherAdjustments"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderFlexibleGroup
              parentPath="cashFlow.adjustmentsToReconcileNetProfitToNetCashProvidedByOperatingActivities.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
            />

            {/* Changes in assets and liabilities */}
            <RenderHeading label="Changes in assets and liabilities" indentLevel={1} />
            <RenderRow
              fieldPath="cashFlow.changesInAssetsAndLiabilities.tradeReceivablesAndUnbilledRevenue"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.changesInAssetsAndLiabilities.loansOtherFinancialAssetsAndOtherAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.changesInAssetsAndLiabilities.tradePayables"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.changesInAssetsAndLiabilities.otherFinancialLiabilitiesOtherLiabilitiesAndProvisions"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderFlexibleGroup
              parentPath="cashFlow.changesInAssetsAndLiabilities.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
            />

            <RenderRow
              fieldPath="cashFlow.cashGeneratedFromOperations"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.incomeTaxesPaid"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.netCashGeneratedByOperatingActivities"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />

            {/* CASH FLOW FROM INVESTING ACTIVITIES */}
            <RenderHeading label="CASH FLOW FROM INVESTING ACTIVITIES" indentLevel={0} isRedHeading={true} />
            <RenderRow
              fieldPath="cashFlow.expenditureOnPropertyPlantAndEquipment"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.depositsPlacedWithCorporation"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.redemptionOfDepositsPlacedWithCorporation"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.interestAndDividendReceived"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.dividendReceivedFromSubsidiary"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.loanGivenToSubsidiaries"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.loanRepaidBySubsidiaries"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.investmentInSubsidiaries"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.paymentTowardsAcquisitionOfEntities"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.receiptPaymentTowardsBusinessTransferForEntitiesUnderCommonControl"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.receiptPaymentFromEntitiesUnderLiquidation"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.otherReceipts"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />

            {/* Payments to acquire investments */}
            <RenderHeading label="Payments to acquire investments" indentLevel={1} />
            <RenderFlexibleGroup
              parentPath="cashFlow.paymentsToAcquireInvestments.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
            />

            {/* Proceeds on sale of investments */}
            <RenderHeading label="Proceeds on sale of investments" indentLevel={1} />
            <RenderFlexibleGroup
              parentPath="cashFlow.proceedsOnSaleOfInvestments.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
            />

            <RenderRow
              fieldPath="cashFlow.netCashUsedInInvestingActivities"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />

            {/* CASH FLOW FROM FINANCING ACTIVITIES */}
            <RenderHeading label="CASH FLOW FROM FINANCING ACTIVITIES" indentLevel={0} isRedHeading={true} />
            <RenderRow
              fieldPath="cashFlow.paymentOfLeaseLiabilities"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.sharesIssuedOnExerciseOfEmployeeStockOptions"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.otherPayments"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.paymentOfDividends"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.netCashUsedInFinancingActivities"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />

            {/* NET CHANGE IN CASH */}
            <RenderHeading label="NET CHANGE IN CASH" indentLevel={0} isRedHeading={true} />
            <RenderRow
              fieldPath="cashFlow.netIncreaseDecreaseInCashAndCashEquivalents"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.effectOfExchangeDifferencesOnTranslationOfForeignCurrencyCashAndCashEquivalents"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.cashAndCashEquivalentsAtTheBeginningOfTheYear"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />
            <RenderRow
              fieldPath="cashFlow.cashAndCashEquivalentsAtTheEndOfTheYear"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
            />

            <RenderFlexibleGroup
              parentPath="cashFlow.flexibleGroupItems"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default renderCashFlow;
