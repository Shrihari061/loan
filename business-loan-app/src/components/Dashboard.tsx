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
import { TrendingUp, FileText, CheckCircle, XCircle, Coins } from 'lucide-react';
import { FigtreeContainer, FigtreeCard, FigtreeHeading } from './ReusableComponents';
import { globalStyles } from '../styles/globalStyles';

// Replace the old COLORS
const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];


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
      title: 'Total Disbursement (in Crores)',
      value: data.top_cards.total_disbursement.value,
      change: data.top_cards.total_disbursement.change,
      icon: Coins,
      period: 'From last week'
    },
    {
      title: 'Applications in Progress',
      value: data.top_cards.companies_in_draft.value,
      change: data.top_cards.companies_in_draft.change,
      icon: FileText,
      period: 'From last week'
    },
    {
      title: 'Applications Approved',
      value: data.top_cards.financial_capture_stage.value,
      change: data.top_cards.financial_capture_stage.change,
      icon: CheckCircle,
      period: 'From last week'
    },
    {
      title: 'Applications Rejected',
      value: data.top_cards.rejected_companies.value,
      change: data.top_cards.rejected_companies.change,
      icon: XCircle,
      period: 'From last week'
    }
  ];

  // ---- Chart Data Prep ----
  const monthlyDisbursementData = Object.entries(data.monthly_disbursement).map(([month, value]) => ({
    month: month.substring(0, 3),
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

  // Custom tick component for Application Pipeline chart
  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const value = payload.value;

    if (value === 'Under Financial Review') {
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={13}>
            Under Financial
          </text>
          <text x={0} y={0} dy={32} textAnchor="middle" fill="#666" fontSize={13}>
            Review
          </text>
        </g>
      );
    }

    return (
      <text x={x} y={y} dy={16} textAnchor="middle" fill="#666" fontSize={13}>
        {value}
      </text>
    );
  };

  const pendingProgressData = Object.entries(data.pending_progress).map(([label, value]) => ({
    label,
    value
  }));

  return (
    <div className="space-y-6" style={{
      width: '1440px',
      minHeight: '100vh',
      margin: '-8px auto 0 auto',
      padding: '0px 24px 24px 24px',
      backgroundColor: '#F8F6F1'
    }}>
      {/* ---- Dashboard Title ---- */}
      <div style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '25px',
        marginBottom: '16px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
          Dashboard
        </h1>
      </div>

      {/* ---- Greeting Section ---- */}
      <div style={{
        display: 'flex',
        width: '1148px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '7px'
      }}>

      </div>

      {/* ---- Top Cards ---- */}
      <div className="grid grid-cols-4 gap-6" style={{ width: '1374px' }}>
        {topCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div key={idx} className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium mb-2" style={{ color: '#1F1F1F' }}>{card.title}</h3>

                  {/* Value */}
                  <p className="text-3xl font-bold text-gray-900 mb-3">
                    {card.title === 'Total Disbursement' ? `₹${card.value.toLocaleString()}` : card.value.toLocaleString()}
                  </p>

                  {/* Change indicator - only show for Total Disbursement */}
                  {card.title === 'Total Disbursement' && (
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${card.change >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        <div className="flex items-center gap-1">
                          {card.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3 rotate-180" />
                          )}
                          {card.change >= 0 ? '+' : ''}{card.change}%
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{card.period}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Charts Section ---- */}
      <div className="flex gap-6">
        {/* Left Column - Monthly Disbursement and Application Pipeline stacked vertically */}
        <div className="flex flex-col gap-6">
          {/* Monthly Disbursement Chart */}
          <div style={{
            width: '900px',
            height: '501px',
            borderRadius: '12px',
            background: '#FFF',
            boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
            padding: '24px'
          }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1F1F1F' }}>
              Monthly Disbursement
              <span style={{ fontWeight: '400', color: '#6B7280' }}>
                {" "}(2024–2025)
              </span>
            </h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDisbursementData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 13 }}
                  tickMargin={25}
                  textAnchor="middle"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 13 }}
                  tickMargin={10}
                  width={40}
                />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Application Pipeline by Stage Chart */}
          <div style={{
            width: '900px',
            height: '501px',
            flexShrink: 0,
            borderRadius: '12px',
            background: '#FFF',
            boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
            padding: '24px'
          }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1F1F1F' }}>Application Pipeline by Stage</h2>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={applicationPipelineData} margin={{ top: 20, right: 50, left: 30, bottom: 50 }}>
                <XAxis
                  dataKey="stage"
                  interval={0}
                  tickMargin={20}
                  tick={<CustomTick />}
                />
                <YAxis
                  tick={{ fontSize: 13 }}
                  tickMargin={15}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#1D4ED8" barSize={12} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Risk Ratio and Pending stacked vertically */}
        <div className="flex flex-col gap-6">
          {/* Risk Ratio Card */}
          <div className="flex flex-col items-center justify-center" style={{
            width: '450px',
            height: '501px',
            flexShrink: 0,
            borderRadius: '12px',
            background: '#FFFFFF',
            boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
            padding: '24px'
          }}>
            <h2 className="text-lg font-semibold mb-4 text-center" style={{ color: '#1F1F1F' }}>Risk Ratio</h2>
            <p className="text-sm text-center mb-4" style={{ color: '#6B7280' }}>
              (Approved Applications)
            </p>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={riskCategoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={false}
                >
                  {riskCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: '#363636' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Pending Card */}
          </div>
          <div style={{
            display: 'flex',
            padding: '23px 72px 29px 23px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '36px',
            borderRadius: '12px',
            background: '#FFF',
            boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
            width: '450px',
            height: '501px'
          }}>
            <h2 className="text-lg font-semibold" style={{ color: '#1F1F1F' }}>Pending</h2>
            <div className="space-y-6 w-full">
              {pendingProgressData.map((item, idx) => (
                <div key={idx} className="w-full">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span style={{ color: '#363636' }}>{item.label}</span>
                    <span style={{ color: '#1F1F1F', fontWeight: 600 }}>{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Third Row ---- */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Total Applicants Widget */}
        <div style={{
          width: '446px',
          height: '501px',
          borderRadius: '12px',
          background: '#FFF',
          boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Total Applicants Section */}
          <div style={{ marginBottom: '20px' }}>
            <h2 className="text-lg font-semibold" style={{ color: '#1F1F1F', marginBottom: '8px' }}>
              Total Applicants
            </h2>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1F1F1F',
                margin: 0,
              }}
            >
              {Object.values(data.monthly_breakdown).reduce(
                (acc: number, v: number) => acc + v,
                0
              )}
            </p>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: '#E5E7EB',
            marginBottom: '20px'
          }}></div>

          {/* Monthly Breakdown Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <button style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              ←
            </button>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1F1F1F',
              margin: 0
            }}>
              Monthly Breakdown
            </h3>
            <button style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              →
            </button>
          </div>

          {/* Chart */}
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Object.entries(data.monthly_breakdown).map(([month, value]) => ({
                  month: month.substring(0, 3),
                  value
                }))}
                margin={{ top: 20, right: 20, left: 20, bottom: 30 }}
              >
                <XAxis
                  dataKey="month"
                  interval={0}
                  tick={{
                    fontSize: 14,
                    fill: '#000',
                    fontFamily: 'Figtree',
                    fontStyle: 'normal',
                    fontWeight: 400
                  }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  hide={true}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1D4ED8"
                  strokeWidth={3}
                  dot={{ fill: '#1D4ED8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#1D4ED8', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications Summary + Recent Applications Table */}
        <div style={{
          width: '905px',
          height: '501px',
          borderRadius: '12px',
          background: '#FFF',
          boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded shadow-sm text-center">
              <h3 className="text-xs text-gray-500">In Progress</h3>
              <p className="text-lg font-semibold">{data.applications_summary.in_progress}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded shadow-sm text-center">
              <h3 className="text-xs text-gray-500">Approved</h3>
              <p className="text-lg font-semibold">{data.applications_summary.approved}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded shadow-sm text-center">
              <h3 className="text-xs text-gray-500">Rejected</h3>
              <p className="text-lg font-semibold">{data.applications_summary.rejected}</p>
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
              {data.recent_applications.map((app) => (
                <tr key={app._id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{app.borrower}</td>
                  <td className="py-2">{app.loan_type}</td>
                  <td className="py-2">₹{app.amount.toLocaleString()}</td>
                  <td
                    className={`py-2 font-medium ${app.risk_level === 'Low'
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
