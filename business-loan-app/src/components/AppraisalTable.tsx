import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Memo {
  _id: string;
  memo_id: string;
  loan_id: string;
  loan_purpose_table: string;
  created_by: string;
  last_updated: string;
  status: string;
}

export default function AppraisalTable() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/memos");
        setMemos(response.data);
      } catch (err) {
        console.error("Error fetching memos:", err);
        setMemos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
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

  const handleViewDetail = (id: string) => {
    navigate(`/memos/${id}`);
  };

  const handleGenerateClick = () => {
    setShowModal(true);
  };

  const handleOkClick = () => {
    setModalLoading(true);
    setTimeout(() => {
      setModalLoading(false);
      setShowModal(false);
      setSelectedLoanId("");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' };
      case 'submitted':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'under review':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case 'approved':
        return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
      case 'rejected':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.memo_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.loan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.loan_purpose_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || statusFilter === 'All' || 
                         memo.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Dummy Loan Options
  const loanOptions = [
    { id: "LN001", description: "Working capital loan for SME" },
    { id: "LN002", description: "Term loan for machinery purchase" },
    { id: "LN003", description: "Business expansion loan" },
  ];

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Generate New Memo Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: '24px' 
      }}>
        <button
          onClick={handleGenerateClick}
          style={{
            backgroundColor: '#111827',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
        >
          Generate New Memo
        </button>
      </div>

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
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
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
              <th style={headerStyle}>Memo ID</th>
              <th style={headerStyle}>Loan ID</th>
              <th style={headerStyle}>Loan Purpose</th>
              <th style={headerStyle}>Created By</th>
              <th style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Last Updated
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filteredMemos.map((memo) => (
              <tr key={memo._id} style={{ borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                <td style={cellStyle}>{memo.memo_id}</td>
                <td style={cellStyle}>{memo.loan_id}</td>
                <td style={cellStyle}>{memo.loan_purpose_table}</td>
                <td style={cellStyle}>{memo.created_by}</td>
                <td style={cellStyle}>
                  {new Date(memo.last_updated).toLocaleDateString('en-GB', {
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
                    ...getStatusColor(memo.status)
                  }}>
                    {memo.status}
                  </span>
                </td>
                <td style={{ ...cellStyle, position: 'relative', width: '40px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(memo._id);
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

                  {openMenuId === memo._id && (
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
                        onClick={() => handleViewDetail(memo._id)}
                      >
                        View Detail
                      </div>
                      <div
                        style={menuItemStyle}
                        onClick={() => console.log('Export clicked')}
                      >
                        Export
                      </div>
                      <div
                        style={menuItemStyle}
                        onClick={() => console.log('Edit clicked')}
                      >
                        Edit
                      </div>
                      <div
                        style={menuItemStyle}
                        onClick={() => console.log('Submit clicked')}
                      >
                        Submit
                      </div>
                      <div
                        style={menuItemStyle}
                        onClick={() => console.log('Change Status clicked')}
                      >
                        Change Status
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
          Showing {filteredMemos.length} of {memos.length} entries
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

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '24px',
            width: '400px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Loan ID</h2>

            <select
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
                outline: 'none'
              }}
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
            >
              <option value="">-- Select Loan --</option>
              {loanOptions.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.id} – {loan.description}
                </option>
              ))}
            </select>

            {modalLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '4px solid #3b82f6',
                  borderTop: '4px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleOkClick}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: selectedLoanId ? 1 : 0.5
                  }}
                  disabled={!selectedLoanId}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}

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
