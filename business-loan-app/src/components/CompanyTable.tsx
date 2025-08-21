import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type CompanyData = {
  _id: string;
  company_name: string;
  lead_id: string;
  net_worth: number | string;
  debt_to_equity: number | string;
  dscr: number | string;
  year_range: string;
  // ratio_health: string;
};

type QCRecord = {
  customer_name: string;
  lead_id: string;
  status: string;
};

type ScoreEntry = {
  value: number | null;
  threshold?: string;
  red_flag?: boolean;
  score?: number;
  max?: number;
};

type FinancialStrength = {
  per_ratio_max?: number;
  scores?: { [key: string]: ScoreEntry };
  subtotal?: number;
};

type RatioDoc = {
  _id: string;
  customer_name?: string;
  lead_id?: string;
  ratios: { name: string; value: number | null }[];
  financial_strength?: FinancialStrength;
};

const CompanyTable: React.FC = () => {
  const [data, setData] = useState<CompanyData[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, qcRes, ratiosRes] = await Promise.all([
          axios.get('http://localhost:5000/analysis/'),
          axios.get('http://localhost:5000/cq/'),
          axios.get('http://localhost:5000/analysis/ratios')
        ]);

        const qcData: QCRecord[] = qcRes.data;
        const ratiosData: RatioDoc[] = ratiosRes.data;

        const approvedData = companyRes.data
          .filter((company: CompanyData) =>
            qcData.some(
              (qc) =>
                qc.customer_name === company.company_name &&
                qc.lead_id === company.lead_id &&
                qc.status === 'Approved'
            )
          )
          .map((company: CompanyData) => {
            const ratioDoc = ratiosData.find(
              (r) =>
                r.customer_name === company.company_name &&
                r.lead_id === company.lead_id
            );

            let debtToEquity = 'N/A';
            let dscr = 'N/A';
            let ratioHealth = 'N/A';

            if (ratioDoc) {
              const debtEquityRatio = ratioDoc.ratios.find((r) => r.name === 'Debt/Equity');
              const dscrRatio = ratioDoc.ratios.find((r) => r.name === 'DSCR');

              debtToEquity = debtEquityRatio?.value ?? 'N/A';
              dscr = dscrRatio?.value ?? 'N/A';

              // ✅ calculate ratio health from subtotal
              const subtotal = ratioDoc.financial_strength?.subtotal ?? null;
              if (subtotal !== null) {
                if (subtotal > 40) ratioHealth = 'Health';
                else if (subtotal > 30) ratioHealth = 'Moderate';
                else ratioHealth = 'Low';
              }
            }

            return {
              ...company,
              debt_to_equity: debtToEquity,
              dscr: dscr,
              ratio_health: ratioHealth
            };
          });

        setData(approvedData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setOpenMenuId(id);
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    }
  };

  const handleAction = (action: string, company: CompanyData) => {
    if (action === 'View Data') {
      navigate(`/report/${company._id}`);
    } else {
      console.log(`${action} for ${company.company_name}`);
    }
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const formatNumber = (value: number | string) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-IN');
  };

  const isBracketed = (val: any) => typeof val === 'string' && /^\(.*\)$/.test(val);

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Company Overview</h2>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Company Name','Lead ID','Net Worth','Debt to Equity','DSCR','Year Range'].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 uppercase tracking-wider"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data.map((company, idx) => (
              <tr key={company._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{company.company_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{company.lead_id}</td>

                <td
                  className={`px-4 py-3 text-sm whitespace-nowrap ${
                    isBracketed(company.net_worth) ? '!bg-red-200 text-red-800 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {formatNumber(company.net_worth)}
                </td>

                <td
                  className={`px-4 py-3 text-sm whitespace-nowrap ${
                    isBracketed(company.debt_to_equity) ? '!bg-red-200 text-red-800 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {formatNumber(company.debt_to_equity)}
                </td>

                <td
                  className={`px-4 py-3 text-sm whitespace-nowrap ${
                    isBracketed(company.dscr) ? '!bg-red-200 text-red-800 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {formatNumber(company.dscr)}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{company.year_range}</td>
                {/* <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{company.ratio_health}</td> */}
                <td className="px-4 py-3 text-right">
                  <span
                    onClick={(e) => toggleMenu(company._id, e)}
                    className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200"
                  >
                    &#8942;
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openMenuId && menuPosition && (
        <div
          className="fixed z-50 bg-white border rounded-xl shadow-lg w-48 transform -translate-x-full"
          style={{ top: menuPosition.top + 8, left: menuPosition.left }}
        >
          {['View Data', 'Export Comparison', 'Download Comparison'].map((action) => (
            <div
              key={action}
              onClick={() => handleAction(action, data.find((c) => c._id === openMenuId)!)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyTable;
