import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface RiskEntry {
  _id: string;
  borrower: string;
  loan_id: string;
  loan_amount: number;
  flags: {
    red: number;
    orange: number;
    green: number;
  };
  last_updated: string;
  overall_risk: string;
}

const RiskTable: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
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

  const getFlagDisplay = (flags: RiskEntry['flags']) => {
    if (!flags) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: '#ef4444',
          display: 'inline-block'
        }}></div>
        <span style={{ fontSize: '12px', color: '#666' }}>{flags.red}</span>
        
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: '#f97316',
          display: 'inline-block'
        }}></div>
        <span style={{ fontSize: '12px', color: '#666' }}>{flags.orange}</span>
        
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: '#22c55e',
          display: 'inline-block'
        }}></div>
        <span style={{ fontSize: '12px', color: '#666' }}>{flags.green}</span>
      </div>
    );
  };

  const getRiskPillColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'moderate':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case 'high':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const handleViewDetail = (id: string) => {
    navigate(`/risk/${id}`);
  };

  const handleDownload = (id: string) => {
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

  const filteredData = riskData.filter(entry => {
    const matchesSearch = entry.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.loan_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'All' || entry.overall_risk.toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Search and Filter Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div style={{ position: 'relative' }}>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              minWidth: '120px'
            }}
          >
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
          <svg
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af',
              pointerEvents: 'none'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={headerStyle}>Borrower</th>
              <th style={headerStyle}>Loan ID</th>
              <th style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Loan Amount
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </th>
              <th style={headerStyle}>Flag Count</th>
              <th style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Last Updated
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </th>
              <th style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Overall Risk
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </th>
              <th style={headerStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry._id} style={{ borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                <td style={cellStyle}>{entry.borrower}</td>
                <td style={cellStyle}>{entry.loan_id}</td>
                <td style={cellStyle}>${entry.loan_amount.toLocaleString()}</td>
                <td style={cellStyle}>{getFlagDisplay(entry.flags)}</td>
                <td style={cellStyle}>
                  {new Date(entry.last_updated).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td style={cellStyle}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    ...getRiskPillColor(entry.overall_risk)
                  }}>
                    {entry.overall_risk}
                  </span>
                </td>
                <td style={{ ...cellStyle, position: 'relative', width: '40px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(entry._id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      color: '#6b7280'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>

                  {openMenuId === entry._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 10,
                        width: '180px',
                        overflow: 'hidden'
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

      {/* Pagination */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '16px',
        padding: '0 4px'
      }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Showing {filteredData.length} of {riskData.length} entries
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={paginationButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button style={paginationButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const cellStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '14px',
  color: '#111827'
};

const menuItemStyle: React.CSSProperties = {
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  transition: 'background-color 0.2s'
};

const paginationButtonStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: 'white',
  cursor: 'pointer',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

export default RiskTable;
