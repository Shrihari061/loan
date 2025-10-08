import React from "react";
import RenderHeading from "./RenderHeading";
import RenderRow from "./RenderRow";
import RenderFlexibleGroup from "./RenderFlexibleGroup";
import type { AnalysisData } from "./types";

interface RenderProfitLossProps {
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

const renderProfitLoss: React.FC<RenderProfitLossProps> = ({
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
          Profit & Loss Summary{" "}
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
                    FY2023
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                    FY2024
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                    FY2025
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
            {/* INCOME */}
            <RenderHeading
              label="INCOME"
              indentLevel={0}
              isRedHeading={true}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="profitLoss.revenueFromOperations"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.otherIncomeNet"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.totalIncome"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />

            {/* EXPENSES */}
            <RenderHeading
              label="EXPENSES"
              indentLevel={0}
              isRedHeading={true}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="profitLoss.coreOperatingCosts"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.employeeBenefitExpenses"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.depreciationAndAmortizationExpenses"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.financeCost"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.costOfTechnicalSubContractors"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.travelExpenses"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.communicationExpenses"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.consultancyAndProfessionalCharges"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.otherExpensesAggregated"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.exceptionalItemsNet"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.totalExpenses"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />

            {/* PROFIT AND TAX */}
            <RenderHeading
              label="PROFIT AND TAX"
              indentLevel={0}
              isRedHeading={true}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="profitLoss.profitBeforeTax"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />

            {/* Tax Expense */}
            <RenderHeading
              label="Tax Expense"
              indentLevel={1}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="profitLoss.currentTax"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.deferredTax"
              indentLevel={2}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />

            <RenderRow
              fieldPath="profitLoss.profitForTheYear"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.totalComprehensiveIncomeForTheYear"
              indentLevel={1}
              isBold={true}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />

            {/* EARNINGS PER SHARE */}
            <RenderHeading
              label="EARNINGS PER SHARE"
              indentLevel={0}
              isRedHeading={true}
              isMultiYear={isMultiYear}
            />
            <RenderRow
              fieldPath="profitLoss.earningsPerShare.basic"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />
            <RenderRow
              fieldPath="profitLoss.earningsPerShare.diluted"
              indentLevel={1}
              analysisData={analysisData}
              selectedYear={selectedYear}
              updateFieldValue={updateFieldValue}
              getValueInputClass={getValueInputClass}
              isMultiYear={isMultiYear}
              isReadOnly={isReadOnly}
            />

            <RenderFlexibleGroup
              parentPath="profitLoss.flexibleGroupItems"
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

export default renderProfitLoss;
