import { useState, type ChangeEvent } from "react";
import axios from "axios";

const documentTypes = [
  { label: "Balance Sheet", audited: true, icon: "📊" },
  { label: "Profit & Loss Statement", audited: true, icon: "📈" },
  { label: "Cash Flow Statement", audited: true, icon: "💰" },
];

const years = ["2023", "2024", "2025"];

export default function Step2({
  leadData,
  setLeadData,
}: {
  leadData: any;
  setLeadData: React.Dispatch<React.SetStateAction<any>>;
}) {
  const [consent, setConsent] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, Record<string, File[]>>>({});
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [auditorVerified, setAuditorVerified] = useState<Record<string, boolean>>({});

  const [currentDisplayYear, setCurrentDisplayYear] = useState<string>("");
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const [declarations, setDeclarations] = useState({
    allDocumentsComplete: false,
    auditedSigned: false,
    financialsConsistent: false,
    identifiersValidated: false,
    cmaMatches: false,
    finalConfirmation: false,
  });

  const [filesAddedInSession, setFilesAddedInSession] = useState<File[]>([]);

  const getAvailableYears = () => {
    return years.filter(year => !selectedYears.includes(year));
  };

  const handleYearSelection = (year: string) => {
    if (year && !selectedYears.includes(year)) {
      const updated = [...selectedYears, year].sort();
      setSelectedYears(updated);
      setCurrentDisplayYear(year);
    }
  };

  const removeYear = (yearToRemove: string) => {
    const updatedYears = selectedYears
      .filter(year => year !== yearToRemove)
      .sort();
    setSelectedYears(updatedYears);

    setUploadedFiles(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(docLabel => {
        if (updated[docLabel][yearToRemove]) {
          delete updated[docLabel][yearToRemove];
        }
      });
      return updated;
    });

    if (currentDisplayYear === yearToRemove) {
      if (updatedYears.length > 0) {
        setCurrentDisplayYear(updatedYears[updatedYears.length - 1]);
      } else {
        setCurrentDisplayYear("");
      }
    }
  };

  const openModal = (docLabel: string, year: string) => {
    setSelectedDocument(docLabel);
    setSelectedYear(year);
    setIsModalOpen(true);
    setFilesAddedInSession([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setSelectedYear("");
  };

  const handleCancel = () => {
    if (selectedDocument && selectedYear && filesAddedInSession.length > 0) {
      setUploadedFiles((prev) => {
        const currentFiles = prev[selectedDocument]?.[selectedYear] || [];
        const filesToKeep = currentFiles.filter(file => !filesAddedInSession.includes(file));
        return {
          ...prev,
          [selectedDocument]: {
            ...(prev[selectedDocument] || {}),
            [selectedYear]: filesToKeep,
          }
        };
      });
    }
    setFilesAddedInSession([]);
    closeModal();
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files || !selectedDocument || !selectedYear) return;

    const newFiles = Array.from(files);
    setUploadedFiles((prev) => ({
      ...prev,
      [selectedDocument]: {
        ...(prev[selectedDocument] || {}),
        [selectedYear]: prev[selectedDocument]?.[selectedYear]
          ? [...prev[selectedDocument][selectedYear], ...newFiles]
          : newFiles,
      },
    }));
    setFilesAddedInSession(prev => [...prev, ...newFiles]);
  };

  const removeFile = (docLabel: string, year: string, index: number) => {
    setUploadedFiles((prev) => {
      const updated = [...(prev[docLabel]?.[year] || [])];
      updated.splice(index, 1);
      return {
        ...prev,
        [docLabel]: {
          ...(prev[docLabel] || {}),
          [year]: updated,
        }
      };
    });
  };

  const removeAllFiles = (docLabel: string, year: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docLabel]: {
        ...(prev[docLabel] || {}),
        [year]: [],
      }
    }));
  };

  const handleAuditorVerification = (docLabel: string, verified: boolean) => {
    setAuditorVerified(prev => ({
      ...prev,
      [`${docLabel}_${currentDisplayYear}`]: verified
    }));
  };

  const handleCheckboxChange = (field: keyof typeof declarations) => {
    setDeclarations((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async () => {
    if (!leadData) return;

    const finalLeadData = {
      ...leadData,
      financialDocuments: Object.entries(uploadedFiles).flatMap(([label, yearsObj]) =>
        Object.entries(yearsObj).flatMap(([yr, files]) =>
          files.map(file => ({ label, year: yr, file }))
        )
      ),
      reviewDeclarations: declarations,
    };

    console.log("Final Lead Data ready for upload:", finalLeadData);
    setLeadData(finalLeadData);

    try {
      const formData = new FormData();

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

      finalLeadData.financialDocuments.forEach((doc: any) => {
        formData.append("financialDocuments", doc.file, `${doc.label}-${doc.year}-${doc.file.name}`);
      });

      if (finalLeadData.signature) {
        formData.append("signature", finalLeadData.signature, finalLeadData.signature.name);
      }

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

  const allAuditorsVerified =
    selectedYears.length > 0 &&
    selectedYears.every((year) =>
      documentTypes.every((doc) =>
        doc.audited ? auditorVerified[`${doc.label}_${year}`] === true : true
      )
    );
  const allDeclarationsChecked =
    declarations.allDocumentsComplete &&
    declarations.auditedSigned &&
    declarations.financialsConsistent &&
    declarations.identifiersValidated &&
    declarations.cmaMatches;
  const canSubmit = allAuditorsVerified && allDeclarationsChecked;

  return (
    <div className="p-8 w-full">
      <h2 className="text-2xl font-semibold mb-8 text-gray-800">Step 2: Upload Financial Documents</h2>

      <div className="mb-8">
        <label className="block text-lg font-medium text-gray-700 mb-4">
          Select Financial Year
        </label>
        <div className="flex items-center gap-4">
          <select
            value=""
            onChange={(e) => handleYearSelection(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          >
            <option value="">Select Financial Year</option>
            {getAvailableYears().map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          {getAvailableYears().length === 0 && (
            <span className="text-sm text-gray-500">All years have been selected</span>
          )}
        </div>
      </div>

      {selectedYears.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Selected Years</h3>
          <div className="flex flex-wrap gap-3">
            {selectedYears.sort().map((year) => (
              <div key={year} className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <span className="mr-2">{year}</span>
                <button
                  onClick={() => removeYear(year)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedYears.length > 0 && (
        <div className="space-y-10">
          {selectedYears.sort().map((year) => (
            <div key={year}>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Upload Documents for Financial Year {year}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {documentTypes.map((doc, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start mb-4">
                        <span className="text-3xl mr-3 flex-shrink-0">{doc.icon}</span>
                        <div className="min-h-[3rem]">
                          <h3 className="text-lg font-semibold text-gray-800 leading-tight">{doc.label}</h3>
                          {doc.audited && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block mt-1">
                              Audited Required
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="mb-4 min-h-[3.5rem]">
                          {uploadedFiles[doc.label]?.[year]?.length > 0 ? (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{year}:</span>
                              <ul className="ml-4 list-disc text-xs text-gray-500">
                                {uploadedFiles[doc.label][year].map((file, i) => (
                                  <li key={i}>{file.name}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No files uploaded</div>
                          )}
                        </div>

                        {doc.audited && (
                          <div className="mb-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={auditorVerified[`${doc.label}_${year}`] || false}
                                onChange={(e) =>
                                  setAuditorVerified((prev) => ({
                                    ...prev,
                                    [`${doc.label}_${year}`]: e.target.checked,
                                  }))
                                }
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Auditor Verified</span>
                            </label>
                          </div>
                        )}

                        <button
                          onClick={() => openModal(doc.label, year)}
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                        >
                          {uploadedFiles[doc.label]?.[year]?.length > 0 ? "Manage Files" : "Upload Files"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedDocument && selectedYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Upload {selectedDocument} for {selectedYear}
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id={`file-upload-${selectedDocument}-${selectedYear}`}
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  <label htmlFor={`file-upload-${selectedDocument}-${selectedYear}`} className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)</p>
                  </label>
                </div>
              </div>

              {uploadedFiles[selectedDocument]?.[selectedYear]?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files for {selectedYear}</h4>
                  <div className="space-y-2">
                    {uploadedFiles[selectedDocument][selectedYear].map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">📄</span>
                          <span className="text-sm text-gray-800">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(selectedDocument, selectedYear, index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => removeAllFiles(selectedDocument, selectedYear)}
                    className="text-red-600 text-sm mt-2 hover:underline"
                  >
                    Remove All Files
                  </button>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
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

      <div className="mt-12 border-t pt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Review & Declarations
        </h3>

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
              Audited financial documents are signed by a Chartered Accountant
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
              Financial data is consistent across ITR, GST, and financial statements
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
              PAN, GSTIN, and other identifiers are validated and match uploaded documents
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
              CMA data matches the uploaded documents
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
              canSubmit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Submit Application
          </button>
          {!allAuditorsVerified && (
            <span className="text-sm text-red-600">
              All Auditor Verified checkboxes must be ticked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
