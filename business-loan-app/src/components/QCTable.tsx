import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DocumentStatus {
  status: 'Pending' | 'Approved' | 'Declined';
}

interface QCEntry {
  _id: string;
  customer_id: string;
  customer_name: string;
  loan_id: string;
  documents: DocumentStatus[];
}

const QCTable: React.FC = () => {
  const [data, setData] = useState<QCEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQCData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/cq/');
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch QC data:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQCData();
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const closeMenu = () => setOpenMenuId(null);

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAction = (action: string, id: string) => {
    if (action === 'View Data') {
      navigate(`/qc/${id}`);
    }
    setOpenMenuId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case 'approved':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'declined':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const filteredData = data.filter(entry => {
    const matchesSearch = entry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.loan_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === '' || statusFilter === 'All') return matchesSearch;
    
    const pendingCount = entry.documents.filter(doc => doc.status === 'Pending').length;
    const approvedCount = entry.documents.filter(doc => doc.status === 'Approved').length;
    const declinedCount = entry.documents.filter(doc => doc.status === 'Declined').length;
    
    switch (statusFilter) {
      case 'Pending':
        return matchesSearch && pendingCount > 0;
      case 'Approved':
        return matchesSearch && approvedCount > 0;
      case 'Declined':
        return matchesSearch && declinedCount > 0;
      default:
        return matchesSearch;
    }
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px 12px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              minWidth: '140px',
              paddingRight: '32px'
            }}
          >
            <option value="">Status</option>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
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
              <th style={headerStyle}>Customer Name</th>
              <th style={headerStyle}>Loan ID</th>
              <th style={headerStyle}>Customer ID</th>
              <th style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  # of Documents
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </th>
              <th style={headerStyle}>Pending</th>
              <th style={headerStyle}>Approved</th>
              <th style={headerStyle}>Declined</th>
              <th style={headerStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => {
              const pendingCount = entry.documents.filter(doc => doc.status === 'Pending').length;
              const approvedCount = entry.documents.filter(doc => doc.status === 'Approved').length;
              const declinedCount = entry.documents.filter(doc => doc.status === 'Declined').length;
              
              return (
                <tr key={entry._id} style={{ borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                  <td style={cellStyle}>{entry.customer_name}</td>
                  <td style={cellStyle}>{entry.loan_id}</td>
                  <td style={cellStyle}>{entry.customer_id}</td>
                  <td style={cellStyle}>{entry.documents.length}</td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...getStatusColor('Pending')
                    }}>
                      {pendingCount}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...getStatusColor('Approved')
                    }}>
                      {approvedCount}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...getStatusColor('Declined')
                    }}>
                      {declinedCount}
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
                          onClick={() => handleAction('View Data', entry._id)}
                        >
                          View Data
                        </div>
                        <div
                          style={menuItemStyle}
                          onClick={() => handleAction('Edit', entry._id)}
                        >
                          Edit
                        </div>
                        <div
                          style={menuItemStyle}
                          onClick={() => handleAction('Delete', entry._id)}
                        >
                          Delete
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
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
          Showing {filteredData.length} of {data.length} entries
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

export default QCTable;
