import React from 'react';
import { get } from 'lodash';
import type { AnalysisData, FieldValue, FlexibleGroupItem } from './types';

// RenderHeading component for section headers
interface RenderHeadingProps {
  label: string;
  indentLevel: number;
  isRedHeading?: boolean;
}

export const RenderHeading: React.FC<RenderHeadingProps> = ({ 
  label, 
  indentLevel, 
  isRedHeading = false 
}) => {
  return (
    <tr className={`${isRedHeading ? 'bg-red-50 border-l-4 border-red-300' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
      <td 
        colSpan={2} 
        className="py-3 text-sm font-semibold text-gray-900 border-b"
        style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
      >
        {label}
      </td>
    </tr>
  );
};

// RenderRow component for data rows
interface RenderRowProps {
  fieldPath: string;
  indentLevel: number;
  isBold?: boolean;
  analysisData: AnalysisData;
  selectedYear: string;
  updateFieldValue: (path: string, year: string, newValue: string) => void;
  getValueInputClass: (val: string | number | null | undefined, emphasize?: boolean) => string;
}

export const RenderRow: React.FC<RenderRowProps> = ({
  fieldPath,
  indentLevel,
  isBold = false,
  analysisData,
  selectedYear,
  updateFieldValue,
  getValueInputClass,
}) => {
  if (!analysisData) return null;

  const fieldObj = get(analysisData, fieldPath) as FieldValue;
  if (!fieldObj) return null;

  // Check if all year values are null/blank - if so, don't render this row
  const allYears = ['2023', '2024', '2025'];
  const hasAnyValue = allYears.some(year => {
    const value = fieldObj[`value_${year}` as keyof FieldValue];
    return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
  });

  if (!hasAnyValue) return null;

  const displayLabel = fieldObj.fieldName || fieldPath.split('.').pop() || '';
  const value = fieldObj[`value_${selectedYear}` as keyof FieldValue];

  return (
    <tr className="hover:bg-gray-50">
      <td
        className={`py-2 text-sm border-b text-left ${
          isBold ? "font-bold text-gray-900" : "text-gray-900"
        }`}
        style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
      >
        {displayLabel}
      </td>
      <td
        className={`px-4 py-2 text-sm border-b text-right min-w-[140px] ${
          isBold ? "bg-blue-50 border-t border-blue-200" : ""
        }`}
      >
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) =>
            updateFieldValue(fieldPath, selectedYear, e.target.value)
          }
          className={getValueInputClass(value, isBold)}
          placeholder="-"
        />
      </td>
    </tr>
  );
};

// RenderFlexibleGroup component for flexible group items
interface RenderFlexibleGroupProps {
  parentPath: string;
  indentLevel: number;
  analysisData: AnalysisData;
  selectedYear: string;
  updateFlexibleItem: (path: string, index: number, year: string, newValue: string) => void;
  getValueInputClass: (val: string | number | null | undefined, emphasize?: boolean) => string;
}

export const RenderFlexibleGroup: React.FC<RenderFlexibleGroupProps> = ({ 
  parentPath, 
  indentLevel,
  analysisData,
  selectedYear,
  updateFlexibleItem,
  getValueInputClass
}) => {
  if (!analysisData) return null;
  
  const items = get(analysisData, parentPath) as FlexibleGroupItem[];
  if (!items || items.length === 0) return null;
  
  // Filter out items where all year values are null/blank
  const validItems = items.filter(item => {
    const allYears = ['2023', '2024', '2025'];
    return allYears.some(year => {
      const value = item[`value_${year}` as keyof FlexibleGroupItem];
      return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
    });
  });

  if (validItems.length === 0) return null;
  
  return (
    <>
      {validItems.map((item, index) => {
        const value = item[`value_${selectedYear}` as keyof FlexibleGroupItem];
        return (
          <tr key={`${parentPath}-${index}`} className="hover:bg-gray-50">
            <td 
              className="py-2 text-sm border-b text-left text-gray-900"
              style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
            >
              {item.fieldName}
            </td>
            <td className="px-4 py-2 text-sm border-b text-right min-w-[140px]">
              <input
                type="text"
                value={value ?? ''}
                onChange={(e) => updateFlexibleItem(parentPath, index, selectedYear, e.target.value)}
                className={getValueInputClass(value, false)}
                placeholder="-"
              />
            </td>
          </tr>
        );
      })}
    </>
  );
};
