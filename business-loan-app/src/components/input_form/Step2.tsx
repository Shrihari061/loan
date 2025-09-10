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
  });

  const [filesAddedInSession, setFilesAddedInSession] = useState<File[]>([]);

  // New state for BFSI-LOS integration
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");

  // New state for BFSI-LOS integration
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");

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
    const updated = selectedYears.filter(year => year !== yearToRemove);
    setSelectedYears(updated);
    
    // Remove files for this year
    const updatedFiles = { ...uploadedFiles };
    Object.keys(updatedFiles).forEach(docType => {
      if (updatedFiles[docType][yearToRemove]) {
        delete updatedFiles[docType][yearToRemove];
      }
    });
    setUploadedFiles(updatedFiles);
    
    // Update current display year

    if (currentDisplayYear === yearToRemove) {
      setCurrentDisplayYear(updated.length > 0 ? updated[0] : "");
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !selectedDocument || !selectedYear) return;

    const newFiles = [...uploadedFiles[selectedDocument]?.[selectedYear] || [], ...files];
    setUploadedFiles(prev => ({
      ...prev,
      [selectedDocument]: {
        ...prev[selectedDocument],
        [selectedYear]: newFiles
      }
    }));

    setFilesAddedInSession(prev => [...prev, ...files]);
  };

  const removeFile = (docType: string, year: string, index: number) => {
    const updatedFiles = { ...uploadedFiles };
    updatedFiles[docType][year].splice(index, 1);
    setUploadedFiles(updatedFiles);
  };

  const removeAllFiles = (docType: string, year: string) => {
    const updatedFiles = { ...uploadedFiles };
    updatedFiles[docType][year] = [];
    setUploadedFiles(updatedFiles);
  };

  const handleCheckboxChange = (key: keyof typeof declarations) => {
    setDeclarations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const canSubmit = Object.values(declarations).every(Boolean);

  const handleCancel = () => {
    setSelectedDocument(null);
    setSelectedYear("");
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Updated handleSubmit function with BFSI-LOS integration
  const handleSubmit = async () => {
    if (!leadData) return;

    console.log("Lead Data at start of handleSubmit:", leadData);

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
    console.log("Required fields check:", {
      business_name: finalLeadData.business_name,
      loan_type: finalLeadData.loan_type, 
      loan_amount: finalLeadData.loan_amount
    });
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

      // Step 1: Submit the lead application
      const response = await axios.post("http://localhost:5000/leads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Lead uploaded successfully:", response.data);
      
      // Step 2: Trigger BFSI-LOS financial analysis
      setIsAnalyzing(true);
      setAnalysisStatus("Starting financial analysis...");
      
      try {
        console.log("Starting BFSI-LOS financial analysis...");
        const analysisResponse = await axios.post(`http://localhost:5000/leads/${response.data._id}/analyze`);
        
        console.log("BFSI-LOS analysis completed:", analysisResponse.data);
        setAnalysisStatus("Financial analysis completed successfully!");
        
        // Fetch analysis results from existing collections
        try {
          const [riskResponse, summaryResponse] = await Promise.all([
            axios.get(`http://localhost:5000/risk?lead_id=${response.data._id}`),
            axios.get(`http://localhost:5000/summary?lead_id=${response.data._id}`)
          ]);
          
          const riskData = riskResponse.data[0];
          const summaryData = summaryResponse.data[0];
          
          const riskRating = riskData?.risk_bucket?.['2025'] || 'N/A';
          const executiveSummary = summaryData?.executive_summary || 'Analysis completed';
          
          setAnalysisStatus("Financial analysis completed successfully!");
          
          // Show success message with analysis results
          alert(`Application submitted successfully!\n\nFinancial Analysis Results:\n- Risk Rating: ${riskRating}\n- Executive Summary: ${executiveSummary.substring(0, 100)}...\n- Analysis Status: Completed`);
        } catch (fetchError) {
          console.error("Error fetching analysis results:", fetchError);
          setAnalysisStatus("Financial analysis completed successfully!");
          alert("Application submitted successfully!\n\nFinancial analysis completed. Results are being processed.");
        }
        
      } catch (analysisError) {
        console.error("BFSI-LOS analysis failed:", analysisError);
        setAnalysisStatus("Financial analysis failed");
        
        // Show warning but don't fail the entire submission
        alert("Application submitted successfully, but financial analysis failed. Please contact administrator for manual review.");
      } finally {
        setIsAnalyzing(false);
      }

    } catch (error) {
      console.error("Error submitting lead:", error);
      alert("Failed to submit application. Check console for details.");
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Financial Documents</h2>
        <p className="text-gray-600">Upload your audited financial statements for the required years</p>
      </div>

      {/* Year Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Financial Years
        </label>
        <div className="flex gap-2 mb-4">
          <select
            value=""
            onChange={(e) => handleYearSelection(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Add Year</option>
            {getAvailableYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        {selectedYears.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedYears.map(year => (
              <div key={year} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span>{year}</span>
                <button
                  onClick={() => removeYear(year)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Upload Sections */}
      {selectedYears.map(year => (
        <div key={year} className="mb-8 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Year {year}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documentTypes.map((docType) => (
              <div key={docType.label} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{docType.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{docType.label}</h4>
                    {docType.audited && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Audited Required
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedDocument(docType.label);
                      setSelectedYear(year);
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    {uploadedFiles[docType.label]?.[year]?.length > 0 
                      ? `View Files (${uploadedFiles[docType.label][year].length})`
                      : "Upload Files"
                    }
                  </button>
                  
                  {uploadedFiles[docType.label]?.[year]?.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {uploadedFiles[docType.label][year].map((file, idx) => (
                        <div key={idx} className="truncate" title={file.name}>
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* File Upload Modal */}
      {isModalOpen && selectedDocument && selectedYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Upload {selectedDocument} for {selectedYear}
            </h3>

            <div className="mb-4">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Uploaded Files List */}
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

        {/* Analysis Status Display */}
        {isAnalyzing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 font-medium">{analysisStatus}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isAnalyzing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? "Processing..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
