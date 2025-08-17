import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type CompanyData = {
  _id: string;
  company_name: string;
  loan_id: string;
  last_updated: string;
  net_worth: number | string;
  debt_to_equity: number | string;
  dscr: number | string;
  year_range: string;
  ratio_health: string;
};

const CompanyTable: React.FC = () => {
  const [data, setData] = useState<CompanyData[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5000/analysis/')
      .then((res) => setData(res.data))
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAction = (action: string, company: CompanyData) => {
    if (action === 'View Data') {
      navigate(`/report/${company._id}`);
    } else {
      console.log(`${action} for ${company.company_name}`);
    }
    setOpenMenuId(null);
  };

  const formatNumber = (value: number | string) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Company Overview</h2>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                'Company Name',
                'Loan ID',
                'Last Updated',
                'Net Worth',
                'Debt to Equity',
                'DSCR',
                'Year Range',
                'Ratio Health',
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">
                {/* Actions */}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data.map((company, idx) => (
              <tr key={company._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-700">{company.company_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{company.loan_id}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{company.last_updated}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(company.net_worth)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{company.debt_to_equity}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{company.dscr}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{company.year_range}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{company.ratio_health}</td>
                <td className="px-4 py-3 text-right relative">
                  <span
                    onClick={() => toggleMenu(company._id)}
                    className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200"
                  >
                    &#8942;
                  </span>
                  {openMenuId === company._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                      {['View Data', 'Export Comparison', 'Download Comparison'].map((action) => (
                        <div
                          key={action}
                          onClick={() => handleAction(action, company)}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyTable;
