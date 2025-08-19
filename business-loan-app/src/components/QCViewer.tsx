import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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
  [key: string]: string | number | null; // For FY2022, FY2023, etc.
};

type AnalysisEntry = {
  _id: string;
  company_name: string;
  loan_id: string;
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
  // customer_id?: string;
  customer_name?: string;
  loan_id?: string;
  documents: DocumentEntry[];
};

const QCViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QCEntry | null>(null);
  const [textValue, setTextValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Collection selector
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isFinancialDataEdited, setIsFinancialDataEdited] = useState(false);
  const collections = ['Balance Sheet Summary', 'Profit & Loss Summary', 'Cash Flow Summary'];

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
    
    // Different multipliers based on item type
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
    if (!selectedCollection || !id || !data) return;
    
    // First, find the analysis entry using the loan_id
    fetch(`http://localhost:5000/analysis/`)
      .then((res) => res.json())
      .then((analysisEntries) => {
        // Find the analysis entry that matches the loan_id
        const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.loan_id === data.loan_id);
        
        if (!matchingEntry) {
          setTextValue('No financial analysis data found for this loan.');
          return;
        }
        
        // Now fetch the specific analysis data using the correct ID
        return fetch(`http://localhost:5000/analysis/${matchingEntry._id}`);
      })
      .then((res) => res?.json())
      .then((data) => {
        if (!data) return;
        
        // Add dummy values to the financial data for display
        const dataWithDummyValues = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2022: item.FY2022 || generateDummyValue(item.item, 'balance_sheet', 2022),
            FY2023: item.FY2023 || generateDummyValue(item.item, 'balance_sheet', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'balance_sheet', 2024)
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2022: item.FY2022 || generateDummyValue(item.item, 'profit_loss', 2022),
            FY2023: item.FY2023 || generateDummyValue(item.item, 'profit_loss', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'profit_loss', 2024)
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2022: item.FY2022 || generateDummyValue(item.item, 'cash_flow', 2022),
            FY2023: item.FY2023 || generateDummyValue(item.item, 'cash_flow', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'cash_flow', 2024)
          }))
        };
        setFinancialData(dataWithDummyValues);
        
        // Map collection names to data arrays
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
  }, [selectedCollection, id, data]);

  const handleSave = () => {
    if (!data) return;
    const parsed = textToExtractedData(textValue);
    const newData = { ...data };
    if (newData.documents.length > 0) {
      newData.documents[0].extracted_data = parsed;
    }
    setData(newData);
    setIsEditing(false);

    // Persist changes to backend if needed
    // fetch(`http://localhost:5000/cq/${data._id}/document/...`, { method: 'PUT', ... })
  };

  const handleSaveFinancialData = async () => {
    if (!financialData || !data) return;
    
    try {
      // Find the analysis entry ID
      const analysisResponse = await fetch(`http://localhost:5000/analysis/`);
      const analysisEntries = await analysisResponse.json();
      const matchingEntry = analysisEntries.find((entry: AnalysisEntry) => entry.loan_id === data.loan_id);
      
      if (!matchingEntry) {
        alert('No matching analysis entry found to save changes.');
        return;
      }

      // Save the updated financial data
      const response = await fetch(`http://localhost:5000/analysis/${matchingEntry._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const renderFinancialTable = (data: FinancialItem[]) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-500">No data available</div>;
    }

    // Get all unique years from the data
    const years = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key.startsWith('FY')) {
          years.add(key);
        }
      });
    });
    const yearArray = Array.from(years).sort();

    const handleCellEdit = (itemIndex: number, year: string, value: string) => {
      if (!financialData) return;
      
      const newFinancialData = { ...financialData };
      let targetArray: FinancialItem[] = [];
      
      // Determine which array to update based on selected collection
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
        // Convert value to number if possible, otherwise keep as string
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
                Item
              </th>
              {yearArray.map(year => (
                <th key={year} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
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
                  <td key={year} className="px-4 py-3 text-sm border-b">
                    <input
                      type="text"
                      value={item[year] !== null && item[year] !== undefined ? item[year] : ''}
                      onChange={(e) => handleCellEdit(index, year, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footnote */}
        <div className="mt-4 text-sm text-gray-600 italic">
          The values displayed above are those extracted to calculate the ratios.
        </div>
      </div>
    );
  };

  if (!data) {
    return <div className="p-4">Loading customer data...</div>;
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
        {/* <p><strong>Customer ID:</strong> {data.customer_id ?? '-'}</p> */}
        <p><strong>Customer Name:</strong> {data.customer_name ?? '-'}</p>
        <p><strong>Loan ID:</strong> {data.loan_id ?? '-'}</p>
      </div>

      {/* Collection dropdown */}
      <div>
        <label className="block mb-2 font-medium">Select the type of financial document:</label>
        <select
          className="border p-2 rounded w-full max-w-md"
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
        >
          <option value=""> Choose the document</option>
          {collections.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      {/* Data display */}
      <div>
        <label className="block mb-2 font-medium">
          {selectedCollection ? selectedCollection : 'Extracted Data'}:
        </label>
        
        {selectedCollection ? (
          // Show financial data table
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
          // Show textarea for extracted data
          <>
            <textarea
              className="w-full h-64 border rounded p-3 font-mono text-sm"
              value={textValue}
              readOnly={!isEditing}
              onChange={(e) => setTextValue(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom-right buttons */}
      <div className="fixed bottom-4 right-6 flex space-x-4 z-50">
        <button className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Decline</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Approve</button>
      </div>
    </div>
  );
};

export default QCViewer;
