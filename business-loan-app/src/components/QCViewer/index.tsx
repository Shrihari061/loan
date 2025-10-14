import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cloneDeep, set, get } from "lodash";
import { Button } from "../ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// Import components
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import RenderBalanceSheet from "./renderBalanceSheet";
import RenderProfitLoss from "./renderProfitLoss";
import RenderCashFlow from "./renderCashFlow";

// Import types and mock data
import type { AnalysisData, QCEntry } from "./types";

const QCViewer: React.FC = () => {
  const { id: leadId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Debug: Log the analysis ID
  console.info(`QCViewer mounted with leadId: ${leadId}`);

  const collections = [
    "Balance Sheet Summary",
    "Profit & Loss Summary",
    "Cash Flow Summary",
  ];
  const years = ["2023", "2024", "2025"];

  // State variables
  const [data, setData] = useState<QCEntry | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>(
    collections[0]
  );
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [originalData, setOriginalData] = useState<AnalysisData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const [openYear, setOpenYear] = useState(false);

  // UI helpers: value coloring and input look
  const isNegativeValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === "") return false;
    const s = String(val).trim();
    if (!s) return false;
    if (/^\(.*\)$/.test(s)) return true;
    const n = Number(s.replace(/[, ]/g, ""));
    return !isNaN(n) && n < 0;
  };

  const isPositiveValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === "") return false;
    const s = String(val).trim();
    if (!s) return false;
    if (/^\(.*\)$/.test(s)) return false;
    const n = Number(s.replace(/[, ]/g, ""));
    return !isNaN(n) && n > 0;
  };

  const getValueInputClass = (
    val: string | number | null | undefined,
    emphasize = false
  ) => {
    const negative = isNegativeValue(val);
    const positive = isPositiveValue(val);
    return `w-full text-right bg-transparent px-1 py-1 rounded transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-transparent hover:bg-gray-50 ${
      negative ? "text-red-600" : positive ? "text-green-600" : "text-gray-900"
    } ${emphasize ? "font-semibold" : ""}`;
  };

  // Simple toast/snackbar
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 1800);
  };

  // Initialize with real data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the analysis ID from URL params
        if (!leadId) {
          console.error("No analysis ID provided in URL");
          showToast("No analysis ID provided. Please check the URL.", "error");
          return;
        }

        console.info(`Loading analysis data for ID: ${leadId}`);
        // Load analysis data
        const analysisResponse = await fetch(
          `http://localhost:5000/analysis/${leadId}`
        );
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setAnalysisData(analysisData);
          setOriginalData(cloneDeep(analysisData));

          // Create QC entry from analysis data
          const qcEntry: QCEntry = {
            _id: analysisData._id,
            customer_name: analysisData.customer_name,
            lead_id: analysisData.lead_id,
            status: "In Progress",
            documents: [],
          };
          setData(qcEntry);
        } else {
          console.error(
            "Failed to load analysis data:",
            analysisResponse.status,
            analysisResponse.statusText
          );
          throw new Error(
            `Failed to load analysis data: ${analysisResponse.status} ${analysisResponse.statusText}`
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Show error message to user
        showToast(
          "Failed to load analysis data. Please check the analysis ID.",
          "error"
        );
        // You could also navigate back to QC table here
        // navigate("/qc");
      }
    };

    loadData();
  }, [leadId]);

  // Helper functions for updating data
  const updateFieldValue = (
    path: string,
    year: string,
    newValue: string
  ) => {
    if (!analysisData) return;

    const newData = cloneDeep(analysisData);
    const fieldObj = get(newData, path);

    if (fieldObj) {
      fieldObj[`value_${year}`] = newValue;
      set(newData, path, fieldObj);
      setAnalysisData(newData);
      setHasUnsavedChanges(true);
    }
  };

  const updateFlexibleItem = (
    parentPath: string,
    index: number,
    year: string,
    newValue: string
  ) => {
    if (!analysisData) return;

    const newData = cloneDeep(analysisData);
    const items = get(newData, parentPath);

    if (items && Array.isArray(items) && items[index]) {
      items[index][`value_${year}`] = newValue;
      set(newData, parentPath, items);
      setAnalysisData(newData);
      setHasUnsavedChanges(true);
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!analysisData || !data) return;

    try {
      const response = await fetch(
        `http://localhost:5000/analysis/analysisByid/${analysisData._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            balanceSheet: analysisData.balanceSheet,
            profitLoss: analysisData.profitLoss,
            cashFlow: analysisData.cashFlow,
          }),
        }
      );

      if (response.ok) {
        setOriginalData(cloneDeep(analysisData));
        setHasUnsavedChanges(false);
        showToast("Changes saved successfully", "success");
      } else {
        showToast("Failed to save changes", "error");
      }
    } catch (err) {
      console.error("Save failed:", err);
      showToast("Error saving changes", "error");
    }
  };

  // Reject handler
  const handleDecline = async () => {
    if (!data) return;

    try {
      const response = await fetch(
        `http://localhost:5000/leads/${data._id}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Rejected" }),
        }
      );

      if (response.ok) {
        // Update local status to reflect rejection
        if (data) {
          setData({ ...data, status: "Rejected" });
        }

        showToast("Lead rejected successfully", "success");

        // Navigate after a short delay to show the status change
        setTimeout(() => {
          navigate("/qc");
        }, 1500);
      } else {
        showToast("Failed to reject lead", "error");
      }
    } catch (err) {
      console.error("Reject failed:", err);
      showToast("Error rejecting lead", "error");
    }
  };

  // Approve handler
  const handleApprove = async (hasChanges: boolean = false) => {
    if (!data) return;

    try {
      const response = await fetch(
        `http://localhost:5000/leads/${leadId}/approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasChanges }),
        }
      );

      if (response.ok) {
        // const result = await response.json();

        // Update local status to reflect approval
        if (data) {
          setData({ ...data, status: "Approved" });
        }

        if (hasChanges) {
          showToast(
            "Lead approved. Ratios are being generated in the background...",
            "success"
          );
        } else {
          showToast("Lead approved successfully", "success");
        }

        // Navigate after a short delay to show the status change
        setTimeout(() => {
          navigate("/qc");
        }, 1500);
      } else {
        showToast("Failed to approve lead", "error");
      }
    } catch (err) {
      console.error("Approve failed:", err);
      showToast("Error approving lead", "error");
    }
  };

  // Approve button click handler
  const handleApproveClick = async () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      await handleApprove(false); // hasChanges = false
    }
  };

  const handleSaveAndApprove = async () => {
    await handleSave();
    await handleApprove(true); // hasChanges = true
  };

  const handleDiscardAndApprove = async () => {
    // Reset to original data
    setAnalysisData(cloneDeep(originalData));
    setHasUnsavedChanges(false);
    await handleApprove(false); // hasChanges = false
  };

  // Render the selected financial statement
  const renderFinancialStatement = () => {
    if (!analysisData) return null;

    const commonProps = {
      analysisData,
      selectedYear,
      updateFieldValue,
      updateFlexibleItem,
      getValueInputClass,
    };

    switch (selectedCollection) {
      case "Balance Sheet Summary":
        return <RenderBalanceSheet {...commonProps} />;
      case "Profit & Loss Summary":
        return <RenderProfitLoss {...commonProps} />;
      case "Cash Flow Summary":
        return <RenderCashFlow {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 font-figtree">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-sm border text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}
      <Button onClick={() => navigate("/qc")}>← Back to QC Table</Button>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Details
            </h2>
            <div className="mt-1 text-sm text-gray-500">
              Overview of the selected lead
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
              ${
                (data?.status || "Pending") === "Approved"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : (data?.status || "Pending") === "Rejected"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : (data?.status || "Pending") === "In Progress"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }
            `}
          >
            {data?.status ?? "Pending"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Customer Name
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {data?.customer_name ?? "-"}
            </div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Lead ID
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {data?.lead_id ?? "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <label className="block mb-2 font-medium">
            Select the type of financial document:
          </label>
          <Popover open={openCollection} onOpenChange={setOpenCollection}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCollection}
                className="w-[280px] justify-between"
              >
                {selectedCollection || "Choose the document"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search document..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No document found.</CommandEmpty>
                  <CommandGroup>
                    {collections.map((col) => (
                      <CommandItem
                        key={col}
                        value={col}
                        onSelect={(currentValue) => {
                          setSelectedCollection(currentValue);
                          setOpenCollection(false);
                        }}
                      >
                        {col}
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedCollection === col
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block mb-2 font-medium">Select a year:</label>
          <Popover open={openYear} onOpenChange={setOpenYear}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openYear}
                className="w-[180px] justify-between"
              >
                {selectedYear || "Select year"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0">
              <Command>
                <CommandInput placeholder="Search year..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No year found.</CommandEmpty>
                  <CommandGroup>
                    {years.map((yr) => (
                      <CommandItem
                        key={yr}
                        value={yr}
                        onSelect={(currentValue) => {
                          setSelectedYear(currentValue);
                          setOpenYear(false);
                        }}
                      >
                        {yr}
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedYear === yr ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        {selectedCollection ? (
          <div className="mt-4">{renderFinancialStatement()}</div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Please select a document type to view the extracted data.
          </div>
        )}
      </div>

      {selectedCollection && (
        <div className="mt-8 flex justify-end space-x-4">
          {(() => {
            const isFinalized =
              data?.status === "Approved" || data?.status === "Rejected";
            return (
              <>
                <button
                  onClick={handleDecline}
                  disabled={isFinalized}
                  className={`text-white px-4 py-2 rounded ${
                    isFinalized
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                  style={{ backgroundColor: "#00306E" }}
                >
                  Reject
                </button>
                <button
                  onClick={handleApproveClick}
                  disabled={isFinalized}
                  className={`text-white px-4 py-2 rounded ${
                    isFinalized
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                  style={{ backgroundColor: "#0266F4" }}
                >
                  Approve
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmSaveDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onSave={handleSaveAndApprove}
        onDiscard={handleDiscardAndApprove}
      />
    </div>
  );
};

export default QCViewer;
