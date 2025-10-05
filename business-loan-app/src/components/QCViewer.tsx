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

type AnalysisEntry = {
  _id: string;
  company_name: string;
  lead_id: string;
  last_updated: string;
  net_worth: number;
  debt_to_equity: string;
  dscr: string;
  year_range: string;
  ratio_health: string;
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
};

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
  const [textValue, setTextValue] = useState<string>('');
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

  // 🔹 Convert extracted data to text and back
  const extractedDataToText = (obj?: ExtractedData) => {
    if (!obj) return '';
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  };

  const textToExtractedData = (text: string) => {
    const lines = text.split('\n');
    const out: ExtractedData = {};
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const idx = line.indexOf(':');
      if (idx === -1) {
        out[line] = '';
      } else {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key) out[key] = value;
      }
    }
    return out;
  };

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
        if (qcEntry.documents?.length > 0) {
          setTextValue(extractedDataToText(qcEntry.documents[0].extracted_data));
        } else {
          setTextValue('');
        }
      })
      .catch((err) => {
        console.error('Failed to load customer data:', err);
        setData(null);
      });
  }, [id]);

  // 🔹 Fetch selected collection (and capture original snapshot)
  useEffect(() => {
    if (!selectedCollection || !id || !data || !selectedYear) return;

    fetch(`http://localhost:5000/analysis/`)
      .then((res) => res.json())
      .then((analysisEntries) => {
        const matchingEntry = analysisEntries.find(
          (entry: AnalysisEntry) => entry.lead_id === data.lead_id
        );
        if (!matchingEntry) {
          setTextValue('No financial analysis data found for this lead.');
          return;
        }
        return fetch(
          `http://localhost:5000/analysis/${matchingEntry._id}?year=${selectedYear}`
        );
      })
      .then((res) => res?.json())
      .then((data) => {
        if (!data) return;

        const dataWithFY: FinancialData = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? item['value_2023'] ?? null,
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? item['value_2023'] ?? null,
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? item['value_2023'] ?? null,
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          }))
        };
        setFinancialData(dataWithFY);

        // Capture a deep copy as the "original" snapshot for discarding changes later
        try {
          setOriginalFinancialData(JSON.parse(JSON.stringify(dataWithFY)));
          setIsFinancialDataEdited(false);
        } catch (err) {
          // fallback if something fails in serialization
          setOriginalFinancialData(dataWithFY);
          setIsFinancialDataEdited(false);
        }

        const selectedData =
          selectedCollection === 'Balance Sheet Summary'
            ? dataWithFY.balance_sheet
            : selectedCollection === 'Profit & Loss Summary'
              ? dataWithFY.profit_loss
              : dataWithFY.cash_flow;

        if (selectedData.length > 0) {
          setTextValue(JSON.stringify(selectedData, null, 2));
        } else {
          setTextValue('No data found.');
        }
      })
      .catch((err) => {
        console.error('Failed to load financial data:', err);
        setTextValue('Error loading financial data.');
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
  // Balance Sheet renderer (single year) with robust matching and editable placeholders
  // ---------------------------
  const renderBSTable = (bsData: FinancialItem[]) => {
    const year = selectedYear;
    const items = bsData || [];

    const renderRow = (
      label: string,
      opts?: { bold?: boolean; candidates?: string[] }
    ) => {
      const { bold = false, candidates } = opts || {};
      const row = findRowFlexible(items, candidates ?? label);
      const displayLabel = label;
      const value = row ? (row[`FY${year}`] ?? '') : '';
      const isParenNegative = typeof value === 'string' && /\(.*\)/.test(value.trim());

      return (
        <tr key={displayLabel} className="hover:bg-gray-50">
          <td
            className={`px-4 py-2 text-sm border-b text-left ${bold ? 'font-bold text-gray-900' : 'text-gray-900'
              }`}
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

    // heading renderer
    const renderHeading = (label: string, red = false, keySuffix?: string) => (
      <tr key={`h-${label}-${keySuffix ?? ''}`} className={`${red ? 'bg-red-50' : 'bg-gray-50'} border-l-4 ${red ? 'border-red-300' : 'border-gray-300'}`}>
        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
          {label}
        </td>
      </tr>
    );

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
              {/* ASSETS */}
              {renderHeading('Assets', true, 'assets')}
              {renderHeading('Non-current assets', false, 'noncurrent')}
              {renderRow('Property, plant and equipment')}
              {renderRow('Right-of-use assets')}
              {renderRow('Capital work-in-progress')}
              {renderRow('Goodwill')}

              {renderHeading('Financial assets', false, 'nc-financial-assets')}
              {renderRow('Financial assets - Investments (Non-current)')}
              {renderRow('Financial assets - Loans (Non-current)')}
              {renderRow('Other financial assets (Non-current)')}
              {renderRow('Deferred tax assets (net)')}
              {renderRow('Income tax assets (net) (Non-current)')}
              {renderRow('Other non-current assets')}
              {renderRow('Total non-current assets', { bold: true })}

              {renderHeading('Current assets', false, 'current-assets')}
              {renderHeading('Financial assets', false, 'c-financial-assets')}
              {renderRow('Financial assets - Investments (Current)')}
              {renderRow('Trade receivables')}
              {renderRow('Cash and cash equivalents')}
              {renderRow('Financial assets - Loans (Current)')}
              {renderRow('Other financial assets (Current)')}
              {renderRow('Income tax assets (net) (Current)')}
              {renderRow('Other current assets')}
              {renderRow('Total current assets', { bold: true })}
              {renderRow('Total assets', { bold: true })}

              {/* EQUITY & LIABILITIES */}
              {renderHeading('Equity and Liabilities', true, 'eq-liab')}
              {renderHeading('Equity', false, 'equity')}
              {renderRow('Equity share capital')}
              {renderRow('Other equity')}
              {renderRow('Total equity', { bold: true })}

              {renderHeading('Liabilities', false, 'liabilities')}
              {renderHeading('Non-current liabilities', false, 'noncurrent-liabilities')}
              {renderHeading('Financial liabilities', false, 'nc-financial-liabilities')}
              {renderRow('Financial liabilities - Lease liabilities (Non-current)')}
              {renderRow('Other financial liabilities (Non-current)')}
              {renderRow('Deferred tax liabilities (net)')}
              {renderRow('Other non-current liabilities')}
              {renderRow('Total non-current liabilities', { bold: true })}

              {renderHeading('Current liabilities', false, 'current-liabilities')}
              {renderHeading('Financial liabilities', false, 'c-financial-liabilities')}
              {renderRow('Financial liabilities - Lease liabilities (Current)')}

              {renderRow(
                'Trade payables - Total outstanding dues of micro enterprises and small enterprises',
                { candidates: ['Trade payables - Total outstanding dues of micro enterprises and small enterprises'] }
              )}

              {renderRow(
                'Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises',
                { candidates: ['Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises'] }
              )}

              {renderRow('Other financial liabilities (Current)')}
              {renderRow('Other current liabilities')}
              {renderRow('Provisions (Current)', { candidates: ['Provisions (Current)', 'Provisions'] })}
              {renderRow('Income tax liabilities (net)')}
              {renderRow('Total current liabilities', { bold: true })}
              {renderRow('Total equity and liabilities', { bold: true })}
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

    const renderRow = (
      label: string,
      opts?: { bold?: boolean; candidates?: string[]; red?: boolean }
    ) => {
      const { bold = false, candidates, red = false } = opts || {};
      const row = findRowFlexible(items, candidates ?? label);
      const displayLabel = label;
      const value = row ? (row[`FY${year}`] ?? '') : '';

      return (
        <tr
          key={displayLabel}
          className={`hover:bg-gray-50 ${red ? 'bg-red-50' : ''}`}
        >
          <td
            className={`px-4 py-2 text-sm border-b text-left ${bold ? 'font-bold text-gray-900' : 'text-gray-900'
              }`}
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

    const renderHeading = (label: string, red = false) => (
      <tr key={`h-${label}`} className={red ? 'bg-red-50' : 'bg-gray-50'}>
        <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900">
          {label}
        </td>
      </tr>
    );

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

        {/* First table */}
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
              {renderRow('Revenue from operations')}
              {renderRow('Other income, net')}
              {renderRow('Total income', { bold: true })}

              {renderHeading('Expenses')}
              {renderRow('Employee benefit expenses')}
              {renderRow('Cost of technical sub-contractors')}
              {renderRow('Travel expenses')}
              {renderRow('Cost of software packages and others')}
              {renderRow('Communication expenses')}
              {renderRow('Consultancy and professional charges')}
              {renderRow('Depreciation and amortization expenses')}
              {renderRow('Finance cost')}
              {renderRow('Other expenses')}
              {renderRow('Total expenses', { bold: true })}

              {renderRow('Profit before tax', { bold: true, red: true })}

              {renderHeading('Tax expense:')}
              {renderRow('Current tax')}
              {renderRow('Deferred tax')}
              {renderRow('Profit for the year', { bold: true, red: true })}
            </tbody>
          </table>
        </div>

        {/* Space between tables */}
        <div className="my-6 bg-white"></div>

        {/* Second table: Profit and Loss (Contd.) */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                  Particulars
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b">
                  {year}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 [&>tr:nth-child(even)]:bg-gray-50/40">
              {renderHeading('Profit and Loss (Contd.)')}
              {renderHeading('Other comprehensive income', true)}
              {renderHeading(
                'Items that will not be reclassified subsequently to profit or loss'
              )}
              {renderRow(
                'Remeasurement of the net defined benefit liability / asset, net'
              )}
              {renderRow(
                'Equity instruments through other comprehensive income, net'
              )}

              {renderHeading(
                'Items that will be reclassified subsequently to profit or loss'
              )}
              {renderRow(
                'Fair value changes on derivatives designated as cash flow hedge, net'
              )}
              {renderRow('Fair value changes on investments, net')}

              {renderRow('Total other comprehensive income / (loss), net of tax', {
                bold: true,
                red: true,
              })}

              {renderRow('Total comprehensive income for the year', {
                bold: true,
                red: true,
              })}

              {renderHeading('Earnings per equity share', true)}
              {renderHeading('Equity shares of par value ₹5/- each')}
              {renderRow('Basic (in ₹ per share)')}
              {renderRow('Diluted (in ₹ per share)')}

              {renderHeading(
                'Weighted average equity shares used in computing earnings per equity share'
              )}
              {renderRow('Basic (in shares)')}
              {renderRow('Diluted (in shares)')}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  const renderCFTable = (cfData: FinancialItem[]) => {
    const year = selectedYear;

    // Build combined array: take cash_flow, inject Profit for the year & Finance cost from profit_loss
    let items = cfData ? [...cfData] : [];
    if (financialData) {
      const profitRow = findRowFlexible(financialData.profit_loss, [
        'Profit for the year',
        'Profit after tax'
      ]);
      const financeRow = findRowFlexible(financialData.profit_loss, [
        'Finance cost',
        'Finance costs'
      ]);

      // Inject Profit for the year at the top if missing
      if (profitRow && !items.some(d => normalize(d.item) === normalize(profitRow.item))) {
        items = [profitRow, ...items];
      }

      // Inject Finance cost after Impairment if missing
      if (financeRow && !items.some(d => normalize(d.item) === normalize(financeRow.item))) {
        const idx = items.findIndex(
          d => d.item && normalize(d.item).includes('impairment loss recognized')
        );
        if (idx !== -1) {
          items.splice(idx + 1, 0, financeRow);
        } else {
          items.push(financeRow);
        }
      }
    }

    const renderRow = (
      label: string,
      opts?: { bold?: boolean; candidates?: string[]; red?: boolean }
    ) => {
      const { bold = false, candidates, red = false } = opts || {};
      const row = findRowFlexible(items, candidates ?? label);
      const value = row ? (row[`FY${year}`] ?? '') : '';
      return (
        <tr key={label} className={`hover:bg-gray-50 ${red ? 'bg-red-50' : ''}`}>
          <td
            className={`px-4 py-2 text-sm border-b text-left ${bold ? 'font-bold text-gray-900' : 'text-gray-900'
              }`}
          >
            {label}
          </td>
          <td className={`px-4 py-2 text-sm border-b text-right min-w-[140px] ${bold ? 'bg-blue-50 border-t border-blue-200' : ''}`}>
            <input
              type="text"
              value={value}
              onChange={e => {
                if (!financialData) return;
                const newFD = { ...financialData };
                const arr = [...newFD.cash_flow];
                const idx = arr.findIndex(
                  t => normalize(t.item) === normalize(row?.item ?? label)
                );
                if (idx !== -1) {
                  arr[idx] = { ...arr[idx], [`FY${year}`]: e.target.value };
                } else {
                  arr.push({
                    _id: `gen-${Date.now()}`,
                    item: row?.item ?? label,
                    [`FY${year}`]: e.target.value
                  });
                }
                newFD.cash_flow = arr;
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

    const renderHeading = (label: string, red = false) => (
      <tr key={`h-${label}`} className={`${red ? 'bg-red-50' : 'bg-gray-50'} border-l-4 ${red ? 'border-red-300' : 'border-gray-300'}`}>
        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
          {label}
        </td>
      </tr>
    );

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
              {renderHeading('Cash flow from operating activities:', true)}
              {renderRow('Profit for the year', {
                candidates: ['Profit for the year', 'Profit after tax']
              })}
              {renderHeading(
                'Adjustments to reconcile net profit to net cash provided by operating activities:'
              )}
              {renderRow('Depreciation and Amortization')}
              {renderRow('Income tax expense')}
              {renderRow(
                'Impairment loss recognized / (reversed) under expected credit loss model'
              )}
              {renderRow('Finance cost', {
                candidates: ['Finance cost', 'Finance costs']
              })}
              {renderRow('Interest and dividend income')}
              {renderRow('Stock compensation expense')}
              {renderRow('Provision for post-sale client support')}
              {renderRow(
                'Exchange differences on translation of assets and liabilities, net'
              )}
              {renderRow('Interest receivable on income tax refund')}
              {renderRow('Other adjustments')}
              {renderHeading('Changes in assets and liabilities')}
              {renderRow('Trade receivables and unbilled revenue')}
              {renderRow('Loans, other financial assets and other assets')}
              {renderRow('Trade payables')}
              {renderRow('Other financial liabilities, other liabilities and provisions')}
              {renderRow('Cash generated from operations')}
              {renderRow('Income taxes paid')}
              {renderRow('Net cash generated by operating activities', { bold: true })}

              {renderHeading('Cash flow from investing activities:', true)}
              {renderRow('Expenditure on property, plant and equipment')}
              {renderRow('Deposits placed with corporation')}
              {renderRow('Redemption of deposits placed with corporation')}
              {renderRow('Interest and dividend received')}
              {renderRow('Dividend received from subsidiary')}
              {renderRow('Loan given to subsidiaries')}
              {renderRow('Loan repaid by subsidiaries')}
              {renderRow('Investment in subsidiaries')}
              {renderRow('Payment towards acquisition of entities')}
              {renderRow(
                'Receipt / (payment) towards business transfer for entities under common control'
              )}
              {renderRow('Receipt / (payment) from entities under liquidation')}
              {renderRow('Other receipts')}

              {renderHeading('Payments to acquire investments')}
              {renderRow('Payments to acquire investments: Liquid mutual fund units')}
              {renderRow('Payments to acquire investments: Commercial papers')}
              {renderRow('Payments to acquire investments: Certificates of deposit')}
              {renderRow('Payments to acquire investments: Non-convertible debentures')}
              {renderRow('Payments to acquire investments: Other investments')}

              {renderHeading('Proceeds on sale of investments')}
              {renderRow(
                'Proceeds on sale of investments: Tax-free bonds and government bonds'
              )}
              {renderRow('Proceeds on sale of investments: Liquid mutual fund units')}
              {renderRow('Proceeds on sale of investments: Non-convertible debentures')}
              {renderRow('Proceeds on sale of investments: Certificates of deposit')}
              {renderRow('Proceeds on sale of investments: Commercial papers')}
              {renderRow('Proceeds on sale of investments: Government securities')}
              {renderRow('Proceeds on sale of investments: Other investments')}

              {renderRow('Net cash used in investing activities', { bold: true })}

              {renderHeading('Cash flow from financing activities:', true)}
              {renderRow('Payment of lease liabilities')}
              {renderRow('Shares issued on exercise of employee stock options')}
              {renderRow('Other payments')}
              {renderRow('Payment of dividends')}
              {renderRow('Net cash used in financing activities', { bold: true })}

              {renderRow('Net increase / (decrease) in cash and cash equivalents', {
                bold: true,
                red: true
              })}
              {renderRow('Effect of exchange differences on translation of foreign currency cash and cash equivalents')}
              {renderRow('Cash and cash equivalents at the beginning of the year')}
              {renderRow('Cash and cash equivalents at the end of the year', {
                bold: true,
                red: true
              })}

              {renderHeading('Supplementary information:')}
              {renderRow('Restricted cash balance')}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------------------------
  // Generic flat table renderer (used for P&L and Cash Flow)
  // (kept from previous implementation, including cash-flow injections)
  // ---------------------------
  const findRowInDataset = (dataset: FinancialItem[], itemName: string): FinancialItem | null => {
    if (!dataset) return null;
    return dataset.find(d => d.item === itemName) || null;
  };

  const renderFlatTable = (data: FinancialItem[], arrayType: keyof FinancialData) => {
    const yearArray = selectedYear ? [selectedYear] : [];
    let displayData = [...data];

    // Inject rows into Cash Flow (borrowed from profit_loss when missing)
    if (arrayType === "cash_flow" && financialData) {
      const profitRow = findRowInDataset(financialData.profit_loss, "Profit for the year");
      const financeCostRow = findRowInDataset(financialData.profit_loss, "Finance cost");

      // Profit for the year at the top
      if (profitRow && !displayData.some(d => d.item === "Profit for the year")) {
        displayData = [profitRow, ...displayData];
      }

      // Finance cost after Impairment loss
      if (financeCostRow && !displayData.some(d => d.item === "Finance cost")) {
        const idx = displayData.findIndex(d =>
          d.item && typeof d.item === 'string' && d.item.includes("Impairment loss recognized")
        );
        if (idx !== -1) {
          displayData.splice(idx + 1, 0, financeCostRow);
        }
      }
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Item
              </th>
              {yearArray.map((year) => (
                <th
                  key={year}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, index) => (
              <tr key={row._id || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b text-left">
                  {row.item}
                </td>
                {yearArray.map((year) => (
                  <td key={year} className="px-4 py-3 text-sm border-b text-right">
                    <input
                      type="text"
                      value={row[`FY${year}`] ?? ''}
                      onChange={(e) => {
                        if (!financialData) return;
                        const newFD = { ...financialData };
                        const targetArr = [...newFD[arrayType]];
                        const numValue = parseFloat(e.target.value);
                        const idx = targetArr.findIndex((d) => d.item === row.item);
                        if (idx !== -1) {
                          targetArr[idx][`FY${year}`] = isNaN(numValue)
                            ? e.target.value
                            : numValue;
                          newFD[arrayType] = targetArr;
                          setFinancialData(newFD);
                          setIsFinancialDataEdited(true);
                        } else if (arrayType === "cash_flow") {
                          // if row came from profit_loss, push into cash_flow for persistence
                          newFD.cash_flow = [
                            ...newFD.cash_flow,
                            { ...row, [`FY${year}`]: isNaN(numValue) ? e.target.value : numValue }
                          ];
                          setFinancialData(newFD);
                          setIsFinancialDataEdited(true);
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
        showToast('Customer approved successfully!', 'success');
      } else {
        showToast('Failed to approve.', 'error');
      }
    } catch (err) {
      console.error('Error approving:', err);
      showToast('Error approving.', 'error');
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
        showToast('Customer rejected successfully!', 'success');
      } else {
        showToast('Failed to reject.', 'error');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      showToast('Error rejecting.', 'error');
    }
  };

  // ---------------------------
  // Save handler (unchanged logic, but update original snapshot after success)
  // ---------------------------
  const handleSave = async () => {
    if (!financialData || !data) return;

    try {
      const year = selectedYear;

      // 👇 Pick the current collection
      const targetArr =
        selectedCollection === 'Balance Sheet Summary'
          ? financialData.balance_sheet
          : selectedCollection === 'Profit & Loss Summary'
            ? financialData.profit_loss
            : financialData.cash_flow;

      // Loop through rows of the current table
      for (const row of targetArr) {
        const value = row[`FY${year}`];

        // Skip empty or untouched rows
        if (value === undefined || value === null || value === '') continue;

        await fetch('http://localhost:5000/cq/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: data.customer_name,
            lead_id: data.lead_id,
            item: row.item,
            year,
            value
          })
        });
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
    showToast('Changes discarded.', 'success');
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
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-sm border text-sm ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
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
              ${
                (data.status || 'Pending') === 'Approved'
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
            {financialData && (selectedCollection === 'Balance Sheet Summary'
              ? renderBSTable(financialData.balance_sheet || [])
              : selectedCollection === 'Profit & Loss Summary'
                ? renderPLTable(financialData.profit_loss || [])
                : selectedCollection === 'Cash Flow Summary'
                  ? renderCFTable(financialData.cash_flow || [])
                  : null
            )}

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
