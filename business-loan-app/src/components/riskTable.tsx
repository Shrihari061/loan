import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface RiskEntry {
  _id: string;
  borrower: string;
  loan_id: string;
  loan_amount: number;
  flags: {
    financial: string[];
    operational: string[];
    compliance: string[];
  };
  last_updated: string;
  overall_risk: string;
}

const RiskTable: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/risk/');
        if (Array.isArray(response.data)) {
          setRiskData(response.data);
        } else {
          setRiskData([]);
        }
      } catch (err) {
        console.error(err);
        setRiskData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, []);

  const getFlagCount = (flags: RiskEntry['flags']) =>
    Object.values(flags || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const handleViewDetail = (id: string) => {
    navigate(`/risk/${id}`);
  };

  const handleDownload = (id: string) => {
    // Placeholder: You can implement a backend endpoint for real download
    alert(`Downloading summary report for ${id}`);
  };

  const handleUpdate = (id: string) => {
    navigate(`/risk/update/${id}`);
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(prev => (prev === id ? null : id));
  };

  const closeMenu = () => setOpenMenuId(null);

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Risk Assessment Table</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={cellStyle}>Borrower</th>
            <th style={cellStyle}>Loan ID</th>
            <th style={cellStyle}>Loan Amount</th>
            <th style={cellStyle}>Financial Flags</th>
            <th style={cellStyle}>Operational Flags</th>
            <th style={cellStyle}>Compliance Flags</th>
            <th style={cellStyle}>Flag Count</th>
            <th style={cellStyle}>Last Updated</th>
            <th style={cellStyle}>Overall Risk</th>
            <th style={cellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {riskData.map((entry) => (
            <tr key={entry._id} style={{ borderBottom: '1px solid #ccc', position: 'relative' }}>
              <td style={cellStyle}>{entry.borrower}</td>
              <td style={cellStyle}>{entry.loan_id}</td>
              <td style={cellStyle}>{entry.loan_amount.toLocaleString()}</td>
              <td style={cellStyle}>{entry.flags?.financial?.join(', ') || '-'}</td>
              <td style={cellStyle}>{entry.flags?.operational?.join(', ') || '-'}</td>
              <td style={cellStyle}>{entry.flags?.compliance?.join(', ') || '-'}</td>
              <td style={cellStyle}>{getFlagCount(entry.flags)}</td>
              <td style={cellStyle}>{new Date(entry.last_updated).toLocaleDateString()}</td>
              <td style={cellStyle}>{entry.overall_risk}</td>
              <td style={{ ...cellStyle, position: 'relative' }}>
                <button onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(entry._id);
                }}>⋮</button>

                {openMenuId === entry._id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      width: '180px',
                    }}
                  >
                    <div
                      style={menuItemStyle}
                      onClick={() => handleViewDetail(entry._id)}
                    >
                      View Detail
                    </div>
                    <div
                      style={menuItemStyle}
                      onClick={() => handleDownload(entry._id)}
                    >
                      Download Summary Report
                    </div>
                    <div
                      style={menuItemStyle}
                      onClick={() => handleUpdate(entry._id)}
                    >
                      Update
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

const cellStyle: React.CSSProperties = {
  padding: '10px',
  textAlign: 'left',
  border: '1px solid #ddd',
};

const menuItemStyle: React.CSSProperties = {
  padding: '10px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #eee',
};

export default RiskTable;
