import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createPortal } from "react-dom";

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Appraisal Memos</h1>
        <button
          onClick={handleGenerateClick}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Generate New Memo
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Customer Name",
                "Lead ID",
                "Loan Type", // ✅ show loan_type
                "Created By",
                "Last Updated",
                "Status",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {memos.map((memo: any, idx) => (
              <tr key={memo._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 text-sm text-gray-700">{memo.customer_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{memo.lead_id}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.loan_type || "N/A"} {/* ✅ directly display loan_type */}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{memo.created_by}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{memo.last_updated}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{memo.status}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    onClick={(e) => toggleMenu(memo._id, e)}
                    className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200"
                  >
                    &#8942;
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
