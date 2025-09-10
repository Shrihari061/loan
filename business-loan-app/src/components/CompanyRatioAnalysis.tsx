import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface RatioItem {
  name: string;
  threshold?: string;
  value_2023: number | string | null;
  red_flag_2023?: boolean;
  value_2024: number | string | null;
  red_flag_2024?: boolean;
  value_2025: number | string | null;
  red_flag_2025?: boolean;
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
          threshold: r.threshold,
          value_2023: r.value_2023 ?? null,
          red_flag_2023: r.red_flag_2023,
          value_2024: r.value_2024 ?? null,
          red_flag_2024: r.red_flag_2024,
          value_2025: r.value_2025 ?? null,
          red_flag_2025: r.red_flag_2025,
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
        <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#22c55e', marginRight: '8px', borderRadius: '50%' }}></span>
        <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Good</span>
        <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#f59e0b', marginLeft: '16px', marginRight: '8px', borderRadius: '50%' }}></span>
        <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Moderate</span>
        <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#ef4444', marginLeft: '16px', marginRight: '8px', borderRadius: '50%' }}></span>
        <span style={{ fontSize: '14px', color: '#374151', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Poor</span>
      </div>

      {/* Table Content */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Ratio</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>2023</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>2024</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>2025</th>
            </tr>
          </thead>
          <tbody>
            {ratios.map((ratio, index) => {
              const isPercentage =
                [ratio.value_2023, ratio.value_2024, ratio.value_2025].some(v => typeof v === "string" && v.includes("%"));
              return (
                <tr key={ratio.name} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'left', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    {ratio.name}{isPercentage && <strong> (%)</strong>}
                  </td>
                  {[{year:2023, value:ratio.value_2023, red:ratio.red_flag_2023},
                    {year:2024, value:ratio.value_2024, red:ratio.red_flag_2024},
                    {year:2025, value:ratio.value_2025, red:ratio.red_flag_2025}].map((yr, idx) => (
                    <td key={idx} style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      textAlign: 'right',
                      borderBottom: '1px solid #f3f4f6',
                      fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#111827',
                      position: 'relative'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        paddingRight: '8px'
                      }}>
                        {yr.red && (
                          <div style={{
                            position: 'absolute',
                            right: '70px',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444'
                          }}></div>
                        )}
                        {!yr.red && ratio.threshold && typeof ratio.threshold === "string" && (() => {
                          const numThreshold = parseFloat(ratio.threshold);
                          if (!isNaN(numThreshold) && yr.value !== null && typeof yr.value === 'number') {
                            return yr.value >= numThreshold ? (
                              <div style={{
                                position: 'absolute',
                                right: '70px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: '#22c55e'
                              }}></div>
                            ) : (
                              <div style={{
                                position: 'absolute',
                                right: '70px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: '#f59e0b'
                              }}></div>
                            );
                          }
                          return (
                            <div style={{
                              position: 'absolute',
                              right: '70px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: '#22c55e'
                            }}></div>
                          );
                        })()}
                        {yr.value !== null && yr.value !== undefined 
                          ? typeof yr.value === 'number' 
                            ? yr.value.toFixed(2) 
                            : isPercentage 
                              ? String(yr.value).replace("%", "") 
                              : yr.value 
                          : "N/A"}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyRatioAnalysis;
