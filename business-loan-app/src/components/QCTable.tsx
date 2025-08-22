import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { FigtreeContainer, FigtreeTableContainer, FigtreeTableCell, FigtreeTable, NonSortableHeader } from './ReusableComponents';

interface DocumentStatus {
  status: "Pending" | "Approved" | "Declined";
}

interface QCEntry {
  _id: string;
  customer_id: string;
  customer_name: string;
  lead_id: string;
  status: "In progress" | "Approved" | "Declined";
  documents?: DocumentStatus[];
}

const QCTable: React.FC = () => {
  const [data, setData] = useState<QCEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/cq/")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error("Failed to fetch QC data:", err));
  }, []);

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

  const handleAction = (action: string, id: string) => {
    if (action === "View Data") {
      navigate(`/qc/${id}`);
    }
    setOpenMenuId(null);
  };

  return (
    <FigtreeContainer style={{ padding: '20px' }}>
      {/* Title */}
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
        Quality Check (QC) Table
      </h2>

      {/* Table Container */}
      <FigtreeTableContainer>
        <FigtreeTable style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              <NonSortableHeader>Customer Name</NonSortableHeader>
              <NonSortableHeader>Lead ID</NonSortableHeader>
              <NonSortableHeader>Status</NonSortableHeader>
              <NonSortableHeader>Actions</NonSortableHeader>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '16px 20px' }}>
                  No QC records found.
                </td>
              </tr>
            )}
            {data.map((entry, index) => (
              <tr
                key={entry._id}
                style={{ 
                  borderBottom: index !== data.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FigtreeTableCell>{entry.customer_name}</FigtreeTableCell>
                <FigtreeTableCell>{entry.lead_id}</FigtreeTableCell>
                <FigtreeTableCell>{entry.status}</FigtreeTableCell>
                <FigtreeTableCell style={{ textAlign: 'right' }}>
                  {entry.status !== "Approved" && entry.status !== "Declined" && (
                    <button
                      onClick={(e) => toggleMenu(entry._id, e)}
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                      </svg>
                    </button>
                  )}
                </FigtreeTableCell>
              </tr>
            ))}
          </tbody>
        </FigtreeTable>
      </FigtreeTableContainer>

      {/* Floating dropdown menu (same style as RiskTable) */}
      {openMenuId &&
        menuPosition &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              top: menuPosition.top + 8,
              left: menuPosition.left,
              zIndex: 1000,
            }}
            className="w-48 bg-white border rounded-xl shadow-lg transform -translate-x-full"
          >
            <button
              onClick={() => handleAction("View Data", openMenuId)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Data
            </button>
          </div>,
          document.body
        )}
    </FigtreeContainer>
  );
};

export default QCTable;
