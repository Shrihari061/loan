import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AppraisalTable() {
  const [memos, setMemos] = useState([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/memos")
      .then((res) => setMemos(res.data))
      .catch((err) => console.error("Error fetching memos:", err));
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleViewDetail = (id: string) => {
    navigate(`/memos/${id}`);
  };

  const handleGenerateClick = () => {
    setShowModal(true);
  };

  const handleOkClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowModal(false);
      setSelectedLoanId("");
    }, 2000);
  };

  // Dummy Loan Options
  const loanOptions = [
    { id: "LN001", description: "Working capital loan for SME" },
    { id: "LN002", description: "Term loan for machinery purchase" },
    { id: "LN003", description: "Business expansion loan" },
  ];

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Appraisal Memos</h1>
        <button
          onClick={handleGenerateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate New Memo
        </button>
      </div>

      {/* Table */}
      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Memo ID</th>
            <th className="p-2 border">Loan ID</th>
            <th className="p-2 border">Loan Purpose</th>
            <th className="p-2 border">Created By</th>
            <th className="p-2 border">Last Updated</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {memos.map((memo: any) => (
            <tr key={memo._id} className="text-center relative">
              <td className="p-2 border">{memo.memo_id}</td>
              <td className="p-2 border">{memo.loan_id}</td>
              <td className="p-2 border">{memo.loan_purpose_table}</td>
              <td className="p-2 border">{memo.created_by}</td>
              <td className="p-2 border">{memo.last_updated}</td>
              <td className="p-2 border">{memo.status}</td>
              <td className="p-2 border relative">
                <span
                  onClick={() => toggleMenu(memo._id)}
                  className="cursor-pointer px-2"
                >
                  &#8942;
                </span>
                {openMenuId === memo._id && (
                  <div className="absolute right-2 top-8 bg-white border shadow-md z-10 w-40 rounded text-left">
                    <div
                      onClick={() => handleViewDetail(memo._id)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      View Detail
                    </div>
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      Export
                    </div>
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      Edit
                    </div>
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      Submit
                    </div>
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      Change Status
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Select Loan ID</h2>

            <select
              className="w-full border p-2 rounded mb-4"
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

            {loading ? (
              <div className="flex justify-center py-2">
                <div className="loader border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
              </div>
            ) : (
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOkClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
