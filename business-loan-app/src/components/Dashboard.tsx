// components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

type DashboardData = {
  monthly_breakdown: Record<string, number>;
  applications_summary: { in_progress: number; rejected: number; approved: number; };
  risk_category_breakdown: Record<string, number>;
  total_applicants: number;
  recent_applications: {
    borrower: string;
    loan_type: string;
    amount: number;
    risk_level: string;
    status: string;
  }[];
  year: number;
};

const Dashboard: React.FC = () => {
  const [dataList, setDataList] = useState<DashboardData[]>([]);
  const [selected, setSelected] = useState<DashboardData | null>(null);

  useEffect(() => {
    axios.get<DashboardData[]>('http://localhost:5000/dashboard/')
      .then(res => setDataList(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (dataList.length) {
      setSelected(dataList[0]);
    }
  }, [dataList]);

  if (!selected) return <div>Loading...</div>;

  const months = Object.keys(selected.monthly_breakdown);
  const monthlyValues = Object.values(selected.monthly_breakdown);

  const lineData = {
    labels: months,
    datasets: [{
      label: 'Applications',
      data: monthlyValues,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.2)',
      tension: 0.3,
      fill: false,
    }]
  };

  const riskLabels = Object.keys(selected.risk_category_breakdown);
  const riskValues = Object.values(selected.risk_category_breakdown);
  const colors = ['#1E40AF', '#60A5FA', '#2563EB'];

  const doughnutData = {
    labels: riskLabels,
    datasets: [{
      data: riskValues,
      backgroundColor: colors,
      hoverOffset: 4,
    }]
  };

  return (
    <div className="space-y-6 bg-gray-100 p-4 rounded-md">
      {/* Header & Year Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={selected.year}
          onChange={e => {
            const year = parseInt(e.target.value);
            const found = dataList.find(d => d.year === year);
            if (found) setSelected(found);
          }}
        >
          {dataList.map(d => (
            <option key={d.year} value={d.year}>{d.year}</option>
          ))}
        </select>
      </div>

      {/* Total Applicants + Monthly Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-2">Total Applicants</h3>
          <p className="text-4xl font-bold">{selected.total_applicants}</p>
          <h4 className="font-medium mb-2 mt-4">Monthly Breakdown</h4>
          <div className="h-48">
            <Line data={lineData} options={{ plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Applications Summary & Recent */}
        <div className="bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">Applications</h3>
          <div className="flex justify-between mb-6 text-center">
            <div><p className="text-xl font-bold">{selected.applications_summary.in_progress}</p><p className="text-sm">In progress</p></div>
            <div><p className="text-xl font-bold">{selected.applications_summary.rejected}</p><p className="text-sm">Rejected</p></div>
            <div><p className="text-xl font-bold">{selected.applications_summary.approved}</p><p className="text-sm">Approved</p></div>
          </div>
          <h4 className="font-medium mb-2">Recent Applications</h4>
          <div className="space-y-2 text-sm">
            {selected.recent_applications.map((app, i) => (
              <div key={i} className="flex justify-between">
                <span>{app.borrower} — <span className="text-gray-500">{app.loan_type}</span></span>
                <span>${app.amount.toLocaleString()} • {app.risk_level} • {app.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="bg-white shadow rounded p-6">
        <h3 className="text-lg font-semibold mb-4">Loan Risk Category Breakdown</h3>
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-40 h-40 mb-4 md:mb-0">
            <Doughnut data={doughnutData} />
          </div>
          <div className="flex flex-col space-y-1 text-sm">
            {riskLabels.map((l, idx) => (
              <div key={l} className="flex items-center gap-2">
                <span style={{ background: colors[idx] }} className="w-3 h-3 inline-block rounded-full"/>
                <span>{l} – {riskValues[idx]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
