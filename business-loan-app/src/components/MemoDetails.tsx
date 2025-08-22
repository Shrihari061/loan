import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, UserCircle2 } from "lucide-react";
import axios from "axios";

export default function MemoDetails() {
  const { id } = useParams<{ id: string }>();
  const [memo, setMemo] = useState<Record<string, unknown> | null>(null);
  const [isActionDisabled, setIsActionDisabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:5000/memos/${id}`)
      .then((res) => setMemo(res.data))
      .catch((err) => console.error("Error fetching memo:", err));
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    
    setIsActionDisabled(true);
    try {
      await axios.put(`http://localhost:5000/memos/${id}`, {
        status: 'Approved'
      });
      
      // Update local state
      setMemo(prev => prev ? { ...prev, status: 'Approved' } : null);
      alert('Memo approved successfully!');
    } catch (error) {
      console.error('Error approving memo:', error);
      alert('Failed to approve memo. Please try again.');
      setIsActionDisabled(false);
    }
  };

  const handleDecline = async () => {
    if (!id) return;
    
    setIsActionDisabled(true);
    try {
      await axios.put(`http://localhost:5000/memos/${id}`, {
        status: 'Declined'
      });
      
      // Update local state
      setMemo(prev => prev ? { ...prev, status: 'Declined' } : null);
      alert('Memo declined successfully!');
    } catch (error) {
      console.error('Error declining memo:', error);
      alert('Failed to decline memo. Please try again.');
      setIsActionDisabled(false);
    }
  };

  if (!memo) {
    return <div className="p-6">Loading memo data...</div>;
  }

  // helper to render list-based fields
  const renderList = (items: unknown) => {
    // Handle different data formats
    let listItems: string[] = [];
    
    if (Array.isArray(items)) {
      listItems = items.map(item => String(item));
    } else if (typeof items === 'string') {
      // If it's a string, split by newlines or commas
      listItems = items.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
    } else if (typeof items === 'object' && items !== null) {
      // If it's an object, try to extract values
      listItems = Object.values(items).map(item => String(item));
    }
    
    if (listItems.length === 0) {
      return <p className="text-gray-500">No data available</p>;
    }
    
    return (
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {listItems.map((item, idx) => (
          <li key={idx} className="leading-relaxed">{item}</li>
        ))}
      </ul>
    );
  };

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
      </div>

      {/* Top Section (basic info) */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Customer Name</p>
            <p className="font-medium">{String(memo.customer_name)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lead ID</p>
            <p className="font-medium">{String(memo.lead_id)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{String(memo.created_by)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{String(memo.status)}</p>
          </div>
        </div>
      </div>

      {/* Loop through each major section dynamically */}
      <div className="space-y-6 mt-4 mx-6">
        {/* Executive Summary */}
        {memo.executive_summary && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
            <p>{String(memo.executive_summary)}</p>
          </div>
        )}

        {/* Financial Summary & Ratios */}
        {memo.financial_summary_and_ratios && typeof memo.financial_summary_and_ratios === 'object' && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">
              Financial Summary & Ratios
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(memo.financial_summary_and_ratios as Record<string, unknown>).map(
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
        {Array.isArray(memo.loan_purpose) && memo.loan_purpose.length > 0 && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Loan Purpose</h3>
            {renderList(memo.loan_purpose)}
          </div>
        )}

        {/* SWOT Analysis */}
        {memo.swot_analysis && typeof memo.swot_analysis === 'object' && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">SWOT Analysis</h3>
            {Object.entries(memo.swot_analysis as Record<string, unknown>).map(([key, values]) => (
              <div key={key} className="mb-4">
                <strong className="block text-gray-700 mb-1">{key}</strong>
                {renderList(values)}
              </div>
            ))}
          </div>
        )}

        {/* Security Offered
        {memo.security_offered && typeof memo.security_offered === 'object' && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Security Offered</h3>
            {Array.isArray((memo.security_offered as any).primary_security) && (memo.security_offered as any).primary_security.length > 0 && (
              <div className="mb-3">
                <strong className="block mb-1">Primary</strong>
                {renderList((memo.security_offered as any).primary_security)}
              </div>
            )}
            {Array.isArray((memo.security_offered as any).collateral_security) && (memo.security_offered as any).collateral_security.length > 0 && (
              <div className="mb-3">
                <strong className="block mb-1">Collateral</strong>
                {renderList((memo.security_offered as any).collateral_security)}
              </div>
            )}
            {Array.isArray((memo.security_offered as any).personal_guarantees) && (memo.security_offered as any).personal_guarantees.length > 0 && (
              <div className="mb-3">
                <strong className="block mb-1">Personal Guarantees</strong>
                {renderList((memo.security_offered as any).personal_guarantees)}
              </div>
            )}
          </div>
        )} }

        {/* Recommendation */}
        {Array.isArray(memo.recommendation) && memo.recommendation.length > 0 && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Recommendation</h3>
            {renderList(memo.recommendation)}
          </div>
        )}

        {/* Loan Type */}
        {memo.loan_type && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Loan Type</h3>
            <p className="text-gray-700">{String(memo.loan_type)}</p>
          </div>
        )}

        {/* Created at */}
        {(memo.createdAt || memo.created_at) && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Created at</h3>
            <p className="text-gray-700">
              {(() => {
                try {
                  const date = new Date(String(memo.createdAt || memo.created_at));
                  if (isNaN(date.getTime())) {
                    return String(memo.createdAt || memo.created_at || 'N/A');
                  }
                  
                  // Convert to IST (UTC+5:30)
                  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                  
                  // Format as YYYY-MM-DD HH:MM:SS
                  const year = istDate.getFullYear();
                  const month = String(istDate.getMonth() + 1).padStart(2, '0');
                  const day = String(istDate.getDate()).padStart(2, '0');
                  const hours = String(istDate.getHours()).padStart(2, '0');
                  const minutes = String(istDate.getMinutes()).padStart(2, '0');
                  const seconds = String(istDate.getSeconds()).padStart(2, '0');
                  
                  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                } catch {
                  return String(memo.createdAt || memo.created_at || 'N/A');
                }
              })()}
            </p>
          </div>
        )}

        {/* Updated at */}
        {(memo.updatedAt || memo.updated_at || memo.last_updated) && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Updated at</h3>
            <p className="text-gray-700">
              {(() => {
                try {
                  const date = new Date(String(memo.updatedAt || memo.updated_at || memo.last_updated));
                  if (isNaN(date.getTime())) {
                    return String(memo.updatedAt || memo.updated_at || memo.last_updated || 'N/A');
                  }
                  
                  // Convert to IST (UTC+5:30)
                  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                  
                  // Format as YYYY-MM-DD HH:MM:SS
                  const year = istDate.getFullYear();
                  const month = String(istDate.getMonth() + 1).padStart(2, '0');
                  const day = String(istDate.getDate()).padStart(2, '0');
                  const hours = String(istDate.getHours()).padStart(2, '0');
                  const minutes = String(istDate.getMinutes()).padStart(2, '0');
                  const seconds = String(istDate.getSeconds()).padStart(2, '0');
                  
                  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                } catch {
                  return String(memo.updatedAt || memo.updated_at || memo.last_updated || 'N/A');
                }
              })()}
            </p>
          </div>
        )}

        {/* Catch-all for any extra fields not explicitly listed */}
        {Object.entries(memo).map(([key, value]) => {
          if (
            [
              "_id",
              "memo_id",
              "lead_id",
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
              "createdAt",        // 🚫 exclude createdAt (shown separately)
              "updatedAt",        // 🚫 exclude updatedAt (shown separately)
              "loan_type",        // 🚫 exclude loan_type (shown separately)
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

      {/* Action Buttons */}
      <div className="mt-8 mx-6 flex gap-4 justify-end">
        <button
          onClick={handleApprove}
          disabled={isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {String(memo.status) === 'Approved' ? 'Approved' : 'Approve'}
        </button>
        <button
          onClick={handleDecline}
          disabled={isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {String(memo.status) === 'Declined' ? 'Declined' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
