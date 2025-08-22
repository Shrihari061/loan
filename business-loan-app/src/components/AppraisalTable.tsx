import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createPortal } from "react-dom";
import { FigtreeContainer, FigtreeTableContainer, SortableHeader, FigtreeTableCell, FigtreeTable, NonSortableHeader } from './ReusableComponents';

export default function AppraisalTable() {
  const [memos, setMemos] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const res = await axios.get("http://localhost:5000/memos");
      setMemos(res.data);
    } catch (err) {
      console.error("Error fetching memos:", err);
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/cq/")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching cqs:", err));
  }, []);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setOpenMenuId(id);
      setMenuPosition({ x: rect.right, y: rect.bottom });
    }
  };

  const handleViewDetail = (id: string) => {
    navigate(`/memos/${id}`);
  };

  const handleGenerateClick = () => {
    setShowModal(true);
  };

  const handleOkClick = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);

    try {
      const customer = customers.find((c) => c._id === selectedCustomerId);

      await axios.post("http://localhost:5000/memos/create", {
        lead_id: customer.lead_id,
        customer_name: customer.customer_name,
        loan_type: customer.loan_type, // ✅ use loan_type directly from cqs
        status: "In progres",
        created_by: "CurrentUser",
        last_updated: new Date().toISOString(),
        loan_purpose_table: "To be filled",
      });

      await fetchMemos();

      setLoading(false);
      setShowModal(false);
      setSelectedCustomerId("");
    } catch (error) {
      console.error("Error creating memo:", error);
      setLoading(false);
    }
  };

  return (
    <FigtreeContainer style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>Appraisal Memos</h1>
        <button
          onClick={handleGenerateClick}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Generate New Memo
        </button>
      </div>

      {/* Table Container */}
      <FigtreeTableContainer>
        <FigtreeTable style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              <NonSortableHeader>Customer Name</NonSortableHeader>
              <NonSortableHeader>Lead ID</NonSortableHeader>
              <NonSortableHeader>Loan Type</NonSortableHeader>
              <NonSortableHeader>Created By</NonSortableHeader>
              <SortableHeader sortKey="last_updated" currentSort={null} onSort={() => {}}>Last Updated</SortableHeader>
              <NonSortableHeader>Status</NonSortableHeader>
              <NonSortableHeader>Actions</NonSortableHeader>
            </tr>
          </thead>
          <tbody>
            {memos.map((memo: any, idx) => (
              <tr 
                key={memo._id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FigtreeTableCell>{memo.customer_name}</FigtreeTableCell>
                <FigtreeTableCell>{memo.lead_id}</FigtreeTableCell>
                <FigtreeTableCell>
                  {memo.loan_type || "N/A"}
                </FigtreeTableCell>
                <FigtreeTableCell>{memo.created_by}</FigtreeTableCell>
                <FigtreeTableCell>{memo.last_updated}</FigtreeTableCell>
                <FigtreeTableCell>{memo.status}</FigtreeTableCell>
                <FigtreeTableCell style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => toggleMenu(memo._id, e)}
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

      {/* Floating Menu */}
      {openMenuId && menuPosition &&
        createPortal(
          <div
            className="fixed z-50 bg-white border rounded-lg shadow-lg"
            style={{ top: menuPosition.y + 4, left: menuPosition.x - 150, width: "150px" }}
          >
            {["View Detail", "Export", "Edit", "Submit", "Change Status"].map(
              (action) => (
                <div
                  key={action}
                  onClick={() => {
                    if (action === "View Detail") handleViewDetail(openMenuId);
                    setOpenMenuId(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {action}
                </div>
              )
            )}
          </div>,
          document.body
        )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Select Customer
            </h2>
            <select
              className="w-full border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customers
                .filter((c) => c.status === "Approved")
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customer_name} – {c.lead_id} – {c.loan_type} {/* ✅ show loan_type */}
                  </option>
                ))}
            </select>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOkClick}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={!selectedCustomerId}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
              )}
    </FigtreeContainer>
  );
}
