import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const COLORS = ['#4CAF50', '#FFC107', '#F44336'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:5000/dashboard'); // Adjust if needed
        setData(response.data[0]); // first object from array
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) {
    return <div className="p-6">Loading...</div>;
  }

  // ---- Top Cards ----
  const topCards = [
    {
      title: 'Total Disbursement',
      value: data.top_cards.total_disbursement.value,
      change: data.top_cards.total_disbursement.change
    },
    {
      title: 'Companies in Draft',
      value: data.top_cards.companies_in_draft.value,
      change: data.top_cards.companies_in_draft.change
    },
    {
      title: 'Financial Capture Stage',
      value: data.top_cards.financial_capture_stage.value,
      change: data.top_cards.financial_capture_stage.change
    },
    {
      title: 'Rejected Companies',
      value: data.top_cards.rejected_companies.value,
      change: data.top_cards.rejected_companies.change
    }
  ];

  // ---- Chart Data Prep ----
  const monthlyDisbursementData = Object.entries(data.monthly_disbursement).map(([month, value]) => ({
    month,
    value
  }));

  const riskCategoryData = Object.entries(data.risk_category_breakdown).map(([label, value]) => ({
    name: label,
    value
  }));

  const applicationPipelineData = Object.entries(data.application_pipeline).map(([stage, value]) => ({
    stage,
    value
  }));

  const pendingProgressData = Object.entries(data.pending_progress).map(([label, value]) => ({
    label,
    value
  }));

  return (
    <div className="space-y-10">
      {/* ---- Top Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topCards.map((card, idx) => (
          <div key={idx} className="bg-white shadow rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{card.value.toLocaleString()}</p>
            <p
              className={`text-sm mt-1 ${card.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {card.change >= 0 ? '+' : ''}
              {card.change}% from last month
            </p>
          </div>
        ))}
      </div>

      {/* ---- First Row of Charts ---- */}
      <div className="flex flex-col md:flex-row gap-6 h-96">
        {/* Line Chart */}
        <div className="md:w-7/10 w-full bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Monthly Disbursement</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyDisbursementData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="md:w-3/10 w-full bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold mb-4 text-center">Risk Category Breakdown</h2>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={riskCategoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                label
              >
                {riskCategoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---- Second Row of Charts ---- */}
      <div className="flex flex-col md:flex-row gap-6 h-96">
        {/* Bar Chart - Application Pipeline */}
        <div className="md:w-7/10 w-full bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Application Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={applicationPipelineData}>
              <XAxis
                dataKey="stage"
                interval={0} // <-- show all labels
                tick={{ fontSize: 11, angle: 0, dy: 10 }} // <-- smaller text, spacing
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1D4ED8" barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Progress */}
        <div className="md:w-3/10 w-full bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Pending</h2>
          <div className="space-y-4">
            {pendingProgressData.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-medium">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Third Row ---- */}
<div className="flex flex-col md:flex-row gap-6 h-80">
  {/* Total Applicants Line Chart - 35% Width, No Y-axis */}
  <div className="md:w-[35%] w-full bg-white rounded-lg shadow p-4">
    <h2 className="text-lg font-semibold mb-4">Total Applicants</h2>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={Object.entries(data.monthly_breakdown).map(([month, value]) => ({
          month,
          value
        }))}
      >
        <XAxis
  dataKey="month"
  interval={0} // force show all months
  tick={{ fontSize: 11 }}
  tickMargin={10}
  angle={-25} // rotate labels
  textAnchor="end"
/>

        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#1D4ED8"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* Applications Summary + Recent Applications Table - 70% Width */}
  <div className="md:w-[70%] w-full bg-white rounded-lg shadow p-4 overflow-auto">
    {/* Top Stats Row */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-50 p-4 rounded shadow-sm text-center">
        <h3 className="text-xs text-gray-500">In Progress</h3>
        <p className="text-lg font-semibold">{data.applications_summary.in_progress}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded shadow-sm text-center">
        <h3 className="text-xs text-gray-500">Rejected</h3>
        <p className="text-lg font-semibold">{data.applications_summary.rejected}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded shadow-sm text-center">
        <h3 className="text-xs text-gray-500">Approved</h3>
        <p className="text-lg font-semibold">{data.applications_summary.approved}</p>
      </div>
    </div>

    {/* Recent Applications Table */}
    <h2 className="text-lg font-semibold mb-4 flex justify-between items-center">
      Recent Applications
      <button className="text-blue-600 hover:underline text-sm">
        View All
      </button>
    </h2>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2">Borrower</th>
          <th className="text-left py-2">Loan Type</th>
          <th className="text-left py-2">Amount</th>
          <th className="text-left py-2">Risk</th>
          <th className="text-left py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.recent_applications.map((app: any) => (
          <tr key={app._id} className="border-b hover:bg-gray-50">
            <td className="py-2">{app.borrower}</td>
            <td className="py-2">{app.loan_type}</td>
            <td className="py-2">₹{app.amount.toLocaleString()}</td>
            <td
              className={`py-2 font-medium ${
                app.risk_level === 'Low'
                  ? 'text-green-600'
                  : app.risk_level === 'Medium'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {app.risk_level}
            </td>
            <td className="py-2">{app.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


    </div>
  );
};

export default Dashboard;
