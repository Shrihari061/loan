import React from 'react';
import RenderBalanceSheet from './QCViewer/renderBalanceSheet';
import RenderProfitLoss from './QCViewer/renderProfitLoss';
import RenderCashFlow from './QCViewer/renderCashFlow';
import type { AnalysisData } from './QCViewer/types';
import { getValueInputClass as defaultGetValueInputClass } from './QCViewer/utils';

interface FinancialStatementViewerProps {
  analysisData: AnalysisData;
  selectedDocument: 'balance_sheet' | 'profit_loss' | 'cash_flow';
  isMultiYear?: boolean;
  isReadOnly?: boolean;
  selectedYear?: string;
  updateFieldValue?: (path: string, year: string, value: string) => void;
  updateFlexibleItem?: (path: string, index: number, year: string, value: string) => void;
  getValueInputClass?: (val: string | number | null | undefined, emphasize?: boolean) => string;
}

const FinancialStatementViewer: React.FC<FinancialStatementViewerProps> = ({
  analysisData,
  selectedDocument,
  isMultiYear = false,
  isReadOnly = false,
  selectedYear,
  updateFieldValue,
  updateFlexibleItem,
  getValueInputClass = defaultGetValueInputClass,
}) => {
  // Common props to pass to all render components
  const commonProps = {
    analysisData,
    selectedYear: selectedYear || '2025',
    updateFieldValue: updateFieldValue || (() => {}),
    updateFlexibleItem: updateFlexibleItem || (() => {}),
    getValueInputClass,
    isMultiYear,
    isReadOnly,
  };

  // Switch based on selected document
  switch (selectedDocument) {
    case 'balance_sheet':
      return <RenderBalanceSheet {...commonProps} />;
    case 'profit_loss':
      return <RenderProfitLoss {...commonProps} />;
    case 'cash_flow':
      return <RenderCashFlow {...commonProps} />;
    default:
      return <div>Please select a financial statement to view.</div>;
  }
};

export default FinancialStatementViewer;

