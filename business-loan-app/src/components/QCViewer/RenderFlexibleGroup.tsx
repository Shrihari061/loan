import React from 'react';
import { get } from 'lodash';
import type { AnalysisData, FlexibleGroupItem } from './types';

interface RenderFlexibleGroupProps {
  parentPath: string;
  indentLevel: number;
  analysisData: AnalysisData;
  selectedYear: string;
  updateFlexibleItem: (path: string, index: number, year: string, newValue: string) => void;
  getValueInputClass: (val: string | number | null | undefined, emphasize?: boolean) => string;
}

const RenderFlexibleGroup: React.FC<RenderFlexibleGroupProps> = ({ 
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
  
  // Filter out items where all year values are null or fieldName is "Not Found"
  const filteredItems = items.filter(item => {
    const allValuesNull = item.value_2023 === null && 
                          item.value_2024 === null && 
                          item.value_2025 === null;
    const isNotFound = item.fieldName === "Not Found";
    return !allValuesNull && !isNotFound;
  });

  if (filteredItems.length === 0) return null;
  
  return (
    <>
      {filteredItems.map((item, index) => {
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

export default RenderFlexibleGroup;
