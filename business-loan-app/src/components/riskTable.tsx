import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FigtreeContainer, FigtreeTableContainer, SortableHeader, FigtreeTableCell, FigtreeTable, NonSortableHeader } from './ReusableComponents';

interface RiskEntry {
  _id: string;
  customer_name: string;
  lead_id: string;
  total_score?: number;
  risk_bucket?: string;
  red_flags?: string[];
  updatedAt?: string;

  // 🔹 keep extra fields but don’t render them in the table
  weights?: any;
  financial_strength?: any;
  management_quality?: any;
  industry_risk?: any;
}

interface QCRecord {
  customer_name: string;
  lead_id: string;
  status: string;
}

const RiskTable: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, qcRes] = await Promise.all([
          axios.get("http://localhost:5000/risk/"),
          axios.get("http://localhost:5000/cq/")
        ]);

        const qcData: QCRecord[] = qcRes.data;

        // Filter risk entries by Approved QC status
        const approvedRiskData = (Array.isArray(riskRes.data) ? riskRes.data : []).filter(entry =>
          qcData.some(
            qc =>
              qc.customer_name === entry.customer_name &&
              qc.lead_id === entry.lead_id &&
              qc.status === "Approved"
          )
        );

        setRiskData(approvedRiskData);
      } catch (err) {
        console.error("Error fetching risk or QC data:", err);
        setRiskData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRiskPillColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case "low risk":
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case "medium risk":
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case "high risk":
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      setOpenMenuId(id);
    }
  };

  const handleViewDetail = (id: string) => {
    setOpenMenuId(null);
    navigate(`/risk/${id}`);
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return riskData;

    return [...riskData].sort((a, b) => {
      if (sortConfig.key === 'customer_name') {
        const nameA = (a.customer_name || '').toLowerCase();
        const nameB = (b.customer_name || '').toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      }
      return 0;
    });
  }, [riskData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      }
      return { key, direction: 'asc' };
    });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading risk data...</div>;
  }

  return (
    <FigtreeContainer style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>Risk Assessment</h1>



      {/* Table */}
      <FigtreeTableContainer>
        <FigtreeTable style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              <SortableHeader sortKey="customer_name" currentSort={sortConfig} onSort={handleSort}>Borrower</SortableHeader>
              <SortableHeader>Lead ID</SortableHeader>
              <SortableHeader>Total Score</SortableHeader>
              <SortableHeader>Overall Risk</SortableHeader>
              <NonSortableHeader>Actions</NonSortableHeader>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280', padding: '16px 20px' }}>
                  No matching records found.
                </td>
              </tr>
            )}
            {sortedData.map((entry: RiskEntry) => (
              <tr 
                key={entry._id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FigtreeTableCell>{entry.customer_name}</FigtreeTableCell>
                <FigtreeTableCell>{entry.lead_id}</FigtreeTableCell>
                <FigtreeTableCell>{entry.total_score ?? "N/A"}</FigtreeTableCell>
                <FigtreeTableCell>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...getRiskPillColor(entry.risk_bucket)
                    }}
                  >
                    {entry.risk_bucket ?? "—"}
                  </span>
                </FigtreeTableCell>
                <FigtreeTableCell>
                  <button
                    onClick={() => handleViewDetail(entry._id)}
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

export default RiskTable;
