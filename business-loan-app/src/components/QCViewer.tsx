import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
  const [isEditing, setIsEditing] = useState(false);

  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isFinancialDataEdited, setIsFinancialDataEdited] = useState(false);

  const collections = ['Balance Sheet Summary', 'Profit & Loss Summary', 'Cash Flow Summary'];
  const years = ['2023', '2024', '2025'];

  const financialDataDependencies = useMemo(() => [selectedCollection, id, data, selectedYear], [selectedCollection, id, data, selectedYear]);

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

  const generateDummyValue = (itemName: string, documentType: string, year: number): number => {
    const baseValue = 50000;
    const yearMultiplier = 1 + (year - 2022) * 0.15;

    let itemMultiplier = 1;
    if (documentType === 'balance_sheet') {
      if (itemName.includes('Assets')) itemMultiplier = 2.5;
      else if (itemName.includes('Equity')) itemMultiplier = 1.8;
      else if (itemName.includes('Debt')) itemMultiplier = 0.8;
      else if (itemName.includes('Liabilities')) itemMultiplier = 1.2;
      else if (itemName.includes('Receivables')) itemMultiplier = 0.6;
      else if (itemName.includes('Payables')) itemMultiplier = 0.4;
    } else if (documentType === 'profit_loss') {
      if (itemName.includes('Revenue') || itemName.includes('Sales')) itemMultiplier = 3.0;
      else if (itemName.includes('Profit')) itemMultiplier = 1.5;
      else if (itemName.includes('Expense')) itemMultiplier = 0.7;
      else if (itemName.includes('Depreciation')) itemMultiplier = 0.3;
    } else if (documentType === 'cash_flow') {
      if (itemName.includes('Principal')) itemMultiplier = 0.2;
    }

    return Math.round(baseValue * itemMultiplier * yearMultiplier);
  };

  // Fetch CQ entry
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/cq/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((entry: QCEntry) => {
        setData(entry);
        if (entry.documents?.length > 0) {
          setTextValue(extractedDataToText(entry.documents[0].extracted_data));
        } else {
          setTextValue('');
        }
      })
      .catch((err) => {
        console.error('Failed to load customer data:', err);
        setData(null);
      });
  }, [id]);

  // Fetch selected collection
  useEffect(() => {
    if (!selectedCollection || !id || !data || !selectedYear) return;

    fetch(`http://localhost:5000/analysis/`)
      .then((res) => res.json())
      .then((analysisEntries) => {
        const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.lead_id === data.lead_id);
        if (!matchingEntry) {
          setTextValue('No financial analysis data found for this lead.');
          return;
        }
        return fetch(`http://localhost:5000/analysis/${matchingEntry._id}?year=${selectedYear}`);
      })
      .then((res) => res?.json())
      .then((data) => {
        if (!data) return;

        const dataWithDummyValues = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? generateDummyValue(item.item, 'balance_sheet', 2023),
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? generateDummyValue(item.item, 'profit_loss', 2023),
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? generateDummyValue(item.item, 'cash_flow', 2023),
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          }))
        };
        setFinancialData(dataWithDummyValues);

        let selectedData: FinancialItem[] = [];
        switch (selectedCollection) {
          case 'Balance Sheet Summary':
            selectedData = dataWithDummyValues.balance_sheet || [];
            break;
          case 'Profit & Loss Summary':
            selectedData = dataWithDummyValues.profit_loss || [];
            break;
          case 'Cash Flow Summary':
            selectedData = dataWithDummyValues.cash_flow || [];
            break;
          default:
            selectedData = [];
        }

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

  const handleSave = async () => {
    if (!data) return;
    try {
      const parsed = textToExtractedData(textValue);
      const newData = { ...data };
      if (newData.documents.length > 0) {
        newData.documents[0].extracted_data = parsed;
      }

      // 🔹 Persist to backend
      const res = await fetch(`http://localhost:5000/cq/${data._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });

      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        alert('Extracted data saved successfully!');
      } else {
        alert('Failed to save extracted data.');
      }
    } catch (err) {
      console.error('Error saving extracted data:', err);
      alert('Error saving extracted data.');
    } finally {
      setIsEditing(false);
    }
  };


  const handleSaveFinancialData = async () => {
    if (!financialData || !data) return;
    try {
      const analysisResponse = await fetch(`http://localhost:5000/analysis/`);
      const analysisEntries = await analysisResponse.json();
      const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.lead_id === data.lead_id);
      if (!matchingEntry) {
        alert('No matching analysis entry found to save changes.');
        return;
      }

      // 🔹 Transform FY fields into backend format
      const transformItems = (items: FinancialItem[]) =>
        items.map(({ _id, item, FY2023, FY2024, FY2025, ...rest }) => ({
          _id,
          item,
          value_2023: FY2023 ?? null,
          value_2024: FY2024 ?? null,
          value_2025: FY2025 ?? null,
          ...rest,
        }));

      const payload = {
        balance_sheet: transformItems(financialData.balance_sheet),
        profit_loss: transformItems(financialData.profit_loss),
        cash_flow: transformItems(financialData.cash_flow),
      };

      const response = await fetch(
        `http://localhost:5000/analysis/${matchingEntry._id}?year=${selectedYear}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert('Financial data saved successfully!');
        setIsFinancialDataEdited(false);
      } else {
        alert('Failed to save financial data.');
      }
    } catch (error) {
      console.error('Error saving financial data:', error);
      alert('Error saving financial data.');
    }
  };


  // 🔹 Approve/Decline
  const handleApprove = async () => {
    if (!data) return;
    try {
      const res = await fetch(`http://localhost:5000/cq/${data._id}/approve`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setData(updated.record);
        alert('Customer approved successfully!');
      } else {
        alert('Failed to approve.');
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('Error approving.');
    }
  };

  const handleDecline = async () => {
    if (!data) return;
    try {
      const res = await fetch(`http://localhost:5000/cq/${data._id}/reject`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setData(updated.record);
        alert('Customer rejected successfully!');
      } else {
        alert('Failed to reject.');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Error rejecting.');
    }
  };

  // 🔹 Utility for editing cells
  const renderEditableRow = (row: FinancialItem, index: number, yearArray: string[], arrayType: keyof FinancialData) => {
    return (
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
                targetArr[index][`FY${year}`] = isNaN(numValue) ? e.target.value : numValue;
                newFD[arrayType] = targetArr;
                setFinancialData(newFD);
                setIsFinancialDataEdited(true);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              style={{
                color: (() => {
                  const val = row[`FY${year}`];
                  if (val === null || val === undefined) return '#111827';
                  if (typeof val === 'string') {
                    if (val.startsWith('(') && val.endsWith(')')) return '#ef4444';
                    const numVal = Number(val);
                    if (!isNaN(numVal)) return numVal < 0 ? '#ef4444' : '#111827';
                    return '#111827';
                  }
                  const numVal = Number(val);
                  return isNaN(numVal) ? '#111827' : numVal < 0 ? '#ef4444' : '#111827';
                })()
              }}
              placeholder="-"
            />
          </td>
        ))}
      </tr>
    );
  };

  // 🔹 Specialized renderers
  const renderBSTable = (data: FinancialItem[]) => {
    const sections = [
      {
        heading: "Assets",
        children: [
          {
            heading: "Non-current assets",
            children: [
              "Property, plant and equipment",
              "Right-of-use assets",
              "Capital work-in-progress",
              "Goodwill",
              "Investments (Non-current)",
              "Loans (Non-current)",
              "Other financial assets (Non-current)",
              "Deferred tax assets (net)",
              "Income tax assets (net) (Non-current)",
              "Other non-current assets",
              "Total non-current assets",
            ],
          },
          {
            heading: "Current assets",
            children: [
              "Investments (Current)",
              "Trade receivables",
              "Cash and cash equivalents",
              "Loans (Current)",
              "Other financial assets (Current)",
              "Income tax assets (net) (Current)",
              "Other current assets",
              "Total current assets",
            ],
          },
          "Total assets",
        ],
      },
      {
        heading: "Equity",
        children: ["Equity share capital", "Other equity", "Total equity"],
      },
      {
        heading: "Liabilities",
        children: [
          {
            heading: "Non-current liabilities",
            children: [
              "Lease liabilities (Non-current)",
              "Other financial liabilities (Non-current)",
              "Deferred tax liabilities (net)",
              "Other non-current liabilities",
              "Total non-current liabilities",
            ],
          },
          {
            heading: "Current liabilities",
            children: [
              "Lease liabilities (Current)",
              "Total outstanding dues of micro enterprises and small enterprises",
              "Total outstanding dues of creditors other than micro enterprises and small enterprises",
              "Other financial liabilities (Current)",
              "Other current liabilities",
              "Provisions (Current)",
              "Income tax liabilities (net)",
              "Total current liabilities",
            ],
          },
          "Total equity and liabilities",
        ],
      },
    ];
    return renderStructuredTable(data, sections, "balance_sheet");
  };



  const renderPLTable = (data: FinancialItem[]) => {
    const sections = [
      {
        heading: 'Income', children: [
          'Revenue from operations',
          'Other income, net',
          'Total income'
        ]
      },
      {
        heading: 'Expenses', children: [
          'Employee benefit expenses',
          'Cost of technical sub-contractors',
          'Travel expenses',
          'Cost of software packages and others',
          'Communication expenses',
          'Consultancy and professional charges',
          'Depreciation and amortization expenses',
          'Finance cost',
          'Other expenses',
          'Total expenses'
        ]
      },
      {
        heading: 'Profit before Tax', children: [
          'Profit before tax'
        ]
      },
      {
        heading: 'Tax Expense', children: [
          'Current tax',
          'Deferred tax'
        ]
      },
      {
        heading: 'Profit for the Year', children: [
          'Profit for the year'
        ]
      },
      {
        heading: 'Other Comprehensive Income', children: [
          'Remeasurement of the net defined benefit liability / asset, net',
          'Equity instruments through other comprehensive income, net',
          'Fair value changes on derivatives designated as cash flow hedge, net',
          'Fair value changes on investments, net',
          'Total other comprehensive income / (loss), net of tax'
        ]
      },
      {
        heading: 'Total Comprehensive Income', children: [
          'Total comprehensive income for the year'
        ]
      },
      {
        heading: 'Earnings per Equity Share', children: [
          'Earnings per equity share - Basic (in ₹ per share)',
          'Earnings per equity share - Diluted (in ₹ per share)'
        ]
      },
      {
        heading: 'Weighted Average Equity Shares', children: [
          'Weighted average equity shares used in computing earnings per equity share - Basic (in shares)',
          'Weighted average equity shares used in computing earnings per equity share - Diluted (in shares)'
        ]
      }
    ];
    return renderStructuredTable(data, sections, 'profit_loss');
  };


  const renderCFTable = (data: FinancialItem[]) => {
    const sections = [
      {
        heading: 'Cash flow from operating activities', children: [
          'Profit for the year',
          'Depreciation and Amortization',
          'Income tax expense',
          'Impairment loss recognized / (reversed) under expected credit loss model',
          'Finance cost',
          'Interest and dividend income',
          'Stock compensation expense',
          'Provision for post-sale client support',
          'Exchange differences on translation of assets and liabilities, net',
          'Interest receivable on income tax refund',
          'Other adjustments',
          'Trade receivables and unbilled revenue',
          'Loans, other financial assets and other assets',
          'Trade payables',
          'Other financial liabilities, other liabilities and provisions',
          'Cash generated from operations',
          'Income taxes paid',
          'Net cash generated by operating activities'
        ]
      },
      {
        heading: 'Cash flow from investing activities', children: [
          'Expenditure on property, plant and equipment',
          'Deposits placed with corporation',
          'Redemption of deposits placed with corporation',
          'Interest and dividend received',
          'Dividend received from subsidiary',
          'Loan given to subsidiaries',
          'Loan repaid by subsidiaries',
          'Investment in subsidiaries',
          'Payment towards acquisition of entities',
          'Receipt / (payment) towards business transfer for entities under common control',
          'Receipt / (payment) from entities under liquidation',
          'Other receipts',
          'Payments to acquire investments - Liquid mutual fund units',
          'Payments to acquire investments - Commercial papers',
          'Payments to acquire investments - Certificates of deposit',
          'Payments to acquire investments - Non-convertible debentures',
          'Payments to acquire investments - Other investments',
          'Proceeds on sale of investments - Tax-free bonds and government bonds',
          'Proceeds on sale of investments - Liquid mutual fund units',
          'Proceeds on sale of investments - Non-convertible debentures',
          'Proceeds on sale of investments - Certificates of deposit',
          'Proceeds on sale of investments - Commercial papers',
          'Proceeds on sale of investments - Government securities',
          'Proceeds on sale of investments - Other investments',
          'Net cash used in investing activities'
        ]
      },
      {
        heading: 'Cash flow from financing activities', children: [
          'Payment of lease liabilities',
          'Shares issued on exercise of employee stock options',
          'Other payments',
          'Payment of dividends',
          'Net cash used in financing activities',
          'Net increase / (decrease) in cash and cash equivalents',
          'Effect of exchange differences on translation of foreign currency cash and cash equivalents',
          'Cash and cash equivalents at the beginning of the year',
          'Cash and cash equivalents at the end of the year'
        ]
      },
      { heading: 'Supplementary information', children: ['Restricted cash balance'] }
    ];
    return renderStructuredTable(data, sections, 'cash_flow');
  };


  // 🔹 Reusable structured table renderer
  const renderStructuredTable = (
    data: FinancialItem[],
    sections: (string | { heading: string; children: any[] })[],
    arrayType: keyof FinancialData
  ) => {
    const yearArray = selectedYear ? [selectedYear] : [];

    const renderRows = (items: (string | { heading: string; children: any[] })[]) => {
      return items.map((item, idx) => {
        if (typeof item === "string") {
          const row = data.find((d) => d.item === item);
          if (!row) return null;
          const isBold =
            /(total|net)/i.test(row.item) &&
            !/Cash and cash equivalents at the beginning of the year/i.test(row.item);

          return (
            <tr key={row._id || idx} className="hover:bg-gray-50">
              <td
                className={`px-4 py-3 text-sm border-b ${isBold ? "font-semibold text-gray-900" : "font-medium text-gray-900"
                  } text-left`}
              >
                {row.item}
              </td>
              {yearArray.map((year) => (
                <td key={year} className="px-4 py-3 text-sm border-b text-right">
                  <input
                    type="text"
                    value={row[`FY${year}`] ?? ""}
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
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    style={{
                      color: (() => {
                        const val = row[`FY${year}`];
                        if (val === null || val === undefined) return "#111827";
                        if (typeof val === "string") {
                          if (val.startsWith("(") && val.endsWith(")"))
                            return "#ef4444";
                          const numVal = Number(val);
                          if (!isNaN(numVal)) return numVal < 0 ? "#ef4444" : "#111827";
                          return "#111827";
                        }
                        const numVal = Number(val);
                        return isNaN(numVal)
                          ? "#111827"
                          : numVal < 0
                            ? "#ef4444"
                            : "#111827";
                      })(),
                    }}
                    placeholder="-"
                  />
                </td>
              ))}
            </tr>
          );
        }

        // 🔹 Nested heading
        return (
          <React.Fragment key={item.heading}>
            <tr className="bg-blue-50">
              <td
                colSpan={yearArray.length + 1}
                className="px-4 py-2 text-sm font-semibold text-blue-900 text-left"
              >
                {item.heading}
              </td>
            </tr>
            {renderRows(item.children)}
          </React.Fragment>
        );
      });
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                <span className="text-xs font-normal text-gray-400 normal-case">
                  (all amounts in Crores of Rs.)
                </span>
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
            {renderRows(sections)}
          </tbody>
        </table>
      </div>
    );
  };


  if (!data) return <div className="p-4">Loading customer data...</div>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate('/qc')}
        className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
      >
        ← Back to QC Table
      </button>

      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
        <p><strong>Customer Name:</strong> {data.customer_name ?? '-'}</p>
        <p><strong>Lead ID:</strong> {data.lead_id ?? '-'}</p>
        <p><strong>Status:</strong> {data.status ?? 'Pending'}</p>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <label className="block mb-2 font-medium">Select the type of financial document:</label>
          <select
            className="border p-2 rounded w-full max-w-md"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
          >
            <option value="" disabled>Choose the document</option>
            {collections.map((col) => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2 font-medium">Select a year:</label>
          <select
            className="border p-2 rounded w-full max-w-md"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>

      <div>
        {selectedCollection ? (
          <div className="mt-4">
            {financialData &&
              (selectedCollection === 'Balance Sheet Summary'
                ? renderBSTable(financialData.balance_sheet || [])
                : selectedCollection === 'Profit & Loss Summary'
                  ? renderPLTable(financialData.profit_loss || [])
                  : selectedCollection === 'Cash Flow Summary'
                    ? renderCFTable(financialData.cash_flow || [])
                    : null)}
            <div className="mt-4 flex gap-2">
              <button
                onClick={async () => {
                  if (!financialData || !data) return;
                  try {
                    const analysisResponse = await fetch(`http://localhost:5000/analysis/`);
                    const analysisEntries = await analysisResponse.json();
                    const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.lead_id === data.lead_id);
                    if (!matchingEntry) {
                      alert('No matching analysis entry found to save changes.');
                      return;
                    }
                    const response = await fetch(`http://localhost:5000/analysis/${matchingEntry._id}?year=${selectedYear}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(financialData),
                    });
                    if (response.ok) {
                      alert('Financial data saved successfully!');
                      setIsFinancialDataEdited(false); // 🔹 reset state
                    } else {
                      alert('Failed to save financial data.');
                    }
                  } catch (error) {
                    console.error('Error saving financial data:', error);
                    alert('Error saving financial data.');
                  }
                }}
                className={`px-4 py-2 rounded transition-colors ${isFinancialDataEdited
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                disabled={!isFinancialDataEdited}
              >
                {isFinancialDataEdited ? 'Save Changes' : 'No Changes to Save'}
              </button>
            </div>

          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Please select a document type to view the extracted data.
          </div>
        )}
      </div>

      {selectedCollection && (
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={handleDecline}
            className="text-white px-4 py-2 rounded hover:opacity-90"
            style={{ backgroundColor: '#00306E' }}
          >
            Decline
          </button>
          <button
            onClick={handleApprove}
            className="text-white px-4 py-2 rounded hover:opacity-90"
            style={{ backgroundColor: '#0266F4' }}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

export default QCViewer;
