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

  // NEW: collection selector
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const collections = ['extracted_values'];

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
    if (!selectedCollection || !id) return;
    fetch(`http://localhost:5000/cq/${id}/collection/${selectedCollection}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setTextValue(JSON.stringify(data, null, 2));
        } else {
          setTextValue('No data found for this collection.');
        }
      })
      .catch((err) => {
        console.error('Failed to load collection data:', err);
        setTextValue('Error loading collection data.');
      });
  }, [selectedCollection, id]);

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
        <label className="block mb-2 font-medium">Select a Collection:</label>
        <select
          className="border p-2 rounded w-full max-w-md"
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
        >
          <option value="">-- Choose Collection --</option>
          {collections.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      {/* Data display */}
      <div>
        <label className="block mb-2 font-medium">Extracted Data:</label>
        <textarea
          className="w-full h-64 border rounded p-3 font-mono text-sm"
          value={textValue}
          readOnly={!isEditing && !selectedCollection}
          onChange={(e) => setTextValue(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          {!isEditing && !selectedCollection ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
          ) : !selectedCollection && (
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          )}
        </div>
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
