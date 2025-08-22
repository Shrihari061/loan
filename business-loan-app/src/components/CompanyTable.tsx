import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FigtreeContainer, FigtreeTableContainer, NonSortableHeader, FigtreeTableCell, FigtreeTable } from './ReusableComponents';

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
    <FigtreeContainer style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>Financial Analysis</h2>


      <FigtreeTableContainer>
        <FigtreeTable style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              {['Company Name','Lead ID','Net Worth','Debt to Equity','DSCR','Year Range','Ratio Health'].map((header) => (
                <NonSortableHeader key={header}>

                  {header}
                </NonSortableHeader>
              ))}

              <NonSortableHeader>Actions</NonSortableHeader>
            </tr>
          </thead>

          <tbody>
            {data.map((company) => (
              <tr 
                key={company._id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FigtreeTableCell>{company.company_name}</FigtreeTableCell>
                <FigtreeTableCell>{company.lead_id}</FigtreeTableCell>
                <FigtreeTableCell>{formatNumber(company.net_worth)}</FigtreeTableCell>
                <FigtreeTableCell>{company.debt_to_equity}</FigtreeTableCell>
                <FigtreeTableCell>{company.dscr}</FigtreeTableCell>
                <FigtreeTableCell>{company.year_range}</FigtreeTableCell>
                <FigtreeTableCell>{company.ratio_health}</FigtreeTableCell>
                <FigtreeTableCell style={{ textAlign: 'right' }}>
                  <button

                    onClick={(e) => toggleMenu(company._id, e)}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </FigtreeTableCell>
              </tr>
            ))}
          </tbody>
        </FigtreeTable>
      </FigtreeTableContainer>

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
    </FigtreeContainer>
  );
};

export default CompanyTable;
