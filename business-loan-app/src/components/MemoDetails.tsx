import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, UserCircle2 } from "lucide-react";
import axios from "axios";

export default function MemoDetails() {
  const { id } = useParams();
  const [memo, setMemo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:5000/memos/${id}`)
      .then((res) => setMemo(res.data))
      .catch((err) => console.error("Error fetching memo:", err));
  }, [id]);

  if (!memo) {
    return <div className="p-6">Loading memo data...</div>;
  }

  const renderKeyValueSection = (section: any) => {
    return Object.entries(section)
      .filter(([key]) => key !== 'observation' && key !== 'profit_margin')
      .map(([key, val]) => (
        <p key={key} className="text-sm mb-1">
          <strong>{key}:</strong> {val}
        </p>
      ));
  };


  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen py-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shadow bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Appraisal Memo Detail</h1>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="h-5 w-5 text-gray-600" />
          <UserCircle2 className="h-6 w-6 text-gray-600" />
        </div>
      </div>

      {/* Top Section */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <p className="text-sm text-gray-500">Memo ID</p>
              <p className="font-medium">{memo.memo_id}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{memo.created_by}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{memo.last_updated}</p>
              </div>
            </div>
          </div>

          <div className="w-px bg-gray-300" />

          <div className="flex-[2] grid grid-cols-2 gap-x-8 gap-y-4 grid-flow-row-dense">
            <div>
              <p className="text-sm text-gray-500">Loan ID</p>
              <p className="font-medium">{memo.loan_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Loan Amount</p>
              <p className="font-medium">{memo.loan_amount}</p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Borrower</p>
              <p className="font-medium">{memo.borrower}</p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Loan Purpose</p>
              <p className="font-medium">{memo.loan_purpose_table}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Loan Type</p>
              <p className="font-medium">{memo.loan_type}</p>
            </div>
            <div className="invisible" />
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
        <p>{memo.executive_summary}</p>
      </div>

      {/* Financial Analysis */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Financial Analysis</h3>

        {/* Revenue */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Revenue</h4>
          {renderKeyValueSection(memo.financial_analysis.revenue)}
          <p className="mt-2 text-sm text-gray-600 italic">
            {memo.financial_analysis.revenue.observation}
          </p>
        </div>

        {/* Profitability */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Profitability</h4>
          {renderKeyValueSection(memo.financial_analysis.profitability)}
          <div className="text-sm text-gray-600 mt-1">
            <p><strong>Profit Margin:</strong> {memo.financial_analysis.profitability.profit_margin}</p>
            <p className="italic">{memo.financial_analysis.profitability.observation}</p>
          </div>
        </div>

        {/* Liquidity */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Liquidity</h4>
          <div className="flex justify-between py-1 border-b text-sm">
            <span>Current Ratio FY24</span>
            <span>{memo.financial_analysis.liquidity.current_ratio_fy24}</span>
          </div>
          <div className="flex justify-between py-1 border-b text-sm">
            <span>Current Ratio FY25</span>
            <span>{memo.financial_analysis.liquidity.current_ratio_fy25}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 italic">
            {memo.financial_analysis.liquidity.observation}
          </p>
        </div>

        {/* Debt Service Capacity */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Debt Service Capacity (DSCR)</h4>
          {memo.financial_analysis.debt_service_capacity.dscr.map((item: any) => (
            <div key={item.year} className="flex justify-between py-1 border-b text-sm">
              <span>{item.year}</span>
              <span>{item.value}</span>
            </div>
          ))}
          <p className="mt-2 text-sm text-gray-600 italic">
            {memo.financial_analysis.debt_service_capacity.observation}
          </p>
        </div>

        {/* Summary Highlights */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Summary Highlights</h4>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {memo.financial_analysis.summary_highlights.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">SWOT Analysis</h3>
        {Object.entries(memo.SWOT_analysis).map(([key, value]) => (
          <div key={key} className="mb-4">
            <strong className="block text-gray-700 mb-1 capitalize">{key}</strong>
            <ul className="list-disc pl-5">
              {(value as string[]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Security Offered */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Security Offered</h3>
        <div className="mb-3">
          <strong className="block mb-1">Primary</strong>
          <ul className="list-disc pl-5">
            {memo.security_offered.primary.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="mb-3">
          <strong className="block mb-1">Collateral</strong>
          <p>Description: {memo.security_offered.collateral.description}</p>
          <p>Valuation: {memo.security_offered.collateral.valuation}</p>
          <p>Valuation Date: {memo.security_offered.collateral.valuation_date}</p>
        </div>
        <div className="mb-3">
          <strong className="block mb-1">Personal Guarantees</strong>
          <ul className="list-disc pl-5">
            {memo.security_offered.personal_guarantees.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white p-6 shadow mt-4 mx-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Recommendation</h3>
        <p><strong>Tenor:</strong> {memo.recommendation.tenor}</p>
        <p><strong>Repayment Terms:</strong> {memo.recommendation.repayment_terms}</p>
        <p><strong>Interest Rate Policy:</strong> {memo.recommendation.interest_rate_policy}</p>
        <div className="mt-2">
          <strong className="block mb-1">Covenants:</strong>
          <ul className="list-disc pl-5">
            {memo.recommendation.covenants.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
