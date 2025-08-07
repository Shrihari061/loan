import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const RiskDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/risk/${id}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error:', err));
  }, [id]);

  if (!data) return <div>Loading...</div>;

  const years = ['FY2022', 'FY2023', 'FY2024', 'FY2025'];

  const getValues = (parameterName: string) => {
    const item = data.risk_timeline.find((p: any) => p.parameter === parameterName);
    return years.map(y => {
      const val = item?.[y];
      if (!val) return 0;
      if (val.includes('Days')) return parseInt(val);
      if (val.includes('$') || val.includes('-')) return parseInt(val.replace(/[^0-9\-]/g, ''));
      return 0;
    });
  };

  const netWorth = getValues('Negative Net Worth');
  const netProfit = getValues('Declining Profitability');

  const netChartData = {
    labels: years,
    datasets: [
      {
        label: 'Net Worth',
        data: netWorth,
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      },
      {
        label: 'Net Profit',
        data: netProfit,
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }
    ]
  };

  const inventory = getValues('High Inventory Days');
  const debtor = getValues('High Debtor Days');

  const inventoryChartData = {
    labels: years,
    datasets: [
      {
        label: 'Inventory Days',
        data: inventory,
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
      },
      {
        label: 'Debtor Days',
        data: debtor,
        backgroundColor: 'rgba(255, 159, 64, 0.6)'
      }
    ]
  };

  const riskMap: Record<string, number> = { 'Low': 1, 'Moderate': 2, 'High': 3 };
  const yearlyRisk = years.map((_, index) => {
    const riskLevel = data.risk_timeline.map((r: any) => r.flag)[index] || 'Low';
    return riskMap[riskLevel] || 1;
  });

  const riskChartData = {
    labels: ['2022', '2023', '2024', '2025'],
    datasets: [
      {
        label: 'Risk Level',
        data: yearlyRisk,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.3)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Financial Year' }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Risk Assessment Detail</h2>

      <div style={{ marginBottom: '20px' }}>
        <p><strong>Borrower:</strong> {data.borrower}</p>
        <p><strong>Loan ID:</strong> {data.loan_id}</p>
        <p><strong>Loan Amount:</strong> ₹{data.loan_amount.toLocaleString()}</p>
        <p><strong>Last Updated:</strong> {data.last_updated}</p>
      </div>

      <h3>Risk Timeline</h3>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          marginBottom: '30px',
          border: '1px solid #aaa'
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle}>Risk Check</th>
            {years.map(y => <th key={y} style={cellStyle}>{y}</th>)}
            <th style={cellStyle}>Flag</th>
          </tr>
        </thead>
        <tbody>
          {data.risk_timeline.map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={cellStyle}>{item.parameter}</td>
              {years.map(y => <td key={y} style={cellStyle}>{item[y]}</td>)}
              <td style={cellStyle}>{item.flag}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1%' }}>
        <div style={{ width: '33%', height: '300px' }}>
          <Bar data={netChartData} options={chartOptions} />
        </div>
        <div style={{ width: '33%', height: '300px' }}>
          <Bar data={inventoryChartData} options={chartOptions} />
        </div>
        <div style={{ width: '33%', height: '300px' }}>
          <Line data={riskChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

const cellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'center'
};

export default RiskDetail;
