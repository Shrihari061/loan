import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface RatioItem {
  name: string;
  value: number | null;
  threshold?: string;
  red_flag?: boolean;
}

const getCellColor = (ratio: RatioItem) => {
  if (ratio.red_flag) return "bg-blue-900 text-white"; // 🔴 replaced red → dark blue
  if (ratio.threshold && typeof ratio.threshold === "string") {
    const numThreshold = parseFloat(ratio.threshold);
    if (!isNaN(numThreshold) && ratio.value !== null) {
      return ratio.value >= numThreshold
        ? "bg-cyan-100 text-cyan-800" // 🟢 replaced green → cyan/light blue
        : "bg-blue-100 text-blue-800"; // 🟠 replaced orange/yellow → blue
    }
  }
  return "bg-cyan-100 text-cyan-800"; // default to cyan/light blue
};

const CompanyRatioAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ratios, setRatios] = useState<RatioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatios = async () => {
      try {
        const res = await fetch(`http://localhost:5000/analysis/${id}/ratios`);
        const data = await res.json();

        const transformed: RatioItem[] = data.map((r: any) => ({
          name: r.name,
          value: r.value ?? null,
          threshold: r.threshold,
          red_flag: r.red_flag,
        }));

        setRatios(transformed);
      } catch (error) {
        console.error("Error fetching ratios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatios();
  }, [id]);

  if (loading) return <div className="p-4">Loading ratios...</div>;

  return (
    <div className="px-6">
      {/* Legend */}
      <div className="mb-4">
        <span className="inline-block w-4 h-4 bg-cyan-400 mr-2 rounded-sm" /> Good
        <span className="inline-block w-4 h-4 bg-blue-400 ml-4 mr-2 rounded-sm" /> Moderate
        <span className="inline-block w-4 h-4 bg-blue-900 ml-4 mr-2 rounded-sm" /> Poor
      </div>

      {/* Ratios Table */}
      <table className="min-w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left w-1/2">Ratio</th>
            <th className="border px-4 py-2 text-center w-1/2">Current Year</th>
          </tr>
        </thead>
        <tbody>
          {ratios.map((ratio) => (
            <tr key={ratio.name}>
              <td className="border px-4 py-2 font-medium">{ratio.name}</td>
              <td
                className={`border px-4 py-2 text-center ${getCellColor(ratio)}`}
              >
                {ratio.value ?? "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyRatioAnalysis;
