import React from "react";
import { get } from "lodash";
import type { AnalysisData, FieldValue } from "./types";

interface RenderRowProps {
  fieldPath: string;
  indentLevel: number;
  isBold?: boolean;
  analysisData: AnalysisData;
  selectedYear: string;
  updateFieldValue: (path: string, year: string, newValue: string) => void;
  getValueInputClass: (
    val: string | number | null | undefined,
    emphasize?: boolean
  ) => string;
}

const RenderRow: React.FC<RenderRowProps> = ({
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

  const displayLabel = fieldObj.fieldName || fieldPath.split(".").pop() || "";
  
  // Check if all year values are null
  const allValuesNull = fieldObj.value_2023 === null && 
                       fieldObj.value_2024 === null && 
                       fieldObj.value_2025 === null;

  // Check if fieldName is "Not Found"
  const isNotFound = displayLabel === "Not Found";

  // Don't render if all values are null or if it's a "Not Found" field
  if (allValuesNull || isNotFound) return null;

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

export default RenderRow;
