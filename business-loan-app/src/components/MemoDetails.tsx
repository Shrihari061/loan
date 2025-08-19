import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, UserCircle2 } from "lucide-react";
import axios from "axios";

export default function MemoDetails() {
  const { id } = useParams();
  const [memo, setMemo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:5000/memos/${id}`)
      .then((res) => setMemo(res.data))
      .catch((err) => console.error("Error fetching memo:", err));
  }, [id]);

  if (!memo) {
    return <div className="p-6">Loading memo data...</div>;
  }

  // helper to render list-based fields
  const renderList = (items: string[]) => (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen py-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shadow bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Appraisal Memo Detail</h1>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="h-5 w-5 text-gray-600" />
          <UserCircle2 className="h-6 w-6 text-gray-600" />
        </div>
      </div>

      {/* Top Section (basic info) */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Memo ID</p>
            <p className="font-medium">{memo.memo_id || memo._id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Customer Name</p>
            <p className="font-medium">{memo.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Loan ID</p>
            <p className="font-medium">{memo.loan_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{memo.created_by}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium">{memo.last_updated}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{memo.status}</p>
          </div>
        </div>
      </div>

      {/* Loop through each major section dynamically */}
      <div className="space-y-6 mt-4 mx-6">
        {/* Executive Summary */}
        {memo.executive_summary && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
            <p>{memo.executive_summary}</p>
          </div>
        )}

        {/* Financial Summary & Ratios */}
        {memo.financial_summary_and_ratios && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">
              Financial Summary & Ratios
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(memo.financial_summary_and_ratios).map(
                  ([key, value]) => (
                    <tr key={key} className="border-b last:border-none">
                      <td className="py-2 pr-4 font-medium text-gray-700 w-1/2">
                        {key}
                      </td>
                      <td className="py-2 text-gray-900">{String(value)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}


        {/* Loan Purpose */}
        {memo.loan_purpose?.length > 0 && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Loan Purpose</h3>
            {renderList(memo.loan_purpose)}
          </div>
        )}

        {/* SWOT Analysis */}
        {memo.swot_analysis && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">SWOT Analysis</h3>
            {Object.entries(memo.swot_analysis).map(([key, values]) => (
              <div key={key} className="mb-4">
                <strong className="block text-gray-700 mb-1">{key}</strong>
                {renderList(values as string[])}
              </div>
            ))}
          </div>
        )}

        {/* Security Offered */}
        {memo.security_offered && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Security Offered</h3>
            {memo.security_offered.primary_security?.length > 0 && (
              <div className="mb-3">
                <strong className="block mb-1">Primary</strong>
                {renderList(memo.security_offered.primary_security)}
              </div>
            )}
            {memo.security_offered.collateral_security?.length > 0 && (
              <div className="mb-3">
                <strong className="block mb-1">Collateral</strong>
                {renderList(memo.security_offered.collateral_security)}
              </div>
            )}
            {memo.security_offered.personal_guarantees?.length > 0 && (
              <div className="mb-3">
                <strong className="block mb-1">Personal Guarantees</strong>
                {renderList(memo.security_offered.personal_guarantees)}
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        {memo.recommendation?.length > 0 && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Recommendation</h3>
            {renderList(memo.recommendation)}
          </div>
        )}

        {/* Catch-all for any extra fields not explicitly listed */}
        {Object.entries(memo).map(([key, value]) => {
          if (
            [
              "_id",
              "memo_id",
              "loan_id",
              "customer_name",
              "created_by",
              "last_updated",
              "status",
              "loan_purpose_table",
              "executive_summary",
              "financial_summary_and_ratios",
              "loan_purpose",
              "swot_analysis",
              "security_offered",
              "recommendation",
              "attachments",      // 🚫 exclude attachments
              "created_at",       // 🚫 exclude created_at
              "updated_at",       // 🚫 exclude updated_at
              "__v",
            ].includes(key)
          ) {
            return null; // skip ones already shown
          }

          return (
            <div key={key} className="bg-white p-6 shadow rounded-xl">
              <h3 className="text-lg font-semibold mb-2">{key}</h3>
              {Array.isArray(value)
                ? renderList(value)
                : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
