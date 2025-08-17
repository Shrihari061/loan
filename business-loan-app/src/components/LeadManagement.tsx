import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Lead {
  _id: string;
  business_name: string;
  loan_type: string;
  loan_amount: number;
  last_updated: string;
  status: string;
  loan_id?: string;
}

const LeadManagement: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await axios.get('http://localhost:5000/leads/');
        if (Array.isArray(response.data) && response.data.length > 0) {
          setLeads(response.data);
        } else {
          // Use mock data if backend returns empty array
          setLeads(mockLeads);
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
        // Use mock data if backend is not available
        setLeads(mockLeads);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Mock data for demonstration
  const mockLeads: Lead[] = [
    {
      _id: '1',
      business_name: 'Vardhan Textiles Pvt Ltd',
      loan_type: 'Capacity Expansion',
      loan_amount: 750000,
      last_updated: '2025-05-20',
      status: 'Draft',
      loan_id: 'LOAN/2023/VTPL/001'
    },
    {
      _id: '2',
      business_name: 'Sreeja Foods & Beverages',
      loan_type: 'Term Loan Refinance',
      loan_amount: 1200000,
      last_updated: '2025-04-12',
      status: 'Submitted',
      loan_id: 'LOAN/2023/SFB/002'
    },
    {
      _id: '3',
      business_name: 'Nexa Technologies LLP',
      loan_type: 'Warehouse Construction',
      loan_amount: 180000,
      last_updated: '2025-04-01',
      status: 'Draft',
      loan_id: 'LOAN/2023/NTL/003'
    },
    {
      _id: '4',
      business_name: 'Krishna Pharma Distributors',
      loan_type: 'Franchise Expansion',
      loan_amount: 200000,
      last_updated: '2025-05-07',
      status: 'Submitted',
      loan_id: 'LOAN/2023/KPD/004'
    },
    {
      _id: '5',
      business_name: 'Metro Manufacturing Co',
      loan_type: 'Working Capital Expansion',
      loan_amount: 1000000,
      last_updated: '2024-04-12',
      status: 'Draft',
      loan_id: 'LOAN/2023/MMC/005'
    },
    {
      _id: '6',
      business_name: 'Green Energy Solutions',
      loan_type: 'Equipment Purchase',
      loan_amount: 90000,
      last_updated: '2023-05-07',
      status: 'Submitted',
      loan_id: 'LOAN/2023/GES/006'
    },
    {
      _id: '7',
      business_name: 'Digital Marketing Agency',
      loan_type: 'Office Expansion',
      loan_amount: 100000,
      last_updated: '2023-04-12',
      status: 'Draft',
      loan_id: 'LOAN/2023/DMA/007'
    },
    {
      _id: '8',
      business_name: 'Global Logistics Ltd',
      loan_type: 'Fleet Expansion',
      loan_amount: 450000,
      last_updated: '2023-05-15',
      status: 'Submitted',
      loan_id: 'LOAN/2023/GLL/008'
    },
    {
      _id: '9',
      business_name: 'Creative Design Studio',
      loan_type: 'Software Development',
      loan_amount: 150000,
      last_updated: '2023-04-20',
      status: 'Draft',
      loan_id: 'LOAN/2023/CDS/009'
    },
    {
      _id: '10',
      business_name: 'Premium Retail Chain',
      loan_type: 'Store Renovation',
      loan_amount: 350000,
      last_updated: '2023-05-10',
      status: 'Submitted',
      loan_id: 'LOAN/2023/PRC/010'
    }
  ];

  const handleGenerateLead = () => {
    navigate('/lead/new');
  };

  const handleMenuAction = (action: string, id: string) => {
    console.log(`${action} clicked for Lead ID: ${id}`);
    setOpenMenuId(null);
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

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === '' || statusFilter === 'All' || lead.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesLoanType = loanTypeFilter === '' || loanTypeFilter === 'All' || lead.loan_type.toLowerCase() === loanTypeFilter.toLowerCase();
    return matchesStatus && matchesLoanType;
  });

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
          Lead Management
        </h1>
        <button
          onClick={handleGenerateLead}
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
          Generate New Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        alignItems: 'center'
      }}>
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
        
        <div style={{ position: 'relative' }}>
          <select
            value={loanTypeFilter}
            onChange={(e) => setLoanTypeFilter(e.target.value)}
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
            <option value="">Loan Type</option>
            <option value="All">All</option>
            <option value="Capacity Expansion">Capacity Expansion</option>
            <option value="Term Loan Refinance">Term Loan Refinance</option>
            <option value="Warehouse Construction">Warehouse Construction</option>
            <option value="Franchise Expansion">Franchise Expansion</option>
            <option value="Working Capital">Working Capital</option>
            <option value="Equipment Purchase">Equipment Purchase</option>
            <option value="Office Expansion">Office Expansion</option>
            <option value="Fleet Expansion">Fleet Expansion</option>
            <option value="Software Development">Software Development</option>
            <option value="Store Renovation">Store Renovation</option>
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
              <th style={headerStyle}>Business Name</th>
              <th style={headerStyle}>Loan Type</th>
              <th style={headerStyle}>Loan Amount</th>
              <th style={headerStyle}>Last Updated</th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead._id} style={{ borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                <td style={cellStyle}>{lead.business_name}</td>
                <td style={cellStyle}>{lead.loan_type}</td>
                <td style={cellStyle}>${lead.loan_amount.toLocaleString()}</td>
                <td style={cellStyle}>
                  {new Date(lead.last_updated).toLocaleDateString('en-GB', {
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
                    ...getStatusColor(lead.status)
                  }}>
                    {lead.status}
                  </span>
                </td>
                <td style={{ ...cellStyle, position: 'relative', width: '40px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(lead._id);
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

                  {openMenuId === lead._id && (
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
                        onClick={() => handleMenuAction('View Details', lead._id)}
                      >
                        View Details
                      </div>
                      <div
                        style={menuItemStyle}
                        onClick={() => handleMenuAction('Edit', lead._id)}
                      >
                        Edit
                      </div>
                      <div
                        style={menuItemStyle}
                        onClick={() => handleMenuAction('Delete', lead._id)}
                      >
                        Delete
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
          Showing {filteredLeads.length} of {leads.length} entries
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

export default LeadManagement;
