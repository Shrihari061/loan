import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";

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
    <div className="space-y-6 relative">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900">Quality Check (QC) Table</h2>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs">
                Customer Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs">
                Lead ID
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs">
                Status
              </th>
              <th className="text-left py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No QC records found.
                </td>
              </tr>
            )}
            {data.map((entry, index) => (
              <tr
                key={entry._id}
                className={`${index !== data.length - 1 ? "border-b border-gray-100" : ""
                  } hover:bg-gray-50`}
              >
                <td className="py-3 px-4 text-gray-800">{entry.customer_name}</td>
                <td className="py-3 px-4 text-gray-800">{entry.lead_id}</td>
                <td className="py-3 px-4 text-gray-800">{entry.status}</td>
                <td className="py-3 px-4 text-right">
                  {entry.status !== "Approved" && entry.status !== "Rejected" && (
                    <button
                      onClick={(e) => toggleMenu(entry._id, e)}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

export default QCTable;
