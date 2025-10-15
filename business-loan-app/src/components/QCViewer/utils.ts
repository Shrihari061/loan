// Shared utility functions for QC Viewer and Company Details

/**
 * Formats a value for display with locale-specific number formatting
 */
export const formatValue = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  if (typeof value === 'string') {
    // If it's already a string, return as-is (might be formatted already)
    if (value.trim() === '') return '-';
    return value;
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);
  
  return numValue.toLocaleString('en-IN');
};

/**
 * Checks if a value is negative
 */
export const isNegativeValue = (val: string | number | null | undefined): boolean => {
  if (val === null || val === undefined || val === '') return false;
  
  const s = String(val).trim();
  if (!s) return false;
  
  // Check for parentheses notation (accounting format for negatives)
  if (/^\(.*\)$/.test(s)) return true;
  
  const n = Number(s.replace(/[, ]/g, ''));
  return !isNaN(n) && n < 0;
};

/**
 * Checks if a value is positive
 */
export const isPositiveValue = (val: string | number | null | undefined): boolean => {
  if (val === null || val === undefined || val === '') return false;
  
  const s = String(val).trim();
  if (!s) return false;
  
  // Check for parentheses notation (accounting format for negatives)
  if (/^\(.*\)$/.test(s)) return false;
  
  const n = Number(s.replace(/[, ]/g, ''));
  return !isNaN(n) && n > 0;
};

/**
 * Returns the appropriate color for a value based on whether it's positive or negative
 */
export const getValueColor = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '#111827';
  
  if (typeof value === 'string') {
    // Check for parentheses notation (accounting format for negatives)
    if (value.startsWith('(') && value.endsWith(')')) {
      return '#ef4444'; // red for negative
    }
    
    const numValue = Number(value.replace(/[, ]/g, ''));
    if (!isNaN(numValue)) {
      return numValue < 0 ? '#ef4444' : '#111827';
    }
    return '#111827';
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) return '#111827';
  return numValue < 0 ? '#ef4444' : '#111827';
};

/**
 * Returns CSS class for value inputs with color coding
 */
export const getValueInputClass = (
  val: string | number | null | undefined,
  emphasize = false
): string => {
  const negative = isNegativeValue(val);
  const positive = isPositiveValue(val);
  
  return `w-full text-right bg-transparent px-1 py-1 rounded transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-transparent hover:bg-gray-50 ${
    negative ? 'text-red-600' : positive ? 'text-green-600' : 'text-gray-900'
  } ${emphasize ? 'font-semibold' : ''}`;
};

/**
 * Formats any number for frontend display
 * Always shows negative numbers in parentheses
 */
export const formatValueForFrontend = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined || value === '') return '-';

  let numValue: number;

  const strVal = String(value).trim();

  // If it's in parentheses like "(123)" → parse as negative number
  if (/^\(.*\)$/.test(strVal)) {
    numValue = Number(strVal.replace(/[(), ]/g, '')) * -1;
  } else {
    numValue = Number(strVal.replace(/[, ]/g, ''));
  }

  if (isNaN(numValue)) return strVal;

  // Always display negative numbers in parentheses
  if (numValue < 0) {
    return `(${Math.abs(numValue).toLocaleString('en-IN')})`;
  }

  return numValue.toLocaleString('en-IN'); // positive number
};

/**
 * Converts edited frontend value to backend value
 * Preserves original format (minus sign or parentheses)
 */
export const normalizeValueForBackend = (
  originalBackendValue: string | number | null | undefined,
  editedFrontendValue: string
): string => {
  if (!editedFrontendValue) return '';

  const editedNum = Number(editedFrontendValue.replace(/[(), ]/g, ''));
  if (isNaN(editedNum)) return editedFrontendValue;

  const originalStr = String(originalBackendValue ?? '').trim();

  // Determine original backend style
  const usesParentheses = /^\(.*\)$/.test(originalStr);

  // Update numeric value, preserve original sign/format
  if (usesParentheses) {
    return `(${Math.abs(editedNum).toLocaleString('en-IN')})`; // parentheses format
  } else if (typeof originalBackendValue === 'number' && originalBackendValue < 0) {
    return String(-Math.abs(editedNum)); // negative sign
  } else {
    return String(editedNum); // positive
  }
};
