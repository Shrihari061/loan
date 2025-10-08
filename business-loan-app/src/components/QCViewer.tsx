// QCViewer.tsx (full updated file with shadcn Dialog integration and Save button removed)
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

type ExtractedData = Record<string, string>;

type DocumentEntry = {
  _id?: string;
  filename: string;
  upload_date?: string;
  status?: string;
  notes?: string;
  extracted_data?: ExtractedData;
};

type FinancialItem = {
  _id: string;
  item: string;
  [key: string]: string | number | null;
};

// (Removed unused AnalysisEntry type)

type FinancialData = {
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
};

type QCEntry = {
  _id: string;
  customer_name?: string;
  lead_id?: string;
  documents: DocumentEntry[];
  status?: string;
};

const QCViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<QCEntry | null>(null);
  // (Removed unused textValue state)
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [originalFinancialData, setOriginalFinancialData] = useState<FinancialData | null>(null);
  const [isFinancialDataEdited, setIsFinancialDataEdited] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const [openYear, setOpenYear] = useState(false);

  // Confirmation dialog state (for unsaved changes)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const collections = ['Balance Sheet Summary', 'Profit & Loss Summary', 'Cash Flow Summary'];
  const years = ['2023', '2024', '2025'];

  const financialDataDependencies = useMemo(
    () => [selectedCollection, id, data, selectedYear],
    [selectedCollection, id, data, selectedYear]
  );

  // UI helpers: value coloring and input look
  const isNegativeValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return false;
    const s = String(val).trim();
    if (!s) return false;
    if (/^\(.*\)$/.test(s)) return true;
    const n = Number(s.replace(/[, ]/g, ''));
    return !isNaN(n) && n < 0;
  };

  const isPositiveValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return false;
    const s = String(val).trim();
    if (!s) return false;
    if (/^\(.*\)$/.test(s)) return false;
    const n = Number(s.replace(/[, ]/g, ''));
    return !isNaN(n) && n > 0;
  };

  const getValueInputClass = (val: string | number | null | undefined, emphasize = false) => {
    const negative = isNegativeValue(val);
    const positive = isPositiveValue(val);
    return `w-full text-right bg-transparent px-1 py-1 rounded transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-transparent hover:bg-gray-50 ${negative ? 'text-red-600' : positive ? 'text-green-600' : 'text-gray-900'} ${emphasize ? 'font-semibold' : ''
      }`;
  };

  // Simple toast/snackbar
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 1800);
  };

  // (Removed unused text conversion helpers)

  // 🔹 Fetch Lead entry
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/leads/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((lead: any) => {
        const qcEntry: QCEntry = {
          _id: lead._id,
          customer_name: lead.business_name,
          lead_id: lead.lead_id,
          status: lead.status || 'In Progress',
          documents: lead.financialDocuments
            ? lead.financialDocuments.map((doc: any) => ({
              _id: doc._id || Math.random().toString(),
              filename: doc.fileName,
              upload_date: lead.created_date,
              status: 'Pending',
              notes: '',
              extracted_data: {}
            }))
            : []
        };
        setData(qcEntry);
        // no-op: removed debug text state
      })
      .catch((err) => {
        console.error('Failed to load customer data:', err);
        setData(null);
      });
  }, [id]);

  // 🔹 Fetch selected collection (and capture original snapshot)
  useEffect(() => {
    if (!selectedCollection || !id || !data || !selectedYear) return;

    // First, get all analysis entries to find the matching one
    fetch(`http://localhost:5000/analysis/`)
      .then((res) => res.json())
      .then((allEntries: any[]) => {
        // Try to match by lead_id first, else companyName
        const matchingEntry = Array.isArray(allEntries)
          ? (allEntries.find((d: any) => d.lead_id === data.lead_id) ||
            allEntries.find((d: any) => d.companyName === data.customer_name))
          : null;

        if (!matchingEntry) return;

        // Now fetch the specific entry using its ID (raw doc)
        return fetch(`http://localhost:5000/analysis/${matchingEntry._id}`);
      })
      .then((res) => res?.json())
      .then((doc: any) => {
        if (!doc) return;

        // Build arrays from new nested structure
        const buildItems = (section: any): FinancialItem[] => {
          const out: FinancialItem[] = [];
          if (!section || typeof section !== 'object') return out;
          const pushIfValueObj = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            const hasYear = ('value_2023' in obj) || ('value_2024' in obj) || ('value_2025' in obj);
            const label = obj.fieldName || obj.item || null;
            if (hasYear && label) {
              out.push({
                _id: `gen-${label}-${Math.random().toString(36).slice(2, 7)}`,
                item: label,
                FY2023: obj.value_2023 ?? null,
                FY2024: obj.value_2024 ?? null,
                FY2025: obj.value_2025 ?? null
              } as any);
            }
          };
          const visit = (node: any) => {
            if (!node || typeof node !== 'object') return;
            pushIfValueObj(node);
            if (Array.isArray(node.flexibleGroupItems)) {
              for (const it of node.flexibleGroupItems) pushIfValueObj(it);
            }
            for (const [k, v] of Object.entries(node)) {
              if (k === 'flexibleGroupItems') continue;
              if (v && typeof v === 'object') visit(v);
            }
          };
          visit(section);
          return out;
        };

        const dataWithFY: FinancialData = {
          balance_sheet: buildItems(doc.balanceSheet),
          profit_loss: buildItems(doc.profitAndLoss),
          cash_flow: buildItems(doc.cashFlows)
        } as any;

        setFinancialData(dataWithFY);
        try {
          setOriginalFinancialData(JSON.parse(JSON.stringify(dataWithFY)));
          setIsFinancialDataEdited(false);
        } catch (err) {
          setOriginalFinancialData(dataWithFY);
          setIsFinancialDataEdited(false);
        }

        // Update complete, table renders from state
      })
      .catch((err) => {
        console.error('Failed to load financial data:', err);
        // (Removed debug text state)
      });
  }, financialDataDependencies);

  // ---------------------------
  // Helper: flexible finder for balance-sheet labels
  // ---------------------------
  const normalize = (s: string) =>
    s
      .toString()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
      .replace(/[^\w\s]/g, '') // remove punctuation
      .trim();

  const findRowFlexible = (items: FinancialItem[], candidates: string | string[]): FinancialItem | null => {
    if (!items || items.length === 0) return null;
    const list = Array.isArray(candidates) ? candidates : [candidates];

    // exact first
    for (const c of list) {
      const exact = items.find((d) => d.item === c);
      if (exact) return exact;
    }

    // normalized matches
    const normalizedData = items.map(d => ({ d, n: normalize(d.item) }));
    for (const c of list) {
      const n = normalize(c);
      // exact normalized
      const exactNorm = normalizedData.find(x => x.n === n);
      if (exactNorm) return exactNorm.d;
      // contains
      const contains = normalizedData.find(x => x.n.includes(n));
      if (contains) return contains.d;
      // tokens match: all tokens in candidate exist in item
      const tokens = n.split(' ').filter(Boolean);
      const tokenMatch = normalizedData.find(x => tokens.every(t => x.n.includes(t)));
      if (tokenMatch) return tokenMatch.d;
    }

    return null;
  };

  // ---------------------------
  // Dynamic table renderer for all document types (Updated to delegate to specific renderers)
  // ---------------------------
  const renderDynamicTable = () => {
    if (!financialData) return null;

    if (selectedCollection === 'Balance Sheet Summary') {
      return renderBSTable(financialData.balance_sheet);
    } else if (selectedCollection === 'Profit & Loss Summary') {
      return renderPLTable(financialData.profit_loss);
    } else if (selectedCollection === 'Cash Flow Summary') {
      return renderCFTable(financialData.cash_flow);
    }

    // Fallback if no collection selected or data is empty
    const selectedData =
      selectedCollection === 'Balance Sheet Summary'
        ? financialData.balance_sheet
        : selectedCollection === 'Profit & Loss Summary'
          ? financialData.profit_loss
          : financialData.cash_flow;

    if (!selectedData || selectedData.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            No data found for {selectedCollection}
          </div>
        </div>
      );
    }

    return null; // Should be handled by the specific renderers above
  };

  // ---------------------------
  // Balance Sheet renderer (single year) with robust matching and editable placeholders (UPDATED)
  // ---------------------------
  const renderBSTable = (bsData: FinancialItem[]) => {
    const year = selectedYear;
    const items = bsData || [];

    const renderRow = (
      label: string,
      opts?: { bold?: boolean; candidates?: string[], indent?: boolean }
    ) => {
      const { bold = false, candidates, indent = false } = opts || {};
      const row = findRowFlexible(items, candidates ?? label);
      const displayLabel = label;
      const value = row ? (row[`FY${year}`] ?? '') : '';

      return (
        <tr key={displayLabel} className="hover:bg-gray-50">
          <td
            className={`px-4 py-2 text-sm border-b text-left ${bold ? 'font-bold text-gray-900' : 'text-gray-900'} ${indent ? 'pl-8' : ''}`
            }
          >
            {displayLabel}
          </td>
          <td className={`px-4 py-2 text-sm border-b text-right min-w-[140px] ${bold ? 'bg-blue-50 border-t border-blue-200' : ''}`}>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const newVal = e.target.value;
                if (!financialData) return;
                const newFD = { ...financialData };

                const targetArr = [...(newFD.balance_sheet || [])];
                const foundIndex = targetArr.findIndex(
                  (t) => normalize(t.item) === normalize(row?.item ?? displayLabel)
                );

                if (foundIndex !== -1) {
                  targetArr[foundIndex] = {
                    ...targetArr[foundIndex],
                    [`FY${year}`]: newVal,
                  };
                } else {
                  const newEntry: FinancialItem = {
                    _id: `generated-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2, 7)}`,
                    item: row?.item ?? displayLabel,
                    [`FY${year}`]: newVal,
                  };
                  targetArr.push(newEntry);
                }

                newFD.balance_sheet = targetArr;
                setFinancialData(newFD);
                setIsFinancialDataEdited(true);
              }}
              className={getValueInputClass(value, !!bold)}
              placeholder="-"
            />
          </td>
        </tr>
      );
    };

    // heading renderer (used for major sections like 'I. ASSETS' and 'Fixed Core Fields')
    const renderHeading = (label: string, major = false, keySuffix?: string) => (
      <tr key={`h-${label}-${keySuffix ?? ''}`} className={`${major ? 'bg-gray-100 border-t-2 border-b-2 border-gray-300' : 'bg-gray-50'}`}>
        <td colSpan={2} className={`px-4 py-3 text-sm ${major ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
          {label}
        </td>
      </tr>
    );

    // --- FLEXIBLE ITEM SEGREGATION LOGIC ---

    // 1. List of normalized core fields for exclusion (includes aliases for robustness)
    const allCoreNames = [
      // Assets
      'total assets', 'total equity and liabilities', 'total non-current assets', 'property, plant and equipment', 'right-of-use assets',
      'capital work-in-progress', 'goodwill', 'financial assets - investments', 'financial assets - loans', 'other financial assets',
      'deferred tax assets (net)', 'income tax assets (net)', 'other non-current assets', 'total current assets', 'trade receivables',
      'cash and cash equivalents', 'other current assets',
      // Equity & Liabilities
      'total equity', 'equity share capital', 'other equity', 'total non-current liabilities', 'financial liabilities - borrowings',
      'financial liabilities - lease', 'other financial liabilities', 'deferred tax liabilities (net)', 'other non-current liabilities',
      'total current liabilities', 'trade payables micro and small', 'trade payables other creditors', 'provisions current', 'income tax liabilities net',
      // Aliases/Labels from data (crucial for filtering)
      'non-current assets', 'current assets', 'total equity', 'non-current liabilities', 'current liabilities',
      'other intangible assets', 'intangible assets under development', 'investments in subsidiaries, associates and joint ventures',
      'derivative instruments', 'loans', 'current tax liabilities (net)', 'deferred revenue', 'provisions',
      'financial liabilities - lease liabilities', 'trade payables - total outstanding dues of micro enterprises and small enterprises',
      'trade payables - total outstanding dues of creditors other than micro enterprises and small enterprises', 'financial assets - loans',
      'financial liabilities - borrowings'
    ].map(normalize);

    // 2. Identify ALL non-core items
    const allFlexibleItems = items.filter(
      item => !allCoreNames.includes(normalize(item.item))
    );

    // 3. Define the specific known flexible item categories (based on test.json for proper placement).
    const flexibleNCAssets = allFlexibleItems.filter(item =>
      normalize(item.item).includes('intangible assets under development') ||
      normalize(item.item).includes('investments in subsidiaries, associates and joint ventures') ||
      normalize(item.item).includes('derivative instruments')
    );

    const flexibleCAssets = allFlexibleItems
      .filter(item =>
        (normalize(item.item).includes('derivative instruments') && !flexibleNCAssets.map(x => normalize(x.item)).includes(normalize(item.item))) ||
        normalize(item.item).includes('other bank balances')
      )
      .filter(item => !flexibleNCAssets.map(x => normalize(x.item)).includes(normalize(item.item)));

    const flexibleNCLiabilities = allFlexibleItems
      .filter(item =>
        normalize(item.item).includes('derivative instruments') ||
        normalize(item.item).includes('deferred revenue') ||
        normalize(item.item).includes('provisions')
      )
      .filter(item => ![...flexibleNCAssets, ...flexibleCAssets].map(x => normalize(x.item)).includes(normalize(item.item)));

    const flexibleCLiabilities = allFlexibleItems
      .filter(item =>
        normalize(item.item).includes('derivative instruments') ||
        normalize(item.item).includes('deferred revenue')
      )
      .filter(item => ![...flexibleNCAssets, ...flexibleCAssets, ...flexibleNCLiabilities].map(x => normalize(x.item)).includes(normalize(item.item)));


    // Define the strict schema structure
    const finalTableData = [
      // I. ASSETS
      { type: 'heading', label: 'I. ASSETS', major: true },

      // Non-Current Assets
      { type: 'heading', label: 'Non-Current Assets' },
      { type: 'row', label: 'Total Non-current Assets', candidates: ['Non-current assets', 'Total Non-current Assets'], bold: true },

      // Fixed Core Fields - Inserted directly with indent, removing the "Fixed Core Fields" heading
      { type: 'row', label: 'Property, plant and equipment', candidates: ['Property, plant and equipment'], indent: true },
      { type: 'row', label: 'Right-of-use assets', candidates: ['Right-of-use assets'], indent: true },
      { type: 'row', label: 'Capital work-in-progress', candidates: ['Capital work-in-progress'], indent: true },
      { type: 'row', label: 'Goodwill', candidates: ['Goodwill'], indent: true },
      { type: 'row', label: 'Financial assets - Investments', candidates: ['Financial assets - Investments'], indent: true },
      { type: 'row', label: 'Financial assets - Loans', candidates: ['Financial Assets - Loans'], indent: true },
      { type: 'row', label: 'Other financial assets', candidates: ['Other financial assets'], indent: true },
      { type: 'row', label: 'Deferred tax assets (net)', candidates: ['Deferred tax assets (net)'], indent: true },
      { type: 'row', label: 'Income tax assets (net)', candidates: ['Income tax assets (net)'], indent: true },
      { type: 'row', label: 'Other non-current assets', candidates: ['Other non-current assets'], indent: true },

      // Insert flexible group items (Non-Current Assets) without a section header
      ...flexibleNCAssets.map(item => ({ type: 'row', label: item.item, candidates: [item.item], indent: true })),

      // Current Assets
      { type: 'heading', label: 'Current Assets' },
      { type: 'row', label: 'Total Current Assets', candidates: ['Current assets', 'Total Current Assets'], bold: true },

      // Fixed Core Fields - Inserted directly with indent, removing the "Fixed Core Fields" heading
      { type: 'row', label: 'Financial assets - Investments', candidates: ['Financial assets - Investments'], indent: true },
      { type: 'row', label: 'Trade receivables', candidates: ['Trade receivables'], indent: true },
      { type: 'row', label: 'Cash and cash equivalents', candidates: ['Cash and cash equivalents'], indent: true },
      { type: 'row', label: 'Financial assets - Loans', candidates: ['Loans', 'Financial Assets - Loans'], indent: true },
      { type: 'row', label: 'Other financial assets', candidates: ['Other financial assets'], indent: true },
      { type: 'row', label: 'Income tax assets (net)', candidates: ['Income Tax Assets (Net)'], indent: true },
      { type: 'row', label: 'Other current assets', candidates: ['Other current assets'], indent: true },

      // Insert flexible group items (Current Assets) without a section header
      ...flexibleCAssets.map(item => ({ type: 'row', label: item.item, candidates: [item.item], indent: true })),

      { type: 'row', label: 'GRAND TOTAL ASSETS', candidates: ['Total assets'], bold: true },

      // ---

      // II. EQUITY AND LIABILITIES
      { type: 'heading', label: 'II. EQUITY AND LIABILITIES', major: true },

      // Equity
      { type: 'heading', label: 'Equity' },
      { type: 'row', label: 'Total Equity', candidates: ['Total Equity'], bold: true },

      // Fixed Core Fields - Inserted directly with indent, removing the "Fixed Core Fields" heading
      { type: 'row', label: 'Equity share capital', candidates: ['Equity share capital'], indent: true },
      { type: 'row', label: 'Other equity', candidates: ['Other equity'], indent: true },

      // Non-Current Liabilities
      { type: 'heading', label: 'Non-Current Liabilities' },
      { type: 'row', label: 'Total Non-current Liabilities', candidates: ['Non-current liabilities'], bold: true },

      // Fixed Core Fields - Inserted directly with indent, removing the "Fixed Core Fields" heading
      { type: 'row', label: 'Financial liabilities - Borrowings', candidates: ['Financial liabilities - Borrowings'], indent: true },
      { type: 'row', label: 'Financial liabilities - Lease', candidates: ['Lease liabilities', 'Financial liabilities - Lease liabilities'], indent: true },
      { type: 'row', label: 'Other financial liabilities', candidates: ['Other financial liabilities'], indent: true },
      { type: 'row', label: 'Deferred tax liabilities (net)', candidates: ['Deferred tax liabilities (net)'], indent: true },
      { type: 'row', label: 'Other non-current liabilities', candidates: ['Other Non-current Liabilities'], indent: true },

      // Insert flexible group items (Non-Current Liabilities) without a section header
      ...flexibleNCLiabilities.map(item => ({ type: 'row', label: item.item, candidates: [item.item], indent: true })),

      // Current Liabilities
      { type: 'heading', label: 'Current Liabilities' },
      { type: 'row', label: 'Total Current Liabilities', candidates: ['Current liabilities'], bold: true },

      // Fixed Core Fields - Inserted directly with indent, removing the "Fixed Core Fields" heading
      { type: 'row', label: 'Financial liabilities - Borrowings', candidates: ['Financial liabilities - Borrowings'], indent: true },
      { type: 'row', label: 'Financial liabilities - Lease', candidates: ['Lease liabilities', 'Financial liabilities - Lease liabilities'], indent: true },
      { type: 'row', label: 'Trade payables - Micro and Small', candidates: ['Trade payables - Total outstanding dues of micro enterprises and small enterprises'], indent: true },
      { type: 'row', label: 'Trade payables - Other Creditors', candidates: ['Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises'], indent: true },
      { type: 'row', label: 'Other financial liabilities', candidates: ['Other financial liabilities'], indent: true },
      { type: 'row', label: 'Other current liabilities', candidates: ['Other current liabilities'], indent: true },
      { type: 'row', label: 'Provisions (Current)', candidates: ['Provisions', 'provisionsCurrent'], indent: true },
      { type: 'row', label: 'Income tax liabilities (net)', candidates: ['Current tax liabilities (net)', 'Income tax liabilities (net)'], indent: true },

      // Insert flexible group items (Current Liabilities) without a section header
      ...flexibleCLiabilities.map(item => ({ type: 'row', label: item.item, candidates: [item.item], indent: true })),

      // Add back grand total for equity and liabilities
      { type: 'row', label: 'GRAND TOTAL EQUITY AND LIABILITIES', candidates: ['Total equity and liabilities'], bold: true },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Balance Sheet Summary{' '}
            <span className="text-sm font-normal text-gray-500">
              (all amounts in ₹ crore)
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                  Particulars
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b min-w-[140px]">
                  {year}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 [&>tr:nth-child(even)]:bg-gray-50/40">
              {finalTableData.map((item, idx) => {
                if (item.type === 'heading') {
                  return <React.Fragment key={`h-${item.label}-${idx}`}>{renderHeading(item.label, item.major)}</React.Fragment>;
                } else {
                  return (
                    <React.Fragment key={`r-${item.label}-${idx}`}>
                      {renderRow(item.label, {
                        bold: item.bold,
                        candidates: item.candidates,
                        indent: item.indent
                      })}
                    </React.Fragment>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  ;

  const renderPLTable = (plData: FinancialItem[]) => {
    const year = selectedYear;
    const items = plData || [];

    // Helper to render an editable row, looks up data using the label/candidates
    const renderRow = (
      label: string,
      opts?: { bold?: boolean; candidates?: string[]; red?: boolean, indent?: boolean }
    ) => {
      const { bold = false, candidates, red = false, indent = false } = opts || {};
      const row = findRowFlexible(items, candidates ?? label);
      const displayLabel = label;
      const value = row ? (row[`FY${year}`] ?? '') : '';

      return (
        <tr
          key={displayLabel}
          className={`hover:bg-gray-50 ${red ? 'bg-red-50' : ''}`}
        >
          <td
            className={`px-4 py-2 text-sm border-b text-left ${bold ? 'font-bold text-gray-900' : 'text-gray-900'} ${indent ? 'pl-8' : ''}`
            }
          >
            {displayLabel}
          </td>
          <td className={`px-4 py-2 text-sm border-b text-right min-w-[140px] ${bold ? 'bg-blue-50 border-t border-blue-200' : ''}`}>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const newVal = e.target.value;
                if (!financialData) return;
                const newFD = { ...financialData };

                const targetArr = [...(newFD.profit_loss || [])];
                const foundIndex = targetArr.findIndex(
                  (t) => normalize(t.item) === normalize(row?.item ?? displayLabel)
                );

                if (foundIndex !== -1) {
                  targetArr[foundIndex] = {
                    ...targetArr[foundIndex],
                    [`FY${year}`]: newVal,
                  };
                } else {
                  const newEntry: FinancialItem = {
                    _id: `generated-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2, 7)}`,
                    item: row?.item ?? displayLabel,
                    [`FY${year}`]: newVal,
                  };
                  targetArr.push(newEntry);
                }

                newFD.profit_loss = targetArr;
                setFinancialData(newFD);
                setIsFinancialDataEdited(true);
              }}
              className={getValueInputClass(value, !!bold)}
              placeholder="-"
            />
          </td>
        </tr>
      );
    };

    // Helper to render a section heading
    const renderHeading = (label: string, red = false) => (
      <tr key={`h-${label}`} className={red ? 'bg-red-50' : 'bg-gray-50'}>
        <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900">
          {label}
        </td>
      </tr>
    );

    // List of normalized core fields to filter out flexible items already covered
    const coreFieldNames = [
      'Revenue from operations', 'Other income', 'Total income', 'Core operating costs', 'Exceptional items (net)',
      'Total expenses', 'Employee benefits expense', 'Depreciation and amortisation expense', 'Finance costs',
      'Cost of technical sub-contractors', 'Travel expenses', 'Communication expenses', 'Consultancy and professional charges',
      // include both variants so it is treated as a core row and excluded from flexible items
      'Other expenses aggregated', 'Other expenses',
      'Profit before tax', 'Profit for the year', 'Current tax', 'Deferred tax',
      'Total comprehensive income for the year', 'Basic Earnings per share', 'Diluted Earnings per share'
    ].map(normalize);

    // Find all items that exist in the loaded data but are NOT part of the explicit core structure
    const flexibleItemsToDisplay = items.filter(
      item => !coreFieldNames.includes(normalize(item.item))
    );

    // Define the strict schema structure
    const finalTableData = [
      // Core Income
      { type: 'row', label: 'Revenue from operations' },
      { type: 'row', label: 'Other income net', candidates: ['Other income'], indent: false },
      { type: 'row', label: 'Total income', bold: true },

      // Core Expenses
      { type: 'heading', label: 'Expenses' },
      { type: 'row', label: 'Core operating costs' },
      { type: 'row', label: 'Employee benefit expenses', candidates: ['Employee benefits expense'] },
      { type: 'row', label: 'Depreciation and amortization expenses', candidates: ['Depreciation and amortisation expense'] },
      { type: 'row', label: 'Finance cost', candidates: ['Finance costs'] },
      { type: 'row', label: 'Cost of technical sub-contractors' },
      { type: 'row', label: 'Travel expenses' },
      { type: 'row', label: 'Communication expenses' },
      { type: 'row', label: 'Consultancy and professional charges' },
      { type: 'row', label: 'Other expenses aggregated', candidates: ['Other expenses aggregated', 'Other expenses', 'Other expenses Aggregated'] },
      { type: 'row', label: 'Total expenses', bold: true },

      // Profit & Tax
      { type: 'row', label: 'Exceptional items, net', candidates: ['Exceptional items (net)'] },
      { type: 'row', label: 'Profit before tax', bold: true, red: true },
      { type: 'heading', label: 'Tax expense:' },
      { type: 'row', label: 'Current tax' },
      { type: 'row', label: 'Deferred tax' },
      { type: 'row', label: 'Profit for the year', bold: true, red: true },
      { type: 'row', label: 'Total comprehensive income for the year', bold: true, red: true },

      // Earnings Per Share (EPS)
      { type: 'heading', label: 'Earnings per equity share' },
      { type: 'row', label: 'Basic (in ₹ per share)', candidates: ['Basic Earnings per share'], indent: true },
      { type: 'row', label: 'Diluted (in ₹ per share)', candidates: ['Diluted Earnings per share'], indent: true },

      // Flexible Group Items (No heading, no indent)
      ...flexibleItemsToDisplay.map(item => ({
        type: 'row', label: item.item, candidates: [item.item]
      }))
    ];


    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Profit & Loss Summary{' '}
            <span className="text-sm font-normal text-gray-500">
              (all amounts in ₹ crore, except per share data)
            </span>
          </h3>
        </div>

        {/* Combined Table: Income, Expenses, Tax, Profit, EPS, Flexible Items */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                  Particulars
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b min-w-[140px]">
                  {year}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 [&>tr:nth-child(even)]:bg-gray-50/40">
              {finalTableData.map((item, idx) => {
                if (item.type === 'heading') {
                  return <React.Fragment key={`h-${item.label}-${idx}`}>{renderHeading(item.label)}</React.Fragment>;
                } else {
                  return (
                    <React.Fragment key={`r-${item.label}-${idx}`}>
                      {renderRow(item.label, {
                        bold: item.bold,
                        candidates: item.candidates,
                        red: item.red,
                        indent: item.indent
                      })}
                    </React.Fragment>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCFTable = (cfData: FinancialItem[]) => {
    const year = selectedYear;
    const items = cfData || [];

    // Helper to render an editable row, looks up data using the label/candidates
    const renderRow = (
      label: string,
      opts?: { bold?: boolean; candidates?: string[]; red?: boolean, indent?: boolean }
    ) => {
      const { bold = false, candidates, red = false, indent = false } = opts || {};
      const row = findRowFlexible(items, candidates ?? label);
      const displayLabel = label;
      const value = row ? (row[`FY${year}`] ?? '') : '';

      return (
        <tr
          key={displayLabel}
          className={`hover:bg-gray-50 ${red ? 'bg-red-50' : ''}`}
        >
          <td
            className={`px-4 py-2 text-sm border-b text-left ${bold ? 'font-bold text-gray-900' : 'text-gray-900'} ${indent ? 'pl-8' : ''}`
            }
          >
            {displayLabel}
          </td>
          <td className={`px-4 py-2 text-sm border-b text-right min-w-[140px] ${bold ? 'bg-blue-50 border-t border-blue-200' : ''}`}>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const newVal = e.target.value;
                if (!financialData) return;
                const newFD = { ...financialData };

                const targetArr = [...(newFD.cash_flow || [])];
                const foundIndex = targetArr.findIndex(
                  (t) => normalize(t.item) === normalize(row?.item ?? displayLabel)
                );

                if (foundIndex !== -1) {
                  targetArr[foundIndex] = {
                    ...targetArr[foundIndex],
                    [`FY${year}`]: newVal,
                  };
                } else {
                  const newEntry: FinancialItem = {
                    _id: `generated-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2, 7)}`,
                    item: row?.item ?? displayLabel,
                    [`FY${year}`]: newVal,
                  };
                  targetArr.push(newEntry);
                }

                newFD.cash_flow = targetArr;
                setFinancialData(newFD);
                setIsFinancialDataEdited(true);
              }}
              className={getValueInputClass(value, !!bold)}
              placeholder="-"
            />
          </td>
        </tr>
      );
    };

    // Helper to render a section heading
    const renderHeading = (label: string, red = false) => (
      <tr key={`h-${label}`} className={`${red ? 'bg-red-50' : 'bg-gray-50'} border-l-4 ${red ? 'border-red-300' : 'border-gray-300'}`}>
        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
          {label}
        </td>
      </tr>
    );

    // 1. List of normalized core fields (and aliases/labels) for exclusion logic
    const allCoreNames = [
      // CFO Core Fields & Aliases
      'net cash generated from operating activities', 'cash generated from operations', 'profit before tax', 'income tax refund (net)',
      'depreciation and amortisation expenses', 'income tax expense', 'provision for doubtful debts / bad debts written off', 'finance costs',
      'interest and dividend income', 'employee share based payment expense', 'other adjustments', 'trade receivables',
      'other financial and non-financial assets', 'trade payables', 'other financial liabilities, other liabilities and provisions',
      'Net cash generated by operating activities',
      // CFI Core Fields & Aliases
      'net cash used in investing activities', 'purchase of property, plant and equipment and capital-work-in-progress', 'deposits placed with corporation',
      'redemption of deposits placed with corporation', 'interest and dividend received', 'dividend received', 'loan given to subsidiaries',
      'loan repayment by subsidiaries', 'investment in subsidiary', 'payment towards acquisition of entities',
      'receipt/payment towards business transfer for entities under common control', 'receipt/payment from entities under liquidation',
      'other receipts',
      // CFF Core Fields & Aliases
      'net cash used in financing activities', 'payment of lease liabilities', 'proceeds from exercise of share options',
      'other payments', 'dividend paid',
      // CF Summary Core Fields & Aliases
      'net increase / (decrease) in cash and cash equivalents during the year (a+b+c)', 'effect of exchange differences on translation of foreign currency cash and cash equivalents',
      'cash and cash equivalents as at the beginning of the year', 'cash and cash equivalents as at the end of the year (refer note 14)'
    ].map(normalize);

    // 2. Identify ALL non-core items
    const allFlexibleItems = items.filter(
      item => !allCoreNames.includes(normalize(item.item))
    );

    // 3. Define the specific known flexible items (based on test.json/schema) for each section.

    const knownCFOAdjustments = [
      'Interest income', 'Dividend income', 'Net (gain) / loss on derivative financial instruments',
      'Net gain on fair value through profit or loss (FVTPL) investments', 'Exceptional items (net)',
      'Loss on sale of property, plant and equipment', 'Other non-cash items'
    ].map(normalize);

    const knownCFOChanges = [
      'Provisions', 'Other financial and non-financial liabilities', 'Inventories'
    ].map(normalize);

    const knownCFIPayments = [
      'Purchase of non-current investments', 'Purchase of intangible assets and intangible assets under development'
    ].map(normalize);

    const knownCFIProceeds = [
      'Proceeds from sale of current investments (net)', 'Proceeds from sale of non-current investments'
    ].map(normalize);

    // 4. Filter the allFlexibleItems list into the four mandated groups.

    // CFO Adjustments flexible items
    const flexibleCFOAdjustments = allFlexibleItems.filter(item =>
      knownCFOAdjustments.includes(normalize(item.item))
    );

    // CFO Changes in A&L flexible items (Exclude items already categorized)
    const flexibleCFOChanges = allFlexibleItems.filter(item =>
      knownCFOChanges.includes(normalize(item.item))
    ).filter(item => !flexibleCFOAdjustments.map(x => normalize(x.item)).includes(normalize(item.item)));

    // CFI Payments flexible items
    const flexibleCFIPayments = allFlexibleItems.filter(item =>
      knownCFIPayments.includes(normalize(item.item))
    ).filter(item => ![...flexibleCFOAdjustments, ...flexibleCFOChanges].map(x => normalize(x.item)).includes(normalize(item.item)));

    // CFI Proceeds flexible items
    const flexibleCFIProceeds = allFlexibleItems.filter(item =>
      knownCFIProceeds.includes(normalize(item.item))
    ).filter(item => ![...flexibleCFOAdjustments, ...flexibleCFOChanges, ...flexibleCFIPayments].map(x => normalize(x.item)).includes(normalize(item.item)));

    // Define the strict schema structure
    const finalTableData = [
      // Top Level Summary (Net Cash Flows)
      { type: 'row', label: 'Net cash generated by operating activities', candidates: ['Net cash generated from operating activities (a)'], bold: true },
      { type: 'row', label: 'Net cash used in investing activities', candidates: ['Net cash used in investing activities (b)'], bold: true },
      { type: 'row', label: 'Net cash used in financing activities', candidates: ['Net cash used in financing activities (c)'], bold: true },

      // Cash Flow from Operating Activities (CFO) - Core Inputs/Summary
      // { type: 'heading', label: 'Cash Flow from Operations (CFO)' },
      { type: 'row', label: 'Cash generated from operations', candidates: ['Cash generated from operations'], indent: false },
      { type: 'row', label: 'Profit before tax', candidates: ['Profit before tax'], indent: false },
      { type: 'row', label: 'Income taxes paid', candidates: ['Income tax refund (net)'], indent: false },

      // CFO Adjustments (CFO Adjustments)
      { type: 'heading', label: 'CFO Adjustments' },
      { type: 'row', label: 'Depreciation and Amortization', candidates: ['Depreciation and amortisation expenses'], indent: true },
      { type: 'row', label: 'Income tax expense', indent: true },
      { type: 'row', label: 'Impairment loss recognized / (reversed)', candidates: ['Provision for doubtful debts / bad debts written off'], indent: true },
      { type: 'row', label: 'Finance cost', candidates: ['Finance costs'], indent: true },
      { type: 'row', label: 'Interest and Dividend Income', indent: true },
      { type: 'row', label: 'Stock compensation expense', candidates: ['Employee share based payment expense'], indent: true },
      { type: 'row', label: 'Other adjustments', indent: true },

      // **FIXED**: CFO Adjustments Flexible Group Items (no heading, indented)
      ...flexibleCFOAdjustments.map(item => ({
        type: 'row', label: item.item, candidates: [item.item], indent: true
      })),

      // CFO Changes in A&L (CFO Changes in A&L)
      { type: 'heading', label: 'CFO Changes in A&L' },
      { type: 'row', label: 'Trade receivables and unbilled revenue', candidates: ['Trade receivables'], indent: true },
      { type: 'row', label: 'Loans, other financial assets and other assets', candidates: ['Other financial and non-financial assets'], indent: true },
      { type: 'row', label: 'Trade payables', indent: true },
      { type: 'row', label: 'Other financial liabilities, other liabilities and provisions', candidates: ['Other Financial Liabilities Other Liabilities And Provisions'], indent: true },

      // **FIXED**: CFO Changes in A&L Flexible Group Items (no heading, indented)
      ...flexibleCFOChanges.map(item => ({
        type: 'row', label: item.item, candidates: [item.item], indent: true
      })),

      // Cash Flow from Investing Activities (CFI)
      { type: 'heading', label: 'CFI Investing Activities' },
      { type: 'row', label: 'Expenditure on property, plant and equipment', candidates: ['Purchase of property, plant and equipment and capital-work-in-progress'], indent: true },
      { type: 'row', label: 'Deposits placed with corporation', indent: true },
      { type: 'row', label: 'Redemption of deposits placed with corporation', indent: true },
      { type: 'row', label: 'Interest and dividend received', indent: true },
      { type: 'row', label: 'Dividend received from subsidiary', candidates: ['Dividend received'], indent: true },
      { type: 'row', label: 'Loan given to subsidiaries', indent: true },
      { type: 'row', label: 'Loan repaid by subsidiaries', candidates: ['Loan repayment by subsidiaries'], indent: true },
      { type: 'row', label: 'Investment in subsidiaries', candidates: ['Investment in subsidiary'], indent: true },
      { type: 'row', label: 'Payment towards acquisition of entities', indent: true },
      { type: 'row', label: 'Receipt/Payment towards business transfer for entities under common control', indent: true },
      { type: 'row', label: 'Receipt/Payment from entities under liquidation', indent: true },
      { type: 'row', label: 'Other receipts', indent: true },

      // CFI Payments to Acquire Investments
      { type: 'heading', label: 'CFI Payments to Acquire Investments' },
      // { type: 'row', label: 'Fixed Core Fields (Investment Purchases)', indent: true }, // Placeholder for Fixed Core

      // **FIXED**: CFI Payments Flexible Group Items (no heading, indented)
      ...flexibleCFIPayments.map(item => ({
        type: 'row', label: item.item, candidates: [item.item], indent: true
      })),

      // CFI Proceeds on Sale of Investments
      { type: 'heading', label: 'CFI Proceeds on Sale of Investments' },
      // { type: 'row', label: 'Fixed Core Fields (Investment Sales)', indent: true }, // Placeholder for Fixed Core

      // **FIXED**: CFI Proceeds Flexible Group Items (no heading, indented)
      ...flexibleCFIProceeds.map(item => ({
        type: 'row', label: item.item, candidates: [item.item], indent: true
      })),

      // Cash Flow from Financing Activities (CFF)
      { type: 'heading', label: 'CFF Financing Activities' },
      { type: 'row', label: 'Net cash used in financing activities (Total)', candidates: ['Net cash used in financing activities'], bold: true },
      { type: 'row', label: 'Payment of lease liabilities', indent: true },
      { type: 'row', label: 'Shares issued on exercise of employee stock options', candidates: ['Proceeds from exercise of share options'], indent: true },
      { type: 'row', label: 'Other payments', indent: true },
      { type: 'row', label: 'Payment of dividends', candidates: ['Dividend paid'], indent: true },

      // CF Summary
      { type: 'heading', label: 'CF Summary' },
      { type: 'row', label: 'Net increase / (decrease) in cash and cash equivalents', candidates: ['Net increase / (decrease) in cash and cash equivalents during the year (a+b+c)'], bold: true, red: true },
      { type: 'row', label: 'Effect of exchange differences on translation of foreign currency cash and cash equivalents', indent: true },
      { type: 'row', label: 'Cash and cash equivalents at the beginning of the year', indent: true },
      { type: 'row', label: 'Cash and cash equivalents at the end of the year', candidates: ['Cash and cash equivalents as at the end of the year (refer note 14)'], bold: true, red: true },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Cash Flow Summary{' '}
            <span className="text-sm font-normal text-gray-500">(in ₹ crore)</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                  Particulars
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b min-w-[140px]">
                  {year}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 [&>tr:nth-child(even)]:bg-gray-50/40">
              {finalTableData.map((item, idx) => {
                if (item.type === 'heading') {
                  return <React.Fragment key={`h-${item.label}-${idx}`}>{renderHeading(item.label)}</React.Fragment>;
                } else {
                  return (
                    <React.Fragment key={`r-${item.label}-${idx}`}>
                      {renderRow(item.label, {
                        bold: item.bold,
                        candidates: item.candidates,
                        red: item.red,
                        indent: item.indent
                      })}
                    </React.Fragment>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------------------------
  // Approve / Decline handlers (updated to support unsaved changes dialog)
  // ---------------------------

  // centralize approve API logic so we can call it from multiple places
  const doApprove = async () => {
    if (!data) return;
    try {
      const res = await fetch(`http://localhost:5000/leads/${data._id}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        const updated = await res.json();
        setData({
          ...data,
          status: updated.record.status,
          customer_name: updated.record.business_name
        });
        showToast('Customer approved successfully! ✅', 'success');
      } else {
        showToast('Failed to approve. ❌', 'error');
      }
    } catch (err) {
      console.error('Error approving:', err);
      showToast('Error approving. ❌', 'error');
    }
  };

  const handleApprove = async () => {
    if (!data) return;

    // If there are unsaved edits, open the confirmation modal.
    if (isFinancialDataEdited) {
      setShowConfirmDialog(true);
      return;
    }

    // No edits: proceed to approve as before
    await doApprove();
  };

  const handleDecline = async () => {
    if (!data) return;
    try {
      const res = await fetch(`http://localhost:5000/leads/${data._id}/reject`, {
        method: 'PUT'
      });
      if (res.ok) {
        const updated = await res.json();
        setData({
          ...data,
          status: updated.record.status,
          customer_name: updated.record.business_name
        });
        showToast('Customer rejected successfully! ✅', 'success');
      } else {
        showToast('Failed to reject. ❌', 'error');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      showToast('Error rejecting. ❌', 'error');
    }
  };

  // ---------------------------
  // Save handler (unchanged logic, but update original snapshot after success)
  // ---------------------------
  const handleSave = async () => {
    if (!financialData || !data) return;

    try {
      const year = selectedYear;

      // 👇 Pick the current collection and determine the section name
      const targetArr =
        selectedCollection === 'Balance Sheet Summary'
          ? financialData.balance_sheet
          : selectedCollection === 'Profit & Loss Summary'
            ? financialData.profit_loss
            : financialData.cash_flow;

      // Determine the section name for the backend
      const sectionName = 
        selectedCollection === 'Balance Sheet Summary'
          ? 'balanceSheet'
          : selectedCollection === 'Profit & Loss Summary'
            ? 'profitAndLoss'
            : 'cashFlows';

      // Loop through rows of the current table
      for (const row of targetArr) {
        const value = row[`FY${year}`];

        // Skip empty or untouched rows
        if (value === undefined || value === null || value === '') continue;

        await fetch('http://localhost:5000/qc/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: data.customer_name,
            lead_id: data.lead_id,
            item: row.item,
            year,
            value,
            section: sectionName
          })
        });
      }

      // Fire-and-forget: trigger recompute of ratios, risk, and summaries after saving edits
      try {
        // Uses Mongo _id from `data._id` as required by the backend route
        fetch(`http://localhost:5000/leads/${data._id}/recompute-analysis`, {
          method: 'POST'
        })
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text().catch(() => '');
              console.error('Recompute trigger failed:', text || res.status);
            }
          })
          .catch((e) => {
            console.error('Recompute trigger error:', e);
          });
      } catch (e) {
        console.error('Failed to initiate recompute:', e);
      }

      showToast('Changes saved successfully ✅', 'success');
      setIsFinancialDataEdited(false);

      // update snapshot to current saved data
      try {
        setOriginalFinancialData(JSON.parse(JSON.stringify(financialData)));
      } catch (err) {
        setOriginalFinancialData(financialData);
      }
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Failed to save changes ❌', 'error');
    }
  };

  // ---------------------------
  // Confirmation dialog actions
  // - Save & Approve: save first then approve
  // - Discard: revert to snapshot and close dialog (do NOT approve)
  // - Cancel: close dialog
  // ---------------------------
  const confirmSaveAndApprove = async () => {
    setShowConfirmDialog(false);
    await handleSave();
    // After saving, ensure isFinancialDataEdited is false and snapshot updated, then approve
    await doApprove();
  };

  const confirmDiscardChanges = () => {
    // restore original snapshot (deep copy)
    if (originalFinancialData) {
      try {
        setFinancialData(JSON.parse(JSON.stringify(originalFinancialData)));
      } catch (err) {
        setFinancialData(originalFinancialData);
      }
    }
    setIsFinancialDataEdited(false);
    setShowConfirmDialog(false);
    showToast('Changes discarded. ✅', 'success');
    // Important: do NOT approve — user must click Approve manually if they want to proceed.
  };

  // ---------------------------
  // Render
  // ---------------------------
  if (!data) return <div className="p-4">Loading customer data...</div>;

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-sm border text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes Detected</DialogTitle>
            <DialogDescription>
              There are unsaved changes. Do you want to save them before approving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDiscardChanges}>
              Discard Changes
            </Button>
            <Button onClick={confirmSaveAndApprove}>
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button onClick={() => navigate('/qc')}>← Back to QC Table</Button>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
            <div className="mt-1 text-sm text-gray-500">Overview of the selected lead</div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
              ${(data.status || 'Pending') === 'Approved'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : (data.status || 'Pending') === 'Rejected'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : (data.status || 'Pending') === 'In Progress'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
              }
            `}
          >
            {data.status ?? 'Pending'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-500">Customer Name</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{data.customer_name ?? '-'}</div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-500">Lead ID</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{data.lead_id ?? '-'}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <label className="block mb-2 font-medium">Select the type of financial document:</label>
          <Popover open={openCollection} onOpenChange={setOpenCollection}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCollection}
                className="w-[280px] justify-between"
              >
                {selectedCollection || 'Choose the document'}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Search document..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No document found.</CommandEmpty>
                  <CommandGroup>
                    {collections.map((col) => (
                      <CommandItem
                        key={col}
                        value={col}
                        onSelect={(currentValue) => {
                          setSelectedCollection(currentValue);
                          setOpenCollection(false);
                        }}
                      >
                        {col}
                        <Check
                          className={cn(
                            'ml-auto',
                            selectedCollection === col ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block mb-2 font-medium">Select a year:</label>
          <Popover open={openYear} onOpenChange={setOpenYear}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openYear}
                className="w-[180px] justify-between"
              >
                {selectedYear || 'Select year'}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0">
              <Command>
                <CommandInput placeholder="Search year..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No year found.</CommandEmpty>
                  <CommandGroup>
                    {years.map((yr) => (
                      <CommandItem
                        key={yr}
                        value={yr}
                        onSelect={(currentValue) => {
                          setSelectedYear(currentValue);
                          setOpenYear(false);
                        }}
                      >
                        {yr}
                        <Check
                          className={cn(
                            'ml-auto',
                            selectedYear === yr ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        {selectedCollection ? (
          <div className="mt-4">
            {financialData && renderDynamicTable()}

            {/* Save Changes button removed by request - edits are tracked via isFinancialDataEdited,
                approval now triggers the confirmation dialog when edits exist. */}

          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Please select a document type to view the extracted data.
          </div>
        )}
      </div>

      {selectedCollection && (
        <div className="mt-8 flex justify-end space-x-4">
          {(() => {
            const isFinalized = (data.status === 'Approved' || data.status === 'Rejected');
            return (
              <>
                <button
                  onClick={handleDecline}
                  disabled={isFinalized}
                  className={`text-white px-4 py-2 rounded ${isFinalized ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: '#00306E' }}
                >
                  Decline
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isFinalized}
                  className={`text-white px-4 py-2 rounded ${isFinalized ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: '#0266F4' }}
                >
                  Approve
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default QCViewer;