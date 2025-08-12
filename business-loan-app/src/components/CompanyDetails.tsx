import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CompanyRatioAnalysis from './CompanyRatioAnalysis';

interface FinancialItem {
  _id: string;
  item: string;
  FY2022: number;
  FY2023: number;
  FY2024: number;
  FY2025: number;
}

interface CompanyData {
  _id: string;
  company_name: string;
  loan_id: string;
  last_updated: string;
  net_worth: number;
  debt_to_equity: number;
  dscr: number;
  year_range: string;
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
}

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'ratio'>('source');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`http://localhost:5000/analysis/${id}`);
        const data = await res.json();
        setCompany(data);
      } catch (error) {
        console.error('Failed to fetch company data:', error);
      }
    };

    fetchCompany();
  }, [id]);

  const renderTable = (title: string, data: FinancialItem[]) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Item</th>
              <th className="border px-4 py-2 text-left">FY2022</th>
              <th className="border px-4 py-2 text-left">FY2023</th>
              <th className="border px-4 py-2 text-left">FY2024</th>
              <th className="border px-4 py-2 text-left">FY2025</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row._id}>
                <td className="border px-4 py-2">{row.item}</td>
                <td className="border px-4 py-2">{row.FY2022}</td>
                <td className="border px-4 py-2">{row.FY2023}</td>
                <td className="border px-4 py-2">{row.FY2024}</td>
                <td className="border px-4 py-2">{row.FY2025}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!company) {
    return <div className="p-4">Loading company data...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{company.company_name}</h1>

      {/* Company Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>Loan ID:</strong> {company.loan_id}</p>
          <p><strong>Last Updated:</strong> {company.last_updated}</p>
          <p><strong>Year Range:</strong> {company.year_range}</p>
        </div>
        <div>
          <p><strong>Net Worth:</strong> ₹{company.net_worth}</p>
          <p><strong>Debt to Equity:</strong> {company.debt_to_equity}</p>
          <p><strong>DSCR:</strong> {company.dscr}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-300 flex">
        <button
          className={`px-4 py-2 mr-2 border-b-2 ${activeTab === 'source' ? 'border-blue-500 font-semibold' : 'border-transparent'
            }`}
          onClick={() => setActiveTab('source')}
        >
          Source Financials
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'ratio' ? 'border-blue-500 font-semibold' : 'border-transparent'
            }`}
          onClick={() => setActiveTab('ratio')}
        >
          Ratio Analysis & Health Check
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'ratio' ? (
        <CompanyRatioAnalysis
          companyName={company.company_name}
          ratios={company.ratios}
        />
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
