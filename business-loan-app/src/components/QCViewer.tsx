import React, { useState } from 'react';

const QCViewer: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<string>('');

  const dummyDocuments = [
    'Balance Sheet FY2023.pdf',
    'GST Returns Q1.pdf',
    'Income Tax Filing.pdf',
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Select a Document</h2>

      <select
        className="border p-2 rounded w-full max-w-md"
        value={selectedDoc}
        onChange={(e) => setSelectedDoc(e.target.value)}
      >
        <option value="" disabled>Select a file</option>
        {dummyDocuments.map((docName, index) => (
          <option key={index} value={docName}>
            {docName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default QCViewer;
