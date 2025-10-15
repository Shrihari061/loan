import React from "react";

interface RenderHeadingProps {
  label: string;
  indentLevel: number;
  isRedHeading?: boolean;
  isMultiYear?: boolean;
}

const RenderHeading: React.FC<RenderHeadingProps> = ({
  label,
  indentLevel,
  isRedHeading = false,
  isMultiYear = false,
}) => {
  return (
    <tr
      className={`${
        isRedHeading
          ? "bg-red-50 border-l-4 border-red-300"
          : "bg-blue-50 border-l-4 border-gray-300"
      }`}
    >
      <td
        colSpan={isMultiYear ? 4 : 2}
        className="py-3 text-sm font-semibold text-gray-900 border-b border-gray-200"
        style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
      >
        {label}
      </td>
    </tr>
  );
};

export default RenderHeading;
