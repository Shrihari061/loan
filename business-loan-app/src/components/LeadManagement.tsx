import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDotsVertical } from 'react-icons/hi';

const LeadManagement: React.FC = () => {
  const navigate = useNavigate();

  const leads = [
    {
      id: 1,
      businessName: 'ABC Enterprises',
      loanType: 'Term Loan',
      loanAmount: '₹25,00,000',
      lastUpdated: '2025-08-01',
      status: 'Draft',
    },
    {
      id: 2,
      businessName: 'XYZ Traders',
      loanType: 'Working Capital',
      loanAmount: '₹15,00,000',
      lastUpdated: '2025-08-05',
      status: 'Submitted',
    },
  ];

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleGenerateLead = () => {
    navigate('/lead/new'); // redirect to Step1
  };

  const handleMenuAction = (action: string, id: number) => {
    alert(`${action} clicked for Lead ID: ${id}`);
    setOpenMenuId(null);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lead Management</h2>
        <button
          onClick={handleGenerateLead}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate New Lead
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Lead ID</th>
              <th className="px-4 py-2 border">Business Name</th>
              <th className="px-4 py-2 border">Loan Type</th>
              <th className="px-4 py-2 border">Loan Amount</th>
              <th className="px-4 py-2 border">Last Updated</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 relative">
                <td className="px-4 py-2 border">{lead.id}</td>
                <td className="px-4 py-2 border">{lead.businessName}</td>
                <td className="px-4 py-2 border">{lead.loanType}</td>
                <td className="px-4 py-2 border">{lead.loanAmount}</td>
                <td className="px-4 py-2 border">{lead.lastUpdated}</td>
                <td className="px-4 py-2 border">{lead.status}</td>
                <td className="px-4 py-2 border text-center">
                  {lead.status === 'Draft' && (
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === lead.id ? null : lead.id)
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <HiOutlineDotsVertical size={18} />
                      </button>

                      {openMenuId === lead.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded z-10">
                          <div
                            onClick={() => handleMenuAction('Continue', lead.id)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            Continue
                          </div>
                          <div
                            onClick={() => handleMenuAction('Submit', lead.id)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            Submit
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadManagement;
