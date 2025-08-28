import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ⬅️ added useNavigate

type ExtractedData = Record<string, string>;

type DocumentEntry = {
  _id?: string;
  filename: string;
  upload_date?: string;
  status?: string;
  notes?: string;
  extracted_data?: ExtractedData;
};

type FinancialItem = {
  _id: string;
  item: string;
  [key: string]: string | number | null; // For FY2023, FY2024, FY2025, etc.
};

type AnalysisEntry = {
  _id: string;
  company_name: string;
  lead_id: string;
  last_updated: string;
  net_worth: number;
  debt_to_equity: string;
  dscr: string;
  year_range: string;
  ratio_health: string;
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
};

type FinancialData = {
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
};

type QCEntry = {
  _id: string;
  customer_name?: string;
  lead_id?: string;
  documents: DocumentEntry[];
  status?: string;
};

const QCViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // ⬅️ initialize navigate
  const [data, setData] = useState<QCEntry | null>(null);
  const [textValue, setTextValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Collection selector
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025'); // ⬅️ new year dropdown state
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isFinancialDataEdited, setIsFinancialDataEdited] = useState(false);
  const collections = ['Balance Sheet Summary', 'Profit & Loss Summary', 'Cash Flow Summary'];
  const years = ['2023', '2024', '2025']; // ⬅️ year options

  // Create a stable dependency array to prevent React warnings
  const financialDataDependencies = useMemo(() => [selectedCollection, id, data, selectedYear], [selectedCollection, id, data, selectedYear]);

  const extractedDataToText = (obj?: ExtractedData) => {
    if (!obj) return '';
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  };

  const textToExtractedData = (text: string) => {
    const lines = text.split('\n');
    const out: ExtractedData = {};
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const idx = line.indexOf(':');
      if (idx === -1) {
        out[line] = '';
      } else {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key) out[key] = value;
      }
    }
    return out;
  };

  const generateDummyValue = (itemName: string, documentType: string, year: number): number => {
    const baseValue = 50000; // Base value for calculations
    const yearMultiplier = 1 + (year - 2022) * 0.15; // 15% growth per year
    
    let itemMultiplier = 1;
    if (documentType === 'balance_sheet') {
      if (itemName.includes('Assets')) itemMultiplier = 2.5;
      else if (itemName.includes('Equity')) itemMultiplier = 1.8;
      else if (itemName.includes('Debt')) itemMultiplier = 0.8;
      else if (itemName.includes('Liabilities')) itemMultiplier = 1.2;
      else if (itemName.includes('Receivables')) itemMultiplier = 0.6;
      else if (itemName.includes('Payables')) itemMultiplier = 0.4;
    } else if (documentType === 'profit_loss') {
      if (itemName.includes('Revenue') || itemName.includes('Sales')) itemMultiplier = 3.0;
      else if (itemName.includes('Profit')) itemMultiplier = 1.5;
      else if (itemName.includes('Expense')) itemMultiplier = 0.7;
      else if (itemName.includes('Depreciation')) itemMultiplier = 0.3;
    } else if (documentType === 'cash_flow') {
      if (itemName.includes('Principal')) itemMultiplier = 0.2;
    }
    
    return Math.round(baseValue * itemMultiplier * yearMultiplier);
  };

  // Fetch CQ entry
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/cq/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((entry: QCEntry) => {
        setData(entry);
        if (entry.documents?.length > 0) {
          setTextValue(extractedDataToText(entry.documents[0].extracted_data));
        } else {
          setTextValue('');
        }
      })
      .catch((err) => {
        console.error('Failed to load customer data:', err);
        setData(null);
      });
  }, [id]);

  // Fetch selected collection
  useEffect(() => {
    if (!selectedCollection || !id || !data || !selectedYear) return;
    
    fetch(`http://localhost:5000/analysis/`)
      .then((res) => res.json())
      .then((analysisEntries) => {
        const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.lead_id === data.lead_id);
        if (!matchingEntry) {
          setTextValue('No financial analysis data found for this lead.');
          return;
        }
        return fetch(`http://localhost:5000/analysis/${matchingEntry._id}?year=${selectedYear}`);
      })
      .then((res) => res?.json())
      .then((data) => {
        if (!data) return;
        
        const dataWithDummyValues = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? generateDummyValue(item.item, 'balance_sheet', 2023),
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? generateDummyValue(item.item, 'profit_loss', 2023),
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 ?? generateDummyValue(item.item, 'cash_flow', 2023),
            FY2024: item.FY2024 ?? item['value_2024'] ?? null,
            FY2025: item.FY2025 ?? item['value_2025'] ?? null
          }))
        };
        setFinancialData(dataWithDummyValues);
        
        let selectedData: FinancialItem[] = [];
        switch (selectedCollection) {
          case 'Balance Sheet Summary':
            selectedData = dataWithDummyValues.balance_sheet || [];
            break;
          case 'Profit & Loss Summary':
            selectedData = dataWithDummyValues.profit_loss || [];
            break;
          case 'Cash Flow Summary':
            selectedData = dataWithDummyValues.cash_flow || [];
            break;
          default:
            selectedData = [];
        }
        
        if (selectedData.length > 0) {
          setTextValue(JSON.stringify(selectedData, null, 2));
        } else {
          setTextValue('No data found.');
        }
      })
      .catch((err) => {
        console.error('Failed to load financial data:', err);
        setTextValue('Error loading financial data.');
      });
  }, financialDataDependencies);

  const handleSave = () => {
    if (!data) return;
    const parsed = textToExtractedData(textValue);
    const newData = { ...data };
    if (newData.documents.length > 0) {
      newData.documents[0].extracted_data = parsed;
    }
    setData(newData);
    setIsEditing(false);
  };

  const handleSaveFinancialData = async () => {
    if (!financialData || !data) return;
    try {
      const analysisResponse = await fetch(`http://localhost:5000/analysis/`);
      const analysisEntries = await analysisResponse.json();
      const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.lead_id === data.lead_id);
      if (!matchingEntry) {
        alert('No matching analysis entry found to save changes.');
        return;
      }
      const response = await fetch(`http://localhost:5000/analysis/${matchingEntry._id}?year=${selectedYear}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(financialData),
      });
      if (response.ok) {
        alert('Financial data saved successfully!');
        setIsFinancialDataEdited(false);
      } else {
        alert('Failed to save financial data.');
      }
    } catch (error) {
      console.error('Error saving financial data:', error);
      alert('Error saving financial data.');
    }
  };

  // 🔹 Handle Approve/Decline actions
  const handleApprove = async () => {
    if (!data) return;
    try {
      const res = await fetch(`http://localhost:5000/cq/${data._id}/approve`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setData(updated.record);
        alert('Customer approved successfully!');
      } else {
        alert('Failed to approve.');
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('Error approving.');
    }
  };

  const handleDecline = async () => {
    if (!data) return;
    try {
      const res = await fetch(`http://localhost:5000/cq/${data._id}/reject`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setData(updated.record);
        alert('Customer rejected successfully!');
      } else {
        alert('Failed to reject.');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Error rejecting.');
    }
  };

  const renderFinancialTable = (data: FinancialItem[]) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-500">No data available</div>;
    }

    const yearArray = selectedYear ? [selectedYear] : [];

    const handleCellEdit = (itemIndex: number, year: string, value: string) => {
      if (!financialData) return;
      const newFinancialData = { ...financialData };
      let targetArray: FinancialItem[] = [];
      switch (selectedCollection) {
        case 'Balance Sheet Summary':
          targetArray = newFinancialData.balance_sheet;
          break;
        case 'Profit & Loss Summary':
          targetArray = newFinancialData.profit_loss;
          break;
        case 'Cash Flow Summary':
          targetArray = newFinancialData.cash_flow;
          break;
      }
      if (targetArray[itemIndex]) {
        const numValue = parseFloat(value);
        targetArray[itemIndex][year] = isNaN(numValue) ? value : numValue;
        setFinancialData(newFinancialData);
        setIsFinancialDataEdited(true);
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                <span className="text-xs font-normal text-gray-400 normal-case">(all amounts in Crores of Rs.)</span>
              </th>
              {yearArray.map(year => (
                <th key={year} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item._id || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                  {selectedCollection === 'Cash Flow Summary' && item.item === 'Principal' 
                    ? 'Payment of lease liabilities' 
                    : item.item}
                </td>
                {yearArray.map(year => (
                  <td key={year} className="px-4 py-3 text-sm border-b text-right">
                    <input
                      type="text"
                      value={item[`FY${year}`] ?? ''}
                      onChange={(e) => handleCellEdit(index, `FY${year}`, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      style={{ 
                        color: (() => {
                          const val = item[`FY${year}`];
                          if (val === null || val === undefined) return '#111827';
                          
                          if (typeof val === 'string') {
                            if (val.startsWith('(') && val.endsWith(')')) {
                              return '#ef4444'; 
                            }
                            const numVal = Number(val);
                            if (!isNaN(numVal)) {
                              return numVal < 0 ? '#ef4444' : '#111827';
                            }
                            return '#111827';
                          }
                          
                          const numVal = Number(val);
                          return isNaN(numVal) ? '#111827' : (numVal < 0 ? '#ef4444' : '#111827');
                        })()
                      }}
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!data) {
    return <div className="p-4">Loading customer data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* 🔹 Back Button (moved out of absolute so it won’t overlap) */}
      <button
        onClick={() => navigate('/qc')}
        className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
      >
        ← Back to QC Table
      </button>

      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
        <p><strong>Customer Name:</strong> {data.customer_name ?? '-'}</p>
        <p><strong>Lead ID:</strong> {data.lead_id ?? '-'}</p>
        <p><strong>Status:</strong> {data.status ?? 'Pending'}</p>
      </div>

      {/* Collection + Year dropdowns */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block mb-2 font-medium">Select the type of financial document:</label>
          <select
            className="border p-2 rounded w-full max-w-md"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
          >
            <option value="" disabled>Choose the document</option>
            {collections.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 font-medium">Select a year:</label>
          <select
            className="border p-2 rounded w-full max-w-md"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >

            {years.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data display */}
      <div>
        {selectedCollection ? (
          <div className="mt-4">
            {financialData && renderFinancialTable(
              selectedCollection === 'Balance Sheet Summary' ? financialData.balance_sheet || [] :
              selectedCollection === 'Profit & Loss Summary' ? financialData.profit_loss || [] :
              selectedCollection === 'Cash Flow Summary' ? financialData.cash_flow || [] : []
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveFinancialData}
                className={`px-4 py-2 rounded transition-colors ${
                  isFinancialDataEdited 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                disabled={!isFinancialDataEdited}
              >
                {isFinancialDataEdited ? 'Save Changes' : 'No Changes to Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Please select a document type to view the extracted data.
          </div>
        )}
      </div>

      {/* Bottom buttons - only show when document is selected */}
      {selectedCollection && (
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={handleDecline}
            className="text-white px-4 py-2 rounded hover:opacity-90"
            style={{ backgroundColor: '#00306E' }}
          >
            Decline
          </button>
          <button
            onClick={handleApprove}
            className="text-white px-4 py-2 rounded hover:opacity-90"
            style={{ backgroundColor: '#0266F4' }}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

export default QCViewer;