import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DocumentStatus {
  status: 'Pending' | 'Approved' | 'Declined';
}

interface QCEntry {
  _id: string;
  customer_id: string;
  customer_name: string;
  loan_id: string;
  status: 'Pending' | 'Approved' | 'Declined';
  documents?: DocumentStatus[];
}

const QCTable: React.FC = () => {
  const [data, setData] = useState<QCEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/cq/')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error('Failed to fetch QC data:', err));
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAction = (action: string, id: string) => {
    if (action === 'View Data') {
      navigate(`/qc/${id}`);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900">Quality Check (QC) Table</h2>
      
      {/* Table Container */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer Name</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Loan ID</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, index) => {
              return (
                <tr key={entry._id} className={`${index !== data.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50`}>
                  <td className="py-4 px-6 text-gray-900">{entry.customer_name}</td>
                  <td className="py-4 px-6 text-gray-900">{entry.loan_id}</td>
                  <td className="py-4 px-6 text-gray-900">{entry.status}</td>
                  <td className="py-4 px-6 text-gray-900 relative">
                    <span
                      onClick={() => toggleMenu(entry._id)}
                      className="cursor-pointer text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ⋮
                    </span>
                    {openMenuId === entry._id && (
                      <div className="absolute right-6 top-12 bg-white border border-gray-200 shadow-lg z-10 w-48 rounded-md text-left">
                        <div
                          onClick={() => handleAction('View Data', entry._id)}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-700"
                        >
                          View Data
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QCTable;
