import { useState, type ChangeEvent } from "react";
import axios from "axios";


const documentTypes = [
  { label: "Balance Sheet", audited: true, icon: "📊" },
  { label: "Profit & Loss Statement", audited: true, icon: "📈" },
  { label: "Cash Flow Statement", audited: true, icon: "💰" },
];

const years = ["2021", "2022", "2023", "2024", "2025"];

export default function Step2({
  leadData,
  setLeadData,
}: {
  leadData: any;
  setLeadData: React.Dispatch<React.SetStateAction<any>>;
}) {
  const [consent, setConsent] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [auditorVerified, setAuditorVerified] = useState<Record<string, boolean>>({});

  // Review & Submit state
  const [declarations, setDeclarations] = useState({
    allDocumentsComplete: false,
    auditedSigned: false,
    financialsConsistent: false,
    identifiersValidated: false,
    cmaMatches: false,
    finalConfirmation: false,
  });

  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const openModal = (docLabel: string) => {
    setSelectedDocument(docLabel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setSelectedYear("");
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files || !selectedDocument) return;

    const newFiles = Array.from(files);
    setUploadedFiles((prev) => ({
      ...prev,
      [selectedDocument]: prev[selectedDocument] ? [...prev[selectedDocument], ...newFiles] : newFiles,
    }));
  };

  const removeFile = (docLabel: string, index: number) => {
    setUploadedFiles((prev) => {
      const updated = [...(prev[docLabel] || [])];
      updated.splice(index, 1);
      return { ...prev, [docLabel]: updated };
    });
  };

  const removeAllFiles = (docLabel: string) => {
    setUploadedFiles((prev) => ({ ...prev, [docLabel]: [] }));
  };

  const handleAuditorVerification = (docLabel: string, verified: boolean) => {
    setAuditorVerified(prev => ({
      ...prev,
      [docLabel]: verified
    }));
  };

  // Review & Submit handlers
  const handleCheckboxChange = (field: keyof typeof declarations) => {
    setDeclarations((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSignatureUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSignatureFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!leadData) return;

    // Merge uploaded files and signature into leadData
    const finalLeadData = {
      ...leadData,
      financialDocuments: Object.entries(uploadedFiles).flatMap(([label, files]) =>
        files.map(file => file) // actual File object
      ),
      signature: signatureFile || null,
      reviewDeclarations: declarations,
    };

    console.log("Final Lead Data ready for upload:", finalLeadData);

    // Update parent state
    setLeadData(finalLeadData);

    try {
      const formData = new FormData();

      // Append all lead text data (excluding files/signature)
      Object.entries(finalLeadData).forEach(([key, value]) => {
        if (key !== "financialDocuments" && key !== "signature") {
          if (value !== null && value !== undefined) {
            if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        }
      });

      // Append financial documents
      finalLeadData.financialDocuments.forEach((file: File) => {
        formData.append("financialDocuments", file, file.name);
      });

      // Append signature
      if (finalLeadData.signature) {
        formData.append("signature", finalLeadData.signature, finalLeadData.signature.name);
      }

      // Send to backend
      const response = await axios.post("http://localhost:5000/leads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Lead uploaded successfully:", response.data);
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting lead:", error);
      alert("Failed to submit application. Check console for details.");
    }
  };

  return (
    <div className="p-8 w-full">
      <h2 className="text-2xl font-semibold mb-8 text-gray-800">Step 2: Upload Financial Documents</h2>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {documentTypes.map((doc, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start mb-4">
                <span className="text-3xl mr-3 flex-shrink-0">{doc.icon}</span>
                <div className="min-h-[3rem]">
                  <h3 className="text-lg font-semibold text-gray-800 leading-tight">{doc.label}</h3>
                  {doc.audited && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block mt-1">Audited Required</span>
                  )}
                </div>
              </div>

              {/* File Count Display */}
              <div className="mb-4 flex-shrink-0">
                {uploadedFiles[doc.label]?.length > 0 ? (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{uploadedFiles[doc.label].length}</span> file(s) uploaded
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No files uploaded</div>
                )}
              </div>

              {/* Verification Checkbox */}
              {doc.audited && (
                <div className="mb-4 flex-shrink-0">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditorVerified[doc.label] || false}
                      onChange={(e) => handleAuditorVerification(doc.label, e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Auditor Verified
                    </span>
                  </label>
                </div>
              )}

              {/* Spacer to push button to bottom */}
              <div className="flex-1"></div>

              {/* Upload Button */}
              <button
                onClick={() => openModal(doc.label)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex-shrink-0"
              >
                {uploadedFiles[doc.label]?.length > 0 ? 'Manage Files' : 'Upload Files'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Year Selection */}
      <div className="mt-8 pt-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Financial Year</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>



      {/* Upload Modal */}
      {isModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Upload {selectedDocument}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id={`file-upload-${selectedDocument}`}
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  <label htmlFor={`file-upload-${selectedDocument}`} className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)</p>
                  </label>
                </div>
              </div>





              {/* Uploaded Files List */}
              {uploadedFiles[selectedDocument]?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h4>
                  <div className="space-y-2">
                    {uploadedFiles[selectedDocument].map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">📄</span>
                          <span className="text-sm text-gray-800">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(selectedDocument, index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => removeAllFiles(selectedDocument)}
                    className="text-red-600 text-sm mt-2 hover:underline"
                  >
                    Remove All Files
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Submit Section */}
      <div className="mt-12 border-t pt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Review & Declarations
        </h3>

        {/* Declaration Checkboxes */}
        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={declarations.allDocumentsComplete}
              onChange={() => handleCheckboxChange("allDocumentsComplete")}
            />
            <span className="text-gray-700">
              All documents are complete and accurate
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={declarations.auditedSigned}
              onChange={() => handleCheckboxChange("auditedSigned")}
            />
            <span className="text-gray-700">
              Audited financials are signed by a Chartered Accountant
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={declarations.financialsConsistent}
              onChange={() => handleCheckboxChange("financialsConsistent")}
            />
            <span className="text-gray-700">
              Financials are consistent across ITR, GST, and financial statements
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={declarations.identifiersValidated}
              onChange={() => handleCheckboxChange("identifiersValidated")}
            />
            <span className="text-gray-700">
              CIN, PAN, and GSTIN have been validated and are correct
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={declarations.cmaMatches}
              onChange={() => handleCheckboxChange("cmaMatches")}
            />
            <span className="text-gray-700">
              CMA data (if uploaded) is complete and matches projections
            </span>
          </label>
        </div>

        {/* Signature Upload */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Upload Signature of Authorised Signatory
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureUpload}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          {signatureFile && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {signatureFile.name}
            </p>
          )}
        </div>

        {/* Final Declaration Checkbox */}
        <div className="mb-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={declarations.finalConfirmation}
              onChange={() => handleCheckboxChange("finalConfirmation")}
            />
            <span className="text-gray-700">
              I confirm that the above knowledge is true to the best of my knowledge
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!consent || !declarations.finalConfirmation}
          className={`px-6 py-3 rounded text-white transition ${consent && declarations.finalConfirmation
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}
