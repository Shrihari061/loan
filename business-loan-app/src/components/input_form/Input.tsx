import React, { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";

const Input: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      {/* Left Fixed Step Pane */}
      <aside className="w-72 bg-white border-r shadow-sm p-6 sticky top-0 h-screen">
        <h2 className="text-2xl font-bold text-blue-600 mb-8">CLOS</h2>
        <ol className="space-y-8 text-gray-700 text-base">
          {/* Step 1 */}
          <li
            onClick={() => setCurrentStep(1)}
            className={`cursor-pointer ${
              currentStep === 1
                ? "text-blue-600 font-semibold"
                : "text-gray-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-white text-sm flex items-center justify-center ${
                  currentStep === 1 ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                1
              </span>
              CIN Verification
            </div>
            <p className="text-sm ml-7 text-gray-500">
              Enter basic company and contact details
            </p>
          </li>

          {/* Step 2 */}
          <li
            onClick={() => setCurrentStep(2)}
            className={`cursor-pointer ${
              currentStep === 2
                ? "text-blue-600 font-semibold"
                : "text-gray-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-white text-sm flex items-center justify-center ${
                  currentStep === 2 ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                2
              </span>
              Financial Entry & Review
            </div>
            <p className="text-sm ml-7 text-gray-500">
              Upload financial documents, review declarations, and submit
              application
            </p>
          </li>
        </ol>
      </aside>

      {/* Right Pane: Form Content */}
      <main className="flex-1 p-10 overflow-y-auto bg-gray-100">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
          {renderStepComponent()}
        </div>
      </main>
    </div>
  );
};

export default Input;
