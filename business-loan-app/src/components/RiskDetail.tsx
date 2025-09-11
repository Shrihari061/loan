import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  subtotal: {
    2023?: number;
    2024?: number;
    2025?: number;
  };
}

interface ManagementQuality {
  score: {
    2023?: number;
    2024?: number;
    2025?: number;
  };
}

interface IndustryRisk {
  score: {
    2023?: number;
    2024?: number;
    2025?: number;
  };
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
  total_score: {
    2023?: number;
    2024?: number;
    2025?: number;
  };
  risk_bucket: {
    2023?: string;
    2024?: string;
    2025?: string;
  };
  red_flags: {
    2023?: string[];
    2024?: string[];
    2025?: string[];
  };
  weights: Weights;
  financial_strength: FinancialStrength;
  management_quality: ManagementQuality;
  industry_risk: IndustryRisk;

  revenue?: number | null;
  net_profit?: number | null;
  total_assets?: number | null;
}

const RiskDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      {/* ✅ Back Button */}
      <div>
        <button
          onClick={() => navigate("/risk")}
          className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          ← Back to Risk Assessment Table
        </button>
      </div>

      {/* Company Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-start">
        {/* Left side: Company details + scores */}
        <div className="space-y-2">
          <p><span className="font-medium">Customer:</span> {data.customer_name}</p>
          <p><span className="font-medium">Lead ID:</span> {data.lead_id}</p>

          <p className="font-medium">Total Score:</p>
          <div className="flex gap-4">
            {["2023", "2024", "2025"].map((year) => {
              const score = data.total_score?.[year as keyof typeof data.total_score];
              let style = "bg-gray-100 text-gray-600";

              if (score !== null && score !== undefined) {
                if (score > 80) {
                  style = "bg-green-100 text-green-700";
                } else if (score >= 50) {
                  style = "bg-yellow-100 text-yellow-700";
                } else {
                  style = "bg-red-100 text-red-700";
                }
              }

              return (
                <span
                  key={year}
                  className={`px-2 py-1 rounded ${style}`}
                >
                  <strong>{year}</strong>: {score ?? "—"} / 100
                </span>
              );
            })}
          </div>
        </div>

        {/* Right side: Reference */}
        <div className="text-base space-y-2">
          <p className="font-semibold mb-2 text-lg">Reference:</p>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-green-500"></span>
            <span><strong>Low Risk</strong> (Score &gt; 80)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-yellow-400"></span>
            <span><strong>Medium Risk</strong> (50–80)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-red-500"></span>
            <span><strong>High Risk</strong> (Score &lt; 50)</span>
          </div>
        </div>
      </div>


      {/* Risk Breakdown */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Risk Breakdown</h3>
        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Component</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">2023</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">2024</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">2025</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">Financial Strength</td>
              <td className="px-4 py-2">{data.financial_strength.subtotals?.["2023"]}</td>
              <td className="px-4 py-2">{data.financial_strength.subtotals?.["2024"]}</td>
              <td className="px-4 py-2">{data.financial_strength.subtotals?.["2025"]}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Management Quality</td>
              <td className="px-4 py-2">{data.management_quality.scores?.["2023"]}</td>
              <td className="px-4 py-2">{data.management_quality.scores?.["2024"]}</td>
              <td className="px-4 py-2">{data.management_quality.scores?.["2025"]}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Industry Risk</td>
              <td className="px-4 py-2">{data.industry_risk.scores?.["2023"]}</td>
              <td className="px-4 py-2">{data.industry_risk.scores?.["2024"]}</td>
              <td className="px-4 py-2">{data.industry_risk.scores?.["2025"]}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Strength Ratios */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Financial Strength Ratios</h3>
        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Ratio</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Threshold</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">2023</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">2024</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">2025</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.financial_strength.scores).map(([ratio, details]) => {
              const isPercentage =
                ["2023", "2024", "2025"].some(
                  (year) =>
                    typeof (details as any)?.[`value_${year}`] === "string" &&
                    (details as any)[`value_${year}`].toString().includes("%")
                );

              return (
                <tr key={ratio}>
                  <td className="px-4 py-2 font-medium">
                    {ratio}{isPercentage && <strong> (%)</strong>}
                  </td>
                  <td className="px-4 py-2">{details?.threshold ?? "—"}</td>
                  {["2023", "2024", "2025"].map((year) => {
                    let val = (details as any)?.[`value_${year}`];
                    if (typeof val === "string" && val.includes("%")) {
                      val = val.replace("%", ""); // strip % sign from displayed values
                    }
                    return (
                      <td key={year} className="px-4 py-2">
                        <div className="flex items-center justify-end relative">
                          <div style={{
                            position: 'absolute',
                            right: '45px',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: (details as any)?.[`red_flag_${year}`] ? '#ef4444' : '#22c55e'
                          }}></div>
                          <span>{val ?? "—"}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      {/* Red Flags */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Red Flags</h3>
        {["2023", "2024", "2025"].map((year) => (
          <div key={year} className="mb-4">
            <p className="font-bold mb-2">{year}</p>
            {data.red_flags?.[year]?.length === 0 ? (
              <p className="text-gray-500">No red flags detected ✅</p>
            ) : (
              <ul className="list-disc list-inside">
                {data.red_flags[year].map((flag: string, i: number) => {
                  // plain text for red flags
                  return <li key={i}>{flag}</li>;
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskDetail;
