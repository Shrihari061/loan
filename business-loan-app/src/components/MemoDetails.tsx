import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

  const renderList = (items: unknown) => {
    let listItems: string[] = [];

    if (Array.isArray(items)) {
      listItems = items.map(item => String(item));
    } else if (typeof items === 'string') {
      listItems = items.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
    } else if (typeof items === 'object' && items !== null) {
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

  const renderTextWithSemicolons = (text: string) => {
    const parts = text.split(/;|\.\s+/).map(p => p.trim()).filter(Boolean);

    return parts.map((part, idx) => (
      <p key={idx} className="text-gray-700 leading-relaxed">
        {part}
      </p>
    ));
  };

  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen py-6">
      {/* Header */}
      <div className="flex items-center px-6 py-4 shadow bg-white mx-6 rounded-xl">
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

      {/* Top Section */}
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
          <div>
            <p className="text-sm text-gray-500">Loan Type</p>
            <p className="font-medium">{memo.loan_type ? String(memo.loan_type) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Score</p>
            <p className="font-medium">
              {memo.total_score
                ? typeof memo.total_score === "object"
                  ? Object.entries(memo.total_score as Record<string, unknown>)
                    .map(([year, score]) => `${year}: ${score}`)
                    .join(", ")
                  : String(memo.total_score)
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 mt-4 mx-6">
        {/* Executive Summary */}
        {memo.executive_summary && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
            {renderTextWithSemicolons(String(memo.executive_summary))}
          </div>
        )}

        {/* Financial Summary & Ratios */}
        {memo["financial_summary_&_ratios"] && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">
              Financial Summary and Ratios
            </h3>
            <div className="text-gray-700">
              {renderTextWithSemicolons(String(memo["financial_summary_&_ratios"]))}
            </div>
          </div>
        )}

        {/* Loan Purpose */}
        {memo.loan_purpose && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Loan Purpose</h3>
            <div className="text-gray-700">
              {renderTextWithSemicolons(String(memo.loan_purpose))}
            </div>
          </div>
        )}

        {/* SWOT Analysis */}
        {memo.swot_analysis && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">SWOT Analysis</h3>
            <div className="text-gray-700">
              {renderTextWithSemicolons(String(memo.swot_analysis))}
            </div>
          </div>
        )}

        {/* Security Offered */}
        {memo.security_offered && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Security Offered</h3>
            <div className="text-gray-700">
              {renderTextWithSemicolons(String(memo.security_offered))}
            </div>
          </div>
        )}

        {/* Catch-all */}
        {Object.entries(memo).map(([key, value]) => {
          if (
            [
              "_id", "memo_id", "lead_id", "customer_name", "created_by", "last_updated",
              "status", "loan_purpose_table", "executive_summary", "financial_summary_&_ratios",
              "loan_purpose", "swot_analysis", "security_offered", "recommendation",
              "attachments", "created_at", "updated_at", "createdAt", "updatedAt",
              "loan_type", "total_score", "__v",
            ].includes(key)
          ) {
            return null;
          }

          return (
            <div key={key} className="bg-white p-6 shadow rounded-xl">
              <h3 className="text-lg font-semibold mb-2">{key}</h3>
              {Array.isArray(value)
                ? renderList(value)
                : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : <div>{renderTextWithSemicolons(String(value))}</div>}
            </div>
          );
        })}

        {/* Recommendation */}
        {memo.recommendation && (
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Recommendation</h3>
            <div className="text-gray-700">
              {renderTextWithSemicolons(String(memo.recommendation))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 mx-6 flex gap-4 justify-end">
        <button
          onClick={handleApprove}
          disabled={isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'text-white hover:opacity-90'
          }`}
          style={{
            backgroundColor:
              isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'
                ? '#d1d5db'
                : '#0266F4'
          }}
        >
          {String(memo.status) === 'Approved' ? 'Approved' : 'Approve'}
        </button>
        <button
          onClick={handleDecline}
          disabled={isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'text-white hover:opacity-90'
          }`}
          style={{
            backgroundColor:
              isActionDisabled || String(memo.status) === 'Approved' || String(memo.status) === 'Declined'
                ? '#d1d5db'
                : '#00306E'
          }}
        >
          {String(memo.status) === 'Declined' ? 'Declined' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
