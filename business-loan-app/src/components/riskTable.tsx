import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface RiskEntry {
  _id: string;
  customer_name: string;
  lead_id: string;
  total_score?: number;
  risk_bucket?: string;
  red_flags?: string[];
  updatedAt?: string;
}

interface QCRecord {
  customer_name: string;
  lead_id: string;
  status: string;
}

const RiskTable: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

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
        return "bg-green-100 text-green-700 border border-green-300";
      case "medium risk":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      case "high risk":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
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

  const filteredData = riskData.filter((entry) => {
    const matchesSearch =
      entry.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.lead_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      riskFilter === "All" ||
      entry.risk_bucket?.trim().toLowerCase() === riskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading risk data...</div>;
  }

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">Risk Assessment</h1>

      {/* Search + Filter */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Borrower / lead ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring focus:ring-blue-200"
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="All">All</option>
          <option value="Low Risk">Low Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="High Risk">High Risk</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Borrower</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Lead ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Total Score</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Red Flags</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Risk Bucket</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No matching records found.
                </td>
              </tr>
            )}
            {filteredData.map((entry) => (
              <tr key={entry._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{entry.customer_name}</td>
                <td className="px-4 py-2 text-gray-800">{entry.lead_id}</td>
                <td className="px-4 py-2">{entry.total_score ?? "N/A"}</td>
                <td className="px-4 py-2">{entry.red_flags?.length || 0}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskPillColor(entry.risk_bucket)}`}
                  >
                    {entry.risk_bucket ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating dropdown menu */}
      {openMenuId && menuPosition &&
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
              onClick={() => handleViewDetail(openMenuId)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Detail
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default RiskTable;
