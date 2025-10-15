import React from "react";
import { get } from "lodash";
import type { AnalysisData, FlexibleGroupItem } from "./types";
import { formatValue, getValueColor } from "./utils";

interface RenderFlexibleGroupProps {
  parentPath: string;
  indentLevel: number;
  analysisData: AnalysisData;
  selectedYear?: string;
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

const RenderFlexibleGroup: React.FC<RenderFlexibleGroupProps> = ({
  parentPath,
  indentLevel,
  analysisData,
  selectedYear,
  updateFlexibleItem,
  getValueInputClass,
  isMultiYear = false,
  isReadOnly = false,
}) => {
  if (!analysisData) return null;

  const items = get(analysisData, parentPath) as FlexibleGroupItem[];
  if (!items || items.length === 0) return null;

  // Filter out items where all year values are null or fieldName is "Not Found"
  const filteredItems = items.filter((item) => {
    const allValuesNull =
      item.value_2023 === null &&
      item.value_2024 === null &&
      item.value_2025 === null;
    const isNotFound = item.fieldName === "Not Found";
    return !allValuesNull && !isNotFound;
  });

  if (filteredItems.length === 0) return null;

  return (
    <>
      {filteredItems.map((item, index) => {
        const value2023 = item.value_2023;
        const value2024 = item.value_2024;
        const value2025 = item.value_2025;
        const singleValue = selectedYear
          ? item[`value_${selectedYear}` as keyof FlexibleGroupItem]
          : null;

        // Helper function to render value cell
        const renderValueCell = (value: string) => {
          const cellClass =
            "px-4 py-2 text-sm border-b border-gray-200 text-right min-w-[140px]";

          if (isReadOnly) {
            return (
              <td className={cellClass} style={{ color: getValueColor(value) }}>
                {formatValue(value)}
              </td>
            );
          } else {
            return (
              <td className={cellClass}>
                <input
                  type="text"
                  value={value ?? ""}
                  onChange={(e) =>
                    updateFlexibleItem?.(
                      parentPath,
                      index,
                      selectedYear || "",
                      e.target.value
                    )
                  }
                  className={getValueInputClass?.(value, false) || ""}
                  placeholder="-"
                />
              </td>
            );
          }
        };

        return (
          <tr key={`${parentPath}-${index}`} className="hover:bg-gray-50">
            <td
              className="py-2 text-sm border-b border-gray-200 text-left text-gray-900"
              style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
            >
              {item.fieldName}
            </td>
            {isMultiYear ? (
              <>
                {renderValueCell(value2023 as string)}
                {renderValueCell(value2024 as string)}
                {renderValueCell(value2025 as string)}
              </>
            ) : (
              renderValueCell(singleValue as string)
            )}
          </tr>
        );
      })}
    </>
  );
};

export default RenderFlexibleGroup;
