import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface RatioItem {
  name: string;
  value: number | null;
  threshold?: string;
  red_flag?: boolean;
}



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
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Table Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          Ratio Analysis & Health Check
        </h3>
      </div>

      {/* Legend */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: '#00bcd4', marginRight: '8px', borderRadius: '2px' }}></span>
        <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Good</span>
        <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: '#2196f3', marginLeft: '16px', marginRight: '8px', borderRadius: '2px' }}></span>
        <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Moderate</span>
        <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: '#1a237e', marginLeft: '16px', marginRight: '8px', borderRadius: '2px' }}></span>
        <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Poor</span>
      </div>

      {/* Table Content */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Ratio</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Current Year</th>
            </tr>
          </thead>
          <tbody>
            {ratios.map((ratio, index) => (
              <tr key={ratio.name} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'left', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {ratio.name}
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  fontSize: '14px', 
                  textAlign: 'right', 
                  borderBottom: '1px solid #f3f4f6', 
                  fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  backgroundColor: ratio.red_flag ? '#1a237e' : 
                    ratio.threshold && typeof ratio.threshold === "string" ? 
                      (() => {
                        const numThreshold = parseFloat(ratio.threshold);
                        if (!isNaN(numThreshold) && ratio.value !== null) {
                          return ratio.value >= numThreshold ? '#e0f7fa' : '#e3f2fd';
                        }
                        return '#e0f7fa';
                      })() : '#e0f7fa',
                  color: ratio.red_flag ? '#fff' : '#111827'
                }}>
                  {ratio.value !== null && ratio.value !== undefined 
                    ? typeof ratio.value === 'number' 
                      ? ratio.value.toFixed(2) 
                      : ratio.value 
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyRatioAnalysis;
