import React from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const ratioLabels = ['2022', '2023', '2024', '2025'];

const ratiosData = [
  {
    name: 'Debt-to-equity',
    values: [0.93, 0.96, 1.0, 1.06],
    colors: ['green', 'green', 'green', 'green'],
  },
  {
    name: 'Current Ratio',
    values: [1.6, 1.7, 1.75, 1.8],
    colors: ['green', 'green', 'green', 'green'],
  },
  {
    name: 'EBIDTA Margin',
    values: [25, 26, 26, 26],
    colors: ['orange', 'green', 'green', 'green'],
  },
  {
    name: 'DSCR',
    values: [1.4, 1.7, 2.0, 2.1],
    colors: ['orange', 'green', 'green', 'green'],
  },
  {
    name: 'Interest Coverage',
    values: [13.3, 13.3, 13.4, 13.8],
    colors: ['green', 'green', 'green', 'green'],
  },
  {
    name: 'Net Worth',
    values: [312, 333, 349, 365],
    colors: ['green', 'green', 'green', 'green'],
  },
];

const getCellColor = (color: string) => {
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'orange':
      return 'bg-orange-100 text-orange-800';
    case 'red':
      return 'bg-red-100 text-red-800';
    default:
      return '';
  }
};

const CompanyRatioAnalysis: React.FC = () => {
  return (
    <div className="flex h-[80vh] gap-4 px-6">
      {/* Left Side: Table */}
      <div className="w-1/2 overflow-auto">
        <div className="mb-4">
          <span className="inline-block w-4 h-4 bg-green-400 mr-2 rounded-sm" /> Good
          <span className="inline-block w-4 h-4 bg-orange-400 ml-4 mr-2 rounded-sm" /> Moderate
          <span className="inline-block w-4 h-4 bg-red-400 ml-4 mr-2 rounded-sm" /> Poor
        </div>
        <table className="min-w-full table-fixed border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left w-1/3">Ratio</th>
              {ratioLabels.map((year) => (
                <th key={year} className="border px-4 py-2 text-center w-1/6">{year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ratiosData.map((ratio) => (
              <tr key={ratio.name}>
                <td className="border px-4 py-2 font-medium">{ratio.name}</td>
                {ratio.values.map((val, i) => (
                  <td
                    key={i}
                    className={`border px-4 py-2 text-center ${getCellColor(ratio.colors[i])}`}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Side: Graphs */}
      <div className="w-1/2 overflow-y-auto pr-2 border-l border-gray-200">
        {ratiosData.map((ratio) => (
          <div key={ratio.name} className="mb-6">
            <h3 className="text-sm font-semibold mb-1">{ratio.name}</h3>
            <Line
              data={{
                labels: ratioLabels,
                datasets: [
                  {
                    label: ratio.name,
                    data: ratio.values,
                    borderWidth: 2,
                    fill: false,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: 'index', intersect: false },
                },
                scales: {
                  y: { beginAtZero: false },
                },
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyRatioAnalysis;
