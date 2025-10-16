import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { FigtreeContainer, FigtreeTableContainer, FigtreeTableCell, FigtreeTable, NonSortableHeader } from './ReusableComponents';
import { toast } from "sonner";

interface DocumentStatus {
  status: "Pending" | "Approved" | "Rejected";
}

interface QCEntry {
  _id: string;
  customer_id: string;
  customer_name: string; // we’ll map business_name into this
  lead_id: string;
  status: "In progress" | "Approved" | "Rejected";
  documents?: DocumentStatus[];
}

const QCTable: React.FC = () => {
  const [data, setData] = useState<QCEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadAndFilter = async () => {
      try {
        const [leadsRes, analysisRes, ratiosRes, risksRes] = await Promise.all([
          fetch("http://localhost:5000/leads/"),
          fetch("http://localhost:5000/analysis/"),
          fetch("http://localhost:5000/analysis/ratios"),
          fetch("http://localhost:5000/risk/")
        ]);

        const [leads, analysis, ratios, risks] = await Promise.all([
          leadsRes.ok ? leadsRes.json() : [],
          analysisRes.ok ? analysisRes.json() : [],
          ratiosRes.ok ? ratiosRes.json() : [],
          risksRes.ok ? risksRes.json() : []
        ]);

        const normalize = (s: any) => (typeof s === 'string' ? s.trim() : s);

        // Index by lead_id for quick matching
        const leadByLeadId = new Map<string, any>();
        (leads || []).forEach((lead: any) => {
          if (lead && lead.lead_id) leadByLeadId.set(lead.lead_id, lead);
        });

        // Build maps keyed by lead_id
        const analysisByLeadId = new Map<string, any>();
        (analysis || []).forEach((a: any) => {
          if (a && a.lead_id) analysisByLeadId.set(a.lead_id, a);
        });

        const ratiosByLeadId = new Map<string, any>();
        (ratios || []).forEach((r: any) => {
          if (r && r.lead_id) ratiosByLeadId.set(r.lead_id, r);
        });

        const risksByLeadId = new Map<string, any>();
        (risks || []).forEach((rk: any) => {
          if (rk && rk.lead_id) risksByLeadId.set(rk.lead_id, rk);
        });

        // Only include entries where all four sources have the same lead_id and matching names
        const merged: QCEntry[] = [];
        for (const [leadId, lead] of leadByLeadId.entries()) {
          const a = analysisByLeadId.get(leadId);
          const r = ratiosByLeadId.get(leadId);
          const k = risksByLeadId.get(leadId);
          if (!a || !r || !k) continue; // model outputs not ready

          const leadName = normalize(lead.business_name);
          const aName = normalize(a.company_name || a.customer_name);
          const rName = normalize(r.customer_name);
          const kName = normalize(k.customer_name);

          if (!leadName || !aName || !rName || !kName) continue;

          // Strict match: ensure names align across collections for the same lead_id
          if (leadName === aName && leadName === rName && leadName === kName) {
            merged.push({
              _id: lead._id,
              customer_id: lead._id,
              customer_name: leadName,
              lead_id: leadId,
              status: lead.status || "In progress",
              documents: []
            });
          }
        }

        setData(merged);
      } catch (err) {
        console.error("Failed to fetch QC data:", err);
      }
    };

    loadAndFilter();
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

  const handleAction = async (action: string, id: string) => {
    if (action === "View Data") {
      navigate(`/qc/${id}`);
    } else if (action === "Revert") {
      console.log("Reverting QC entry:", id);
      try {
        const res = await fetch(`http://localhost:5000/leads/${id}/revert`, { // updated to /leads
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          setData((prev) =>
            prev.map((entry) =>
              entry._id === id ? { ...entry, status: "In progress" } : entry
            )
          );
          toast.success("QC entry reverted successfully");
        } else {
          console.error("Failed to revert entry");
        }
      } catch (err) {
        console.error("Error while reverting:", err);
      }
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
                <FigtreeTableCell>
                  {(entry.status === "Approved" || entry.status === "Rejected") ? (
                    <button
                      onClick={() => handleAction("Revert", entry._id)}
                      className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction("View Data", entry._id)}
                      className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      View Details
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
