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
            heading: "Non-current assets", children: [
              "Property, plant and equipment",
              "Right-of-use assets",
              "Capital work-in-progress",
              "Goodwill",
              {
                heading: "Financial assets", children: [
                  "Financial assets - Investments (Non-current)",
                  "Financial assets - Loans (Non-current)",
                  "Other financial assets (Non-current)"
                ]
              },
              "Deferred tax assets (net)",
              "Income tax assets (net) (Non-current)",
              "Other non-current assets",
              "Total non-current assets"
            ]
          },
          {
            heading: "Current assets", children: [
              {
                heading: "Financial assets", children: [
                  "Financial assets - Investments (Current)",
                  "Trade receivables",
                  "Cash and cash equivalents",
                  "Financial assets - Loans (Current)",
                  "Other financial assets (Current)"
                ]
              },
              "Income tax assets (net) (Current)",
              "Other current assets",
              "Total current assets"
            ]
          },
          "Total assets"
        ]
      },
      {
        heading: "Equity and liabilities",
        children: [
          {
            heading: "Equity", children: [
              "Equity share capital",
              "Other equity",
              "Total equity"
            ]
          },
          {
            heading: "Liabilities", children: [
              {
                heading: "Non-current liabilities", children: [
                  {
                    heading: "Financial liabilities", children: [
                      "Financial liabilities - Lease liabilities (Non-current)",
                      "Other financial liabilities (Non-current)"
                    ]
                  },
                  "Deferred tax liabilities (net)",
                  "Other non-current liabilities",
                  "Total non-current liabilities"
                ]
              },
              {
                heading: "Current liabilities", children: [
                  {
                    heading: "Financial liabilities", children: [
                      "Financial liabilities - Lease liabilities (Current)",
                      {
                        heading: "Trade payables", children: [
                          "Financial liabilities - Trade payables - Total outstanding dues of micro enterprises and small enterprises",
                          "Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises"
                        ]
                      },
                      "Other financial liabilities (Current)"
                    ]
                  },
                  "Other current liabilities",
                  "Provisions (Current)",
                  "Income tax liabilities (net) (Current)",
                  "Total current liabilities"
                ]
              }
            ]
          },
          "Total equity and liabilities"
        ]
      }
    ];
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Balance Sheet Summary{" "}
            <span className="text-sm font-normal text-gray-500">
              (all amounts in Crores of Rs.)
            </span>
          </h3>
        </div>
        <div className="overflow-auto">
          {renderStructuredTable(data, sections, "balance_sheet")}
        </div>
      </div>
    );
  };



  const renderPLTable = (data: FinancialItem[]) => {
    const firstCardSections = [
      "Revenue from operations",
      "Other income, net",
      "Total income",
      {
        heading: "Expenses",
        children: [
          "Employee benefit expenses",
          "Cost of technical sub-contractors",
          "Travel expenses",
          "Cost of software packages and others",
          "Communication expenses",
          "Consultancy and professional charges",
          "Depreciation and amortization expenses",
          "Finance cost",
          "Other expenses",
          "Total expenses",
        ],
      },
      "Profit before tax",
      {
        heading: "Tax expense",
        children: ["Current tax", "Deferred tax"],
      },
      "Profit for the year",
    ];

    const secondCardSections = [
      {
        heading: "Other comprehensive income",
        children: [
          {
            heading: "Items that will not be reclassified subsequently to profit or loss",
            children: [
              "Remeasurement of the net defined benefit liability / asset, net",
              "Equity instruments through other comprehensive income, net",
            ],
          },
          {
            heading: "Items that will be reclassified subsequently to profit or loss",
            children: [
              "Fair value changes on derivatives designated as cash flow hedge, net",
              "Fair value changes on investments, net (OCI)",
            ],
          },
        ],
      },
      {
        heading: "Total other comprehensive income / (loss), net of tax",
        children: []
      },
      { 
        heading: "Total comprehensive income for the year",
        children: []
      },
      {
        heading: "Earnings per equity share",
        children: [
          {
            heading: "Equity shares of par value ₹5/- each",
            children: [
              "Basic earnings per share (in ₹ per share)",
              "Diluted earnings per share (in ₹ per share)",
            ],
          },
          {
            heading: "Weighted average equity shares used in computing earnings per share",
            children: [
              "Weighted average equity shares used in computing basic earnings per share (in shares)",
              "Weighted average equity shares used in computing diluted earnings per share (in shares)",
            ],
          },
        ],
      },
    ];

    return (
      <div className="space-y-6">
        {/* First Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Profit & Loss Summary{" "}
              <span className="text-sm font-normal text-gray-500">
                (all amounts in Crores of Rs.)
              </span>
            </h3>
          </div>
          <div className="overflow-auto">
            {renderStructuredTable(data, firstCardSections, 'profit_loss')}
          </div>
        </div>

        {/* Second Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Profit & Loss Summary (contd.){" "}
              <span className="text-sm font-normal text-gray-500">
                (all amounts in Crores of Rs.)
              </span>
            </h3>
          </div>
          <div className="overflow-auto">
            {renderStructuredTable(data, secondCardSections, 'profit_loss')}
          </div>
        </div>
      </div>
    );
  };


  const renderCFTable = (data: FinancialItem[]) => {
    const sections = [
      {
        heading: "Cash Flow from Operating Activities",
        children: [
          "Profit for the year",
          {
            heading: "Adjustments to reconcile net profit to net cash provided by operating activities:",
            children: [
              "Depreciation and Amortization",
              "Income tax expense",
              "Impairment loss recognized / (reversed) under expected credit loss model",
              "Finance cost",
              "Interest and dividend income",
              "Stock compensation expense",
              "Provision for post-sale client support",
              "Exchange differences on translation of assets and liabilities, net",
              "Interest receivable on income tax refund",
              "Other adjustments",
            ],
          },
          {
            heading: "Changes in assets and liabilities",
            children: [
              "Trade receivables and unbilled revenue",
              "Loans, other financial assets and other assets",
              "Trade payables",
              "Other financial liabilities, other liabilities and provisions",
            ],
          },
          "Cash generated from operations",
          "Income taxes paid",
          "Net cash generated by operating activities",
        ],
      },
      {
        heading: "Cash Flow from Investing Activities",
        children: [
          "Expenditure on property, plant and equipment",
          "Deposits placed with corporation",
          "Redemption of deposits placed with corporation",
          "Interest and dividend received",
          "Dividend received from subsidiary",
          "Loan given to subsidiaries",
          "Loan repaid by subsidiaries",
          "Investment in subsidiaries",
          "Payment towards acquisition of entities",
          "Receipt / (payment) towards business transfer for entities under common control",
          "Receipt / (payment) from entities under liquidation",
          "Other receipts",
          {
            heading: "Payments to acquire investments",
            children: [
              "Payments to acquire investments - Liquid mutual fund units",
              "Payments to acquire investments - Commercial papers",
              "Payments to acquire investments - Certificates of deposit",
              "Payments to acquire investments - Non-convertible debentures",
              "Payments to acquire investments - Other investments",
            ],
          },
          {
            heading: "Proceeds on sale of investments",
            children: [
              "Proceeds on sale of investments - Tax-free bonds and government bonds",
              "Proceeds on sale of investments - Liquid mutual fund units",
              "Proceeds on sale of investments - Non-convertible debentures",
              "Proceeds on sale of investments - Certificates of deposit",
              "Proceeds on sale of investments - Commercial papers",
              "Proceeds on sale of investments - Government securities",
              "Proceeds on sale of investments - Other investments",
            ],
          },
          "Net cash used in investing activities",
        ],
      },
      {
        heading: "Cash Flow from Financing Activities",
        children: [
          "Payment of lease liabilities",
          "Shares issued on exercise of employee stock options",
          "Other payments",
          "Payment of dividends",
          "Net cash used in financing activities",
          "Net increase / (decrease) in cash and cash equivalents",
          "Effect of exchange differences on translation of foreign currency cash and cash equivalents",
          "Cash and cash equivalents at the beginning of the year",
          "Cash and cash equivalents at the end of the year",
        ],
      },
      {
        heading: "Supplementary information",
        children: ["Restricted cash balance"],
      },
    ];
    console.log('Cash Flow data:', data);
    console.log('Cash Flow sections:', sections);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Cash Flow Summary{" "}
            <span className="text-sm font-normal text-gray-500">
              (all amounts in Crores of Rs.)
            </span>
          </h3>
        </div>
        <div className="overflow-auto">
          {renderStructuredTable(data, sections, 'cash_flow')}
        </div>
      </div>
    );
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
          if (!row) {
            console.log('Item not found in data:', item, 'Available items:', data.map(d => d.item));
            return null;
          }
          
          // Check for specific P&L items that should be blue and bold
          const isBlueTotal = row.item === "Total income" || row.item === "Total expenses";
          // Check for specific Cash Flow items that should be blue and bold
          const isBlueCashFlow = row.item === "Cash generated from operations";
          // Check for items that should be bold but not blue
          const isBold = isBlueTotal || isBlueCashFlow || (
            /(total|net)/i.test(row.item) &&
            !/Cash and cash equivalents at the beginning of the year/i.test(row.item) &&
            !isBlueTotal &&
            !isBlueCashFlow
          );

          // Check for items that should be red (main profit lines and cash flow summary items)
          const isRedItem = row.item === "Profit before tax" || 
                           row.item === "Profit for the year" ||
                           row.item === "Net increase / (decrease) in cash and cash equivalents" ||
                           row.item === "Cash and cash equivalents at the end of the year";
          
          // Check if this item should be indented (children of sections)
          const isIndented = (
            // P&L items
            (arrayType === 'profit_loss' && (
              row.item === "Employee benefit expenses" ||
              row.item === "Cost of technical sub-contractors" ||
              row.item === "Travel expenses" ||
              row.item === "Cost of software packages and others" ||
              row.item === "Communication expenses" ||
              row.item === "Consultancy and professional charges" ||
              row.item === "Depreciation and amortization expenses" ||
              row.item === "Finance cost" ||
              row.item === "Other expenses" ||
              row.item === "Current tax" ||
              row.item === "Deferred tax"
            )) ||
            // Cash Flow items
            (arrayType === 'cash_flow' && (
              row.item === "Depreciation and Amortization" ||
              row.item === "Income tax expense" ||
              row.item === "Impairment loss recognized / (reversed) under expected credit loss model" ||
              row.item === "Finance cost" ||
              row.item === "Interest and dividend income" ||
              row.item === "Stock compensation expense" ||
              row.item === "Provision for post-sale client support" ||
              row.item === "Exchange differences on translation of assets and liabilities, net" ||
              row.item === "Interest receivable on income tax refund" ||
              row.item === "Other adjustments" ||
              row.item === "Trade receivables and unbilled revenue" ||
              row.item === "Loans, other financial assets and other assets" ||
              row.item === "Trade payables" ||
              row.item === "Other financial liabilities, other liabilities and provisions" ||
              row.item === "Payments to acquire investments - Liquid mutual fund units" ||
              row.item === "Payments to acquire investments - Commercial papers" ||
              row.item === "Payments to acquire investments - Certificates of deposit" ||
              row.item === "Payments to acquire investments - Non-convertible debentures" ||
              row.item === "Payments to acquire investments - Other investments" ||
              row.item === "Proceeds on sale of investments - Tax-free bonds and government bonds" ||
              row.item === "Proceeds on sale of investments - Liquid mutual fund units" ||
              row.item === "Proceeds on sale of investments - Non-convertible debentures" ||
              row.item === "Proceeds on sale of investments - Certificates of deposit" ||
              row.item === "Proceeds on sale of investments - Commercial papers" ||
              row.item === "Proceeds on sale of investments - Government securities" ||
              row.item === "Proceeds on sale of investments - Other investments" ||
              row.item === "Restricted cash balance"
            ))
          );

          return (
            <tr key={row._id || idx} className={`hover:bg-gray-50 ${isBlueTotal || isBlueCashFlow ? "bg-blue-50" : isRedItem ? "bg-red-50" : ""}`}>
              <td
                className={`px-4 py-3 text-sm border-b ${
                  isBlueTotal || isBlueCashFlow ? "font-semibold text-blue-900" : 
                  isRedItem ? "font-semibold text-red-900" :
                  isBold ? "font-semibold text-gray-900" : 
                  "font-medium text-gray-900"
                } text-left`}
                style={{ paddingLeft: isIndented ? '2rem' : '1rem' }}
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
        const isRedHeading = [
          "Assets",
          "Equity and liabilities",
          "Cash Flow from Operating Activities",
          "Cash Flow from Investing Activities", 
          "Cash Flow from Financing Activities",
          "Other comprehensive income",
          "Total other comprehensive income / (loss), net of tax",
          "Total comprehensive income for the year",
          "Earnings per equity share"
        ].includes(item.heading);
        
        const isBlueHeading = [
          "Expenses",
          "Tax expense",
          "Items that will not be reclassified subsequently to profit or loss",
          "Items that will not be reclassified subsequently to profit or loss",
          "Equity shares of par value ₹5/- each",
          "Weighted average equity shares used in computing earnings per share",
          "Adjustments to reconcile net profit to net cash provided by operating activities:",
          "Changes in assets and liabilities",
          "Cash generated from operations"
        ].includes(item.heading);
        
        return (
          <React.Fragment key={item.heading}>
            <tr className={isRedHeading ? "bg-red-50" : isBlueHeading ? "bg-blue-50" : "bg-gray-50"}>
              <td
                colSpan={yearArray.length + 1}
                className={`px-4 py-2 text-sm font-semibold text-left ${
                  isRedHeading ? "text-red-900" : isBlueHeading ? "text-blue-900" : "text-gray-900"
                }`}
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
                {/* <span className="text-xs font-normal text-gray-400 normal-case">
                  (all amounts in Crores of Rs.)
                </span> */}
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
