import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AppraisalTable() {
  const [memos, setMemos] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]); // cqs data
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // fetch memos
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

  // fetch customers from cqs
  useEffect(() => {
    axios
      .get("http://localhost:5000/cq/")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching cqs:", err));
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

  const handleOkClick = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);

    try {
      // 🔹 Find selected customer object
      const customer = customers.find((c) => c._id === selectedCustomerId);

      // 🔹 Create new memo (backend will enrich it with summaries)
      await axios.post("http://localhost:5000/memos/create", {
        loan_id: customer.loan_id,
        customer_name: customer.customer_name,
        status: "Draft",
        created_by: "CurrentUser", // later replace with auth user
        last_updated: new Date().toISOString(),
        loan_purpose_table: "To be filled",
      });

      // refresh memos
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
                "Memo ID",
                // "Customer Name",
                "Loan ID",
                "Loan Purpose",
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {memos.map((memo: any, idx) => (
              <tr
                key={memo._id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.memo_id || memo._id}
                </td>
                {/* <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.customer_name}
                </td> */}
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.loan_id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.loan_purpose_table}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.created_by}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.last_updated}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {memo.status}
                </td>
                <td className="px-4 py-3 text-right relative">
                  <span
                    onClick={() => toggleMenu(memo._id)}
                    className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200"
                  >
                    &#8942;
                  </span>
                  {openMenuId === memo._id && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50">
                      {[
                        "View Detail",
                        "Export",
                        "Edit",
                        "Submit",
                        "Change Status",
                      ].map((action) => (
                        <div
                          key={action}
                          onClick={() =>
                            action === "View Detail" && handleViewDetail(memo._id)
                          }
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.customer_name} – {c.loan_id}
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
