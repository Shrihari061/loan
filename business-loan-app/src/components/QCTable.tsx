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
  documents: DocumentStatus[];
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
    <div className="p-6 relative">
      <h2 className="text-xl font-bold mb-4">Quality Check (QC) Table</h2>
      <table className="w-full table-auto border">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">Customer Name</th>
            <th className="p-2 border">Loan ID</th>
            <th className="p-2 border">Customer ID</th>
            <th className="p-2 border"># of Documents</th>
            <th className="p-2 border">Pending</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => {
            const pendingCount = entry.documents.filter(doc => doc.status === 'Pending').length;
            return (
              <tr key={entry._id} className="relative">
                <td className="p-2 border">{entry.customer_name}</td>
                <td className="p-2 border">{entry.loan_id}</td>
                <td className="p-2 border">{entry.customer_id}</td>
                <td className="p-2 border">{entry.documents.length}</td>
                <td className="p-2 border">{pendingCount}</td>
                <td className="p-2 border text-center relative">
                  <span
                    onClick={() => toggleMenu(entry._id)}
                    className="cursor-pointer px-2"
                  >
                    &#8942;
                  </span>
                  {openMenuId === entry._id && (
                    <div className="absolute right-2 top-8 bg-white border shadow-md z-10 w-48 rounded text-left">
                      <div
                        onClick={() => handleAction('View Data', entry._id)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
  );
};

export default QCTable;
