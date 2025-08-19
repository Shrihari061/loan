import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface ScoreEntry {
  value: number;
  threshold: string;
  red_flag: boolean;
  score: number;
  max: number;
}

interface FinancialStrength {
  per_ratio_max: number;
  scores: {
    [key: string]: ScoreEntry;
  };
  subtotal: number;
}

interface ManagementQuality {
  score: number;
}

interface IndustryRisk {
  score: number;
}

interface Weights {
  financial_strength: number;
  management_quality: number;
  industry_risk: number;
}

interface RiskDetailData {
  _id: string;
  customer_name: string;
  lead_id: string;
  total_score: number;
  risk_bucket: string;
  red_flags: string[];
  weights: Weights;
  financial_strength: FinancialStrength;
  management_quality: ManagementQuality;
  industry_risk: IndustryRisk;
}

const RiskDetail: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<RiskDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/risk/${id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (!data) return <div className="p-6 text-red-600">Data not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Company Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
        <p><span className="font-medium">Customer:</span> {data.customer_name}</p>
        <p><span className="font-medium">Lead ID:</span> {data.lead_id}</p>
        <p>
          <span className="font-medium">Total Score:</span> {data.total_score} / 100
        </p>
        <p>
          <span className="font-medium">Risk Bucket:</span>{" "}
          <span
            className={`px-2 py-1 rounded ${
              data.risk_bucket === "Low Risk"
                ? "bg-green-100 text-green-700"
                : data.risk_bucket === "Medium Risk"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {data.risk_bucket}
          </span>
        </p>
      </div>

      {/* Risk Breakdown */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Risk Breakdown</h3>
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Component</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Weight</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Score</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Max</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-2">Financial Strength</td>
              <td className="px-4 py-2">{data.weights.financial_strength}%</td>
              <td className="px-4 py-2">{data.financial_strength.subtotal}</td>
              <td className="px-4 py-2">{data.weights.financial_strength}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2">Management Quality</td>
              <td className="px-4 py-2">{data.weights.management_quality}%</td>
              <td className="px-4 py-2">{data.management_quality.score}</td>
              <td className="px-4 py-2">{data.weights.management_quality}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Industry Risk</td>
              <td className="px-4 py-2">{data.weights.industry_risk}%</td>
              <td className="px-4 py-2">{data.industry_risk.score}</td>
              <td className="px-4 py-2">{data.weights.industry_risk}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Strength Ratios */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Financial Strength Ratios</h3>
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Ratio</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Value</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Threshold</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Score</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Max</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Flag</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.financial_strength.scores).map(([ratio, details]) => (
              <tr key={ratio} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{ratio}</td>
                <td className="px-4 py-2">{details.value}</td>
                <td className="px-4 py-2">{details.threshold}</td>
                <td className="px-4 py-2">{details.score}</td>
                <td className="px-4 py-2">{details.max}</td>
                <td className="px-4 py-2">
                  {details.red_flag ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded">⚠️</span>
                  ) : (
                    <span className="text-green-600">✔</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Red Flags */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Red Flags</h3>
        {data.red_flags.length === 0 ? (
          <p className="text-gray-500">No red flags detected ✅</p>
        ) : (
          <ul className="list-disc list-inside text-red-600">
            {data.red_flags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RiskDetail;
