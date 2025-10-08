import React from "react";
import RenderHeading from "./RenderHeading";
import RenderRow from "./RenderRow";
import RenderFlexibleGroup from "./RenderFlexibleGroup";
import type { AnalysisData } from "./types";

interface RenderBalanceSheetProps {
  analysisData: AnalysisData;
  selectedYear?: string;
  updateFieldValue?: (path: string, year: string, newValue: string) => void;
  updateFlexibleItem?: (
    path: string,
    index: number,
    year: string,
    newValue: string
  ) => void;
  getValueInputClass?: (
    val: string | number | null | undefined,
    emphasize?: boolean
  ) => string;
  isMultiYear?: boolean;
  isReadOnly?: boolean;
}

const renderBalanceSheet: React.FC<RenderBalanceSheetProps> = ({
  analysisData,
  selectedYear,
  updateFieldValue,
  updateFlexibleItem,
  getValueInputClass,
  isMultiYear = false,
  isReadOnly = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">
          Balance Sheet Summary{" "}
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
              {isMultiYear ? (
                <>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                    2023
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                    2024
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                    2025
                  </th>
                </>
              ) : (
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  {selectedYear}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* ASSETS */}
            <RenderHeading
              label="ASSETS"
              indentLevel={0}
              isRedHeading={true}
              isMultiYear={isMultiYear}
            />
            {/* Non-current Assets */}
            <RenderHeading
              label="Non-current Assets"
              indentLevel={1}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.propertyPlantAndEquipment"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.rightOfUseAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.capitalWorkInProgress"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.goodwill"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.financialAssetsInvestments"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.financialAssetsLoans"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.otherFinancialAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.deferredTaxAssetsNet"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.incomeTaxAssetsNet"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.otherNonCurrentAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.intangibleAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.nonCurrentAssets.total"
              indentLevel={2}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderFlexibleGroup
              parentPath="balanceSheet.nonCurrentAssets.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            {/* Current Assets */}
            <RenderHeading
              label="Current Assets"
              indentLevel={1}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.financialAssetsInvestments"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.tradeReceivables"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.cashAndCashEquivalents"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.financialAssetsLoans"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.otherFinancialAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.incomeTaxAssetsNet"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.otherCurrentAssets"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.currentAssets.total"
              indentLevel={2}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderFlexibleGroup
              parentPath="balanceSheet.currentAssets.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.totalAssets"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            {/* EQUITY AND LIABILITIES */}
            <RenderHeading
              label="EQUITY AND LIABILITIES"
              indentLevel={0}
              isRedHeading={true}
              isMultiYear={isMultiYear}
            />
            {/* Equity */}
            <RenderHeading
              label="Equity"
              indentLevel={1}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.equityShareCapital"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.otherEquity"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.totalEquity"
              indentLevel={2}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderFlexibleGroup
              parentPath="balanceSheet.equityAndLiabilities.flexibleGroupItems"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            {/* Liabilities */}
            <RenderHeading
              label="Liabilities"
              indentLevel={1}
              isMultiYear={isMultiYear}
            />
            {/* Non-current Liabilities */}
            <RenderHeading
              label="Non-current Liabilities"
              indentLevel={2}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.financialLiabilitiesBorrowings"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.financialLiabilitiesLease"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.otherFinancialLiabilities"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.deferredTaxLiabilitiesNet"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.otherNonCurrentLiabilities"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.total"
              indentLevel={3}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderFlexibleGroup
              parentPath="balanceSheet.equityAndLiabilities.nonCurrentLiabilities.flexibleGroupItems"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            {/* Current Liabilities */}
            <RenderHeading
              label="Current Liabilities"
              indentLevel={2}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.financialLiabilitiesBorrowings"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.financialLiabilitiesLease"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesMicroAndSmall"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.tradePayablesOtherCreditors"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.otherFinancialLiabilities"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.otherCurrentLiabilities"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.provisionsCurrent"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.incomeTaxLiabilitiesNet"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.equityAndLiabilities.currentLiabilities.total"
              indentLevel={3}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderFlexibleGroup
              parentPath="balanceSheet.equityAndLiabilities.currentLiabilities.flexibleGroupItems"
              indentLevel={3}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="balanceSheet.totalEquityAndLiabilities"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderFlexibleGroup
              parentPath="balanceSheet.flexibleGroupItems"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFlexibleItem={updateFlexibleItem}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default renderBalanceSheet;
