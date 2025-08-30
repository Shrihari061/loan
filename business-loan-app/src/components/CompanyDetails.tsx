import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ added useNavigate
import CompanyRatioAnalysis from './CompanyRatioAnalysis';

interface FinancialItem {
  _id: string;
  item: string;
  FY2023: number | null;
  FY2024: number | null;
  FY2025: number | null;
}

interface CompanyData {
  _id: string;
  company_name: string;
  lead_id: string;
  net_worth: number | string;
  debt_to_equity: number | string;
  dscr: number | string;
  year_range: string;
  ratio_health: string;
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
}

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // ✅ added navigate
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'ratio'>('source');
  const [selectedDocument, setSelectedDocument] = useState<'balance_sheet' | 'profit_loss' | 'cash_flow'>('balance_sheet');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Financial document types
  const financialDocuments = [
    { key: 'balance_sheet', name: 'Balance Sheet Data', icon: '📊' },
    { key: 'profit_loss', name: 'P&L Data', icon: '📈' },
    { key: 'cash_flow', name: 'Cash Flow Data', icon: '💰' }
  ];

  // Fetch company details
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`http://localhost:5000/analysis/${id}?year=${selectedYear}`);
        const data = await res.json();

        // Add dummy values to the financial data for display
        const dataWithDummyValues = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 || generateDummyValue(item.item, 'balance_sheet', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'balance_sheet', 2024)
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 || generateDummyValue(item.item, 'profit_loss', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'profit_loss', 2024)
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 || generateDummyValue(item.item, 'cash_flow', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'cash_flow', 2024)
          }))
        };

        setCompany(dataWithDummyValues);
      } catch (error) {
        console.error('Failed to fetch company data:', error);
      }
    };
    fetchCompany();
  }, [id, selectedYear]);

  const formatValue = (value: number | string | null) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    const numValue = Number(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN');
  };

  const getValueColor = (value: number | string | null) => {
    if (value === null || value === undefined) return '#111827';

    if (typeof value === 'string') {
      if (value.startsWith('(') && value.endsWith(')')) {
        return '#ef4444'; // Red for negative values in parentheses
      }
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue < 0 ? '#ef4444' : '#111827';
      }
      return '#111827';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return '#111827';
    return numValue < 0 ? '#ef4444' : '#111827';
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

  const getRiskColor = (health: string | undefined) => {
    if (!health) return '#6b7280';
    switch (health.toLowerCase()) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'moderate': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderFinancialTable = (title: string, data: FinancialItem[], headings: string[] = []) => {
    if (!data || data.length === 0) return null;

    return (
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {title} <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>(all amounts in Crores of Rs.)</span>
          </h3>
        </div>

        {/* Table Content */}
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Item</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>FY2023</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>FY2024</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>FY2025</th>
              </tr>
            </thead>
            <tbody>
              {headings.map((heading, i) => (
                <tr key={`heading-${i}`} style={{ backgroundColor: '#f1f5f9', fontWeight: 600 }}>
                  <td colSpan={4} style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    {heading}
                  </td>
                </tr>
              ))}
              {data.map((row, index) => {
                const isTotal = ['Total income', 'Total expenses', 'Profit before tax', 'Profit for the year', 'Total comprehensive income for the year'].includes(row.item);
                return (
                  <tr key={row._id} style={{ backgroundColor: isTotal ? '#f1f5f9' : index % 2 === 0 ? '#fff' : '#f9fafb', fontWeight: isTotal ? 600 : 400 }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'left', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                      {row.item}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: getValueColor(row.FY2023), textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{formatValue(row.FY2023)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: getValueColor(row.FY2024), textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{formatValue(row.FY2024)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: getValueColor(row.FY2025), textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{formatValue(row.FY2025)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPLTable = (data: FinancialItem[]) => {
    if (!data || data.length === 0) return null;

    const renderRow = (row: FinancialItem, index: number, isTotal = false) => (
      <tr
        key={row._id || `${row.item}-${index}`}
        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isTotal ? "font-semibold" : ""}`}
      >
        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
          {row.item}
        </td>
        <td className="px-4 py-3 text-sm text-right border-b border-gray-100 text-gray-900" style={{ color: getValueColor(row.FY2023) }}>
          {formatValue(row.FY2023)}
        </td>
        <td className="px-4 py-3 text-sm text-right border-b border-gray-100 text-gray-900" style={{ color: getValueColor(row.FY2024) }}>
          {formatValue(row.FY2024)}
        </td>
        <td className="px-4 py-3 text-sm text-right border-b border-gray-100 text-gray-900" style={{ color: getValueColor(row.FY2025) }}>
          {formatValue(row.FY2025)}
        </td>
      </tr>
    );

    const renderHeading = (label: string) => (
      <tr key={label} className="bg-blue-50 font-semibold">
        <td colSpan={4} className="px-4 py-3 text-sm text-blue-900 border-b border-gray-100">
          {label}
        </td>
      </tr>
    );


    const firstCardSections = [
      {
        heading: "Income",
        children: ["Revenue from operations", "Other income, net", "Total income"],
      },
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
      { heading: null, children: ["Profit before tax"] },
      {
        heading: "Tax expense",
        children: ["Current tax", "Deferred tax"],
      },
      { heading: null, children: ["Profit for the year"] },
    ];

    const secondCardSections = [
      {
        heading: "Other comprehensive income",
        children: [
          "Remeasurement of the net defined benefit liability / asset, net",
          "Equity instruments through other comprehensive income, net",
          "Fair value changes on derivatives designated as cash flow hedge, net",
          "Fair value changes on investments, net",
          "Total other comprehensive income / (loss), net of tax",
        ],
      },
      { heading: null, children: ["Total comprehensive income for the year"] },
      {
        heading: "Earnings per equity share",
        children: [
          "Basic earnings per share (in ₹ per share)",
          "Diluted earnings per share (in ₹ per share)",
          "Weighted average equity shares used in computing basic earnings per share (in shares)",
          "Weighted average equity shares used in computing diluted earnings per share (in shares)",
        ],
      },
    ];


    const renderCard = (title: string, sections: any[]) => (
      <div className="bg-white rounded-lg shadow overflow-hidden mt-6 first:mt-0">
        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            {title}{" "}
            <span className="text-sm font-normal text-gray-500">
              (all amounts in Crores of Rs.)
            </span>
          </h3>
        </div>
        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Item
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  FY2023
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  FY2024
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  FY2025
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, sIndex) => (
                <React.Fragment key={sIndex}>
                  {section.heading && renderHeading(section.heading)}
                  {section.children.map((child: string, i: number) => {
                    const row = data.find((r) => r.item === child);
                    return row
                      ? renderRow(
                        row,
                        i,
                        [
                          "Total income",
                          "Total expenses",
                          "Profit before tax",
                          "Profit for the year",
                          "Total comprehensive income for the year",
                        ].includes(row.item)
                      )
                      : null;
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    return (
      <>
        {renderCard("Profit & Loss Summary", firstCardSections)}
        {renderCard("Profit & Loss Summary (contd.)", secondCardSections)}
      </>
    );
  };



  const renderBSTable = (data: FinancialItem[]) => {
    if (!data || data.length === 0) return null;

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
                      "Financial liabilities - Trade payables - Total outstanding dues of micro enterprises and small enterprises",
                      "Financial liabilities - Trade payables - Total outstanding dues of creditors other than micro enterprises and small enterprises",
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

    const renderRows = (items: (string | { heading: string; children: any[] })[]) => {
      return items.map((item) => {
        if (typeof item === "string") {
          const row = data.find((r) => r.item === item);
          if (!row) return null;

          const isTotal = row.item.toLowerCase().startsWith("total");

          return (
            <tr key={row.item} className={`${isTotal ? "font-semibold" : ""}`}>
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                {row.item}
              </td>
              <td
                className="px-4 py-3 text-sm text-right border-b border-gray-100 text-gray-900"
                style={{ color: getValueColor(row.FY2023) }}
              >
                {formatValue(row.FY2023)}
              </td>
              <td
                className="px-4 py-3 text-sm text-right border-b border-gray-100 text-gray-900"
                style={{ color: getValueColor(row.FY2024) }}
              >
                {formatValue(row.FY2024)}
              </td>
              <td
                className="px-4 py-3 text-sm text-right border-b border-gray-100 text-gray-900"
                style={{ color: getValueColor(row.FY2025) }}
              >
                {formatValue(row.FY2025)}
              </td>
            </tr>
          );
        }

        // Heading row
        return (
          <React.Fragment key={item.heading}>
            <tr className="bg-blue-50 font-semibold">
              <td colSpan={4} className="px-4 py-3 text-sm text-blue-900 border-b border-gray-100">
                {item.heading}
              </td>
            </tr>
            {renderRows(item.children)}
          </React.Fragment>
        );
      });
    };

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Balance Sheet Summary{" "}
            <span className="text-sm font-normal text-gray-500">
              (all amounts in Crores of Rs.)
            </span>
          </h3>
        </div>

        {/* Table Content */}
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Item</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">FY2023</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">FY2024</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">FY2025</th>
              </tr>
            </thead>
            <tbody>{renderRows(sections)}</tbody>
          </table>
        </div>
      </div>
    );
  };


  const renderCFTable = (data: FinancialItem[]) => {
    if (!data || data.length === 0) return null;

    // Sections and sub-items exactly as per your document
    const sections = [
      {
        heading: "Cash Flow from Operating Activities",
        children: [
          "Profit for the year",
          "Depreciation and Amortization",
          "Income tax expense",
          "Impairment loss recognized / (reversed) under expected credit loss model",
          "Interest and dividend income",
          "Stock compensation expense",
          "Provision for post-sale client support",
          "Exchange differences on translation of assets and liabilities, net",
          "Interest receivable on income tax refund",
          "Other adjustments",
          "Trade receivables and unbilled revenue",
          "Loans, other financial assets and other assets",
          "Trade payables",
          "Other financial liabilities, other liabilities and provisions",
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
          "Payments to acquire investments - Liquid mutual fund units",
          "Payments to acquire investments - Commercial papers",
          "Payments to acquire investments - Certificates of deposit",
          "Payments to acquire investments - Non-convertible debentures",
          "Payments to acquire investments - Other investments",
          "Proceeds on sale of investments - Tax-free bonds and government bonds",
          "Proceeds on sale of investments - Liquid mutual fund units",
          "Proceeds on sale of investments - Non-convertible debentures",
          "Proceeds on sale of investments - Certificates of deposit",
          "Proceeds on sale of investments - Commercial papers",
          "Proceeds on sale of investments - Government securities",
          "Proceeds on sale of investments - Other investments",
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

    // Recursive row rendering
    const renderRows = (items: (string | { heading: string; children: any[] })[]) => {
      return items.map((item) => {
        if (typeof item === "string") {
          const row = data.find((r) => r.item === item);
          if (!row) return null;

          const isTotal =
            (row.item.toLowerCase().startsWith("net") ||
              row.item.toLowerCase().startsWith("cash and cash equivalents")) &&
            row.item !== "Cash and cash equivalents at the beginning of the year";

          return (
            <tr key={row.item} className={`${isTotal ? "font-semibold" : ""}`}>
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 text-left">
                {row.item}
              </td>
              <td
                className="px-4 py-3 text-sm text-right border-b border-gray-100"
                style={{ color: getValueColor(row.FY2023) }}
              >
                {formatValue(row.FY2023)}
              </td>
              <td
                className="px-4 py-3 text-sm text-right border-b border-gray-100"
                style={{ color: getValueColor(row.FY2024) }}
              >
                {formatValue(row.FY2024)}
              </td>
              <td
                className="px-4 py-3 text-sm text-right border-b border-gray-100"
                style={{ color: getValueColor(row.FY2025) }}
              >
                {formatValue(row.FY2025)}
              </td>
            </tr>
          );
        }

        return (
          <React.Fragment key={item.heading}>
            <tr className="bg-blue-50 font-semibold">
              <td colSpan={4} className="px-4 py-3 text-sm text-blue-900 border-b border-gray-100 text-left">
                {item.heading}
              </td>
            </tr>
            {renderRows(item.children)}
          </React.Fragment>
        );
      });
    };

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
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Item
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  FY2023
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  FY2024
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                  FY2025
                </th>
              </tr>
            </thead>
            <tbody>{renderRows(sections)}</tbody>
          </table>
        </div>
      </div>
    );
  };




  if (!company) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Loading company data...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f6f1',
      minHeight: '100vh',
      fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>
        {`
          * {
            font-family: 'Figtree', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
        `}
      </style>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ✅ Back Button */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/reports')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              color: '#111827',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            ← Back to Financial Analysis Table
          </button>
        </div>

        {/* Header Section */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {company.company_name}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {company.lead_id}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Last Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div>Year Range: {company.year_range}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '0 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { key: 'source', label: 'Source Financials' },
              { key: 'ratio', label: 'Ratio Analysis & Health Check' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '16px 24px',
                  borderBottom: `2px solid ${activeTab === tab.key ? '#2563eb' : 'transparent'}`,
                  backgroundColor: activeTab === tab.key ? '#f8fafc' : 'transparent',
                  color: activeTab === tab.key ? '#2563eb' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Left Panel - Documents */}
          <div style={{
            width: '300px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: '#6b7280', marginRight: '8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Documents</h3>
            </div>

            {/* Year Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
                display: 'block',
                fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {financialDocuments.map((doc) => (
                <div
                  key={doc.key}
                  onClick={() => setSelectedDocument(doc.key as 'balance_sheet' | 'profit_loss' | 'cash_flow')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: selectedDocument === doc.key ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${selectedDocument === doc.key ? '#0288d1' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ marginRight: '12px', fontSize: '20px' }}>
                    {doc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: selectedDocument === doc.key ? '#0288d1' : '#111827',
                      fontWeight: selectedDocument === doc.key ? '600' : '500',
                      fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      {doc.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Content */}
          <div style={{ flex: 1 }}>
            {activeTab === 'ratio' ? (
              <CompanyRatioAnalysis />
            ) : (
              <>
                {selectedDocument === 'balance_sheet' && renderBSTable(company.balance_sheet)}
                {selectedDocument === 'profit_loss' && renderPLTable(company.profit_loss)}
                {selectedDocument === 'cash_flow' && renderCFTable(company.cash_flow)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
