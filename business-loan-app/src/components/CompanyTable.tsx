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
  ratios: {
    name: string;
    threshold?: string;
    value_2023?: number | string | null;
    red_flag_2023?: boolean;
    value_2024?: number | string | null;
    red_flag_2024?: boolean;
    value_2025?: number | string | null;
    red_flag_2025?: boolean;
  }[];
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

              // ✅ Always use latest year (2025) for values
              debtToEquity = debtEquityRatio?.value_2025 ?? 'N/A';
              dscr = dscrRatio?.value_2025 ?? 'N/A';

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

  const handleAction = (action: string, company: CompanyData) => {
    if (action === 'View Data') {
      navigate(`/reports/${company._id}`);
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
              {['Company Name','Lead ID','Net Worth','Debt to Equity','DSCR','Year Range'].map((header) => (
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
                {/* <FigtreeTableCell>{company.ratio_health}</FigtreeTableCell> */}
                <FigtreeTableCell>
                  <button
                    onClick={() => handleAction('View Data', company)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      color: '#374151',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    View Details
                  </button>
                </FigtreeTableCell>
              </tr>
            ))}
          </tbody>
        </FigtreeTable>
      </FigtreeTableContainer>
    </FigtreeContainer>
  );
};

export default CompanyTable;
