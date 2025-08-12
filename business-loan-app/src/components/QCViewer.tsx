import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type ExtractedData = Record<string, string>;

type DocumentEntry = {
  _id?: string; // optional because some docs might be missing it
  filename: string;
  upload_date?: string;
  status?: string;
  notes?: string;
  extracted_data?: ExtractedData;
};

type QCEntry = {
  _id: string;
  customer_id?: string;
  customer_name?: string;
  loan_id?: string;
  documents: DocumentEntry[];
};

const QCViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QCEntry | null>(null);

  // mappedDocs ensures each option has a stable unique id even if doc._id is missing
  const [mappedDocs, setMappedDocs] = useState<
    { id: string; originalIndex: number; doc: DocumentEntry }[]
  >([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Helper: convert extracted_data object -> pretty lines "Key: Value"
  const extractedDataToText = (obj?: ExtractedData) => {
    if (!obj) return '';
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  };

  // Helper: parse textarea lines back to extracted_data object
  const textToExtractedData = (text: string) => {
    const lines = text.split('\n');
    const out: ExtractedData = {};
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const idx = line.indexOf(':');
      if (idx === -1) {
        // No colon -> treat entire line as key with empty value
        out[line] = '';
      } else {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key) out[key] = value;
      }
    }
    return out;
  };

  // Fetch customer entry
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/cq/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((entry: QCEntry) => {
        setData(entry);

        // Map docs to stable ids
        const mapped = (entry.documents || []).map((doc, idx) => {
          const fallbackId = `${entry._id}_doc_${idx}`;
          const docId = doc._id ?? fallbackId;
          return { id: docId, originalIndex: idx, doc };
        });
        setMappedDocs(mapped);

        if (mapped.length > 0) {
          setSelectedDocId(mapped[0].id);
          setTextValue(extractedDataToText(mapped[0].doc.extracted_data));
        } else {
          setSelectedDocId('');
          setTextValue('');
        }
      })
      .catch((err) => {
        console.error('Failed to load customer data:', err);
        setData(null);
        setMappedDocs([]);
      });
  }, [id]);

  // Whenever selectedDocId or mappedDocs changes, update textValue (unless editing)
  useEffect(() => {
    if (isEditing) return; // don't overwrite while editing
    if (!selectedDocId || mappedDocs.length === 0) return;
    const entry = mappedDocs.find((m) => m.id === selectedDocId);
    if (entry) {
      setTextValue(extractedDataToText(entry.doc.extracted_data));
    } else {
      setTextValue('');
    }
  }, [selectedDocId, mappedDocs, isEditing]);

  // Handle dropdown change
  const handleSelect = (value: string) => {
    setSelectedDocId(value);
    setIsEditing(false); // viewing mode
  };

  // Save: update local state (and optionally sync to backend later)
  const handleSave = () => {
    if (!data || !selectedDocId) return;
    const entryIndex = mappedDocs.findIndex((m) => m.id === selectedDocId);
    if (entryIndex === -1) return;

    const parsed = textToExtractedData(textValue);

    // Update mappedDocs
    const newMapped = [...mappedDocs];
    newMapped[entryIndex] = {
      ...newMapped[entryIndex],
      doc: {
        ...newMapped[entryIndex].doc,
        extracted_data: parsed,
      },
    };
    setMappedDocs(newMapped);

    // Also update `data.documents` so UI stays consistent
    const newData = { ...data };
    newData.documents = [...newData.documents];
    newData.documents[newMapped[entryIndex].originalIndex] = {
      ...newData.documents[newMapped[entryIndex].originalIndex],
      extracted_data: parsed,
    };
    setData(newData);

    setIsEditing(false);

    // NOTE: if you want to persist this change to MongoDB, call your PUT endpoint here.
    // Example:
    // fetch(`http://localhost:5000/cq/${data._id}/document/${originalDocId}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ extracted_data: parsed })
    // })
    // ...
  };

  if (!data) {
    return <div className="p-4">Loading customer data...</div>;
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
        <p><strong>Customer ID:</strong> {data.customer_id ?? '-'}</p>
        <p><strong>Customer Name:</strong> {data.customer_name ?? '-'}</p>
        <p><strong>Loan ID:</strong> {data.loan_id ?? '-'}</p>
      </div>

      {/* Document dropdown */}
      <div>
        <label className="block mb-2 font-medium">Select a Document:</label>

        {mappedDocs.length === 0 ? (
          <div className="text-sm text-gray-600">No documents available.</div>
        ) : (
          <select
            className="border p-2 rounded w-full max-w-md"
            value={selectedDocId}
            onChange={(e) => handleSelect(e.target.value)}
          >
            {mappedDocs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.doc.filename ?? `Document ${m.originalIndex + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Extracted data */}
      <div>
        <label className="block mb-2 font-medium">Extracted Data:</label>
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
