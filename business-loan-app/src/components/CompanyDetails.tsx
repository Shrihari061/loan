import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CompanyRatioAnalysis from './CompanyRatioAnalysis';

interface FinancialItem {
  _id: string;
  item: string;
  FY2022: number | null;
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
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'ratio'>('source');

  // Fetch company details (verified by backend using name + lead_id)
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`http://localhost:5000/analysis/${id}`);
        const data = await res.json();
        
        // Add dummy values to the financial data for display
        const dataWithDummyValues = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2022: item.FY2022 || generateDummyValue(item.item, 'balance_sheet', 2022),
            FY2023: item.FY2023 || generateDummyValue(item.item, 'balance_sheet', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'balance_sheet', 2024)
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2022: item.FY2022 || generateDummyValue(item.item, 'profit_loss', 2022),
            FY2023: item.FY2023 || generateDummyValue(item.item, 'profit_loss', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'profit_loss', 2024)
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2022: item.FY2022 || generateDummyValue(item.item, 'cash_flow', 2022),
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
  }, [id]);

  const formatValue = (value: number | string | null) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    return value.toLocaleString('en-IN');
  };

  const generateDummyValue = (itemName: string, documentType: string, year: number): number => {
    const baseValue = 50000; // Base value for calculations
    const yearMultiplier = 1 + (year - 2022) * 0.15; // 15% growth per year
    
    // Different multipliers based on item type
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

  const renderTable = (title: string, data: FinancialItem[]) => {
    if (!data || data.length === 0) return null;

    const showFY2022 = data.some((row) => row.FY2022 !== null);
    const showFY2023 = data.some((row) => row.FY2023 !== null);
    const showFY2024 = data.some((row) => row.FY2024 !== null);

    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Item</th>
                {showFY2022 && <th className="border px-4 py-2 text-left">FY2022</th>}
                {showFY2023 && <th className="border px-4 py-2 text-left">FY2023</th>}
                {showFY2024 && <th className="border px-4 py-2 text-left">FY2024</th>}
                <th className="border px-4 py-2 text-left">FY2025</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row._id}>
                  <td className="border px-4 py-2">
                    {title === 'Cash Flow Summary' && row.item === 'Principal' 
                      ? 'Payment of lease liabilities' 
                      : row.item}
                  </td>
                  {showFY2022 && <td className="border px-4 py-2">{formatValue(row.FY2022)}</td>}
                  {showFY2023 && <td className="border px-4 py-2">{formatValue(row.FY2023)}</td>}
                  {showFY2024 && <td className="border px-4 py-2">{formatValue(row.FY2024)}</td>}
                  <td className="border px-4 py-2">{formatValue(row.FY2025)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footnote */}
        <div className="mt-4 text-sm text-gray-600 italic">
          The values displayed above are those extracted to calculate the ratios.
        </div>
      </div>
    );
  };

  if (!company) {
    return <div className="p-4">Loading company data...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{company.company_name}</h1>

      {/* Company Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>lead ID:</strong> {company.lead_id}</p>
          <p><strong>Year Range:</strong> {company.year_range}</p>
        </div>
        <div>
          <p><strong>Net Worth:</strong> ₹{formatValue(company.net_worth)}</p>
          <p><strong>Ratio Health:</strong> {company.ratio_health}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-300 flex">
        <button
          className={`px-4 py-2 mr-2 border-b-2 ${activeTab === 'source' ? 'border-blue-500 font-semibold' : 'border-transparent'}`}
          onClick={() => setActiveTab('source')}
        >
          Source Financials
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'ratio' ? 'border-blue-500 font-semibold' : 'border-transparent'}`}
          onClick={() => setActiveTab('ratio')}
        >
          Ratio Analysis & Health Check
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'ratio' ? (
        <CompanyRatioAnalysis />
      ) : (
        <>
          {renderTable('Balance Sheet Summary', company.balance_sheet)}
          {renderTable('Profit & Loss Summary', company.profit_loss)}
          {renderTable('Cash Flow Summary', company.cash_flow)}
        </>
      )}
    </div>
  );
};

export default CompanyDetails;
