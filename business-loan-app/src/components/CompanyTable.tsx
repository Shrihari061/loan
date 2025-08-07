import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type CompanyData = {
  _id: string;
  company_name: string;
  loan_id: string;
  last_updated: string;
  net_worth: number;
  debt_to_equity: number;
  dscr: number;
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

  return (
    <div className="p-6 relative">
      <h2 className="text-xl font-bold mb-4">Company Overview</h2>
      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Company Name</th>
            <th className="p-2 border">Loan ID</th>
            <th className="p-2 border">Last Updated</th>
            <th className="p-2 border">Net Worth</th>
            <th className="p-2 border">Debt to Equity</th>
            <th className="p-2 border">DSCR</th>
            <th className="p-2 border">Year Range</th>
            <th className="p-2 border">Ratio Health</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((company) => (
            <tr key={company._id} className="text-left relative">
              <td className="p-2 border">{company.company_name}</td>
              <td className="p-2 border">{company.loan_id}</td>
              <td className="p-2 border">{company.last_updated}</td>
              <td className="p-2 border">{company.net_worth}</td>
              <td className="p-2 border">{company.debt_to_equity}</td>
              <td className="p-2 border">{company.dscr}</td>
              <td className="p-2 border">{company.year_range}</td>
              <td className="p-2 border">{company.ratio_health}</td>
              <td className="p-2 border relative text-center">
                <span
                  onClick={() => toggleMenu(company._id)}
                  className="cursor-pointer px-2"
                >
                  &#8942;
                </span>
                {openMenuId === company._id && (
                  <div className="absolute right-2 top-8 bg-white border shadow-md z-10 w-48 rounded text-left">
                    <div
                      onClick={() => handleAction('View Data', company)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      View Data
                    </div>
                    <div
                      onClick={() => handleAction('Export Comparison', company)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Export Comparison
                    </div>
                    <div
                      onClick={() => handleAction('Download Comparison', company)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Download Comparison
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
