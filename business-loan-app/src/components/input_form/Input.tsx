import React, { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import requestQuoteIcon from "../../assets/request_quote.svg";
import sourceEnvironmentIcon from "../../assets/source_environment.svg";

interface LeadData {
  lead_id?: string;
  cin?: string;
  registration_no?: string;
  business_name?: string;
  incorporated_date?: string;
  contact_email?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    country: string;
  };
  directors?: { din: string; firstName: string; lastName: string }[];
  contact_person?: string;
  contact_phone?: string;
  designation?: string;
  loan_type?: string;
  loan_amount?: number;
  aml_company_status?: 'idle' | 'initiated' | 'pending' | 'done' | 'failed';
  aml_director_status?: 'idle' | 'initiated' | 'pending' | 'done' | 'failed';
  // New fields for Step2
  financialDocuments?: any[]; // Array of uploaded files
  signature?: File | null;   // Signature file
}

const Input: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // New state to store Step1 and Step2 data temporarily
  const [leadData, setLeadData] = useState<LeadData>({
    financialDocuments: [],
    signature: null,
  });

  const handleNext = () => setCurrentStep((prev) => prev + 1);

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1 setLeadData={setLeadData} leadData={leadData} goToNextStep={handleNext} />;
      case 2:
        return <Step2 leadData={leadData} setLeadData={setLeadData} />;
      default:
        return <Step1 setLeadData={setLeadData} leadData={leadData} goToNextStep={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Left Fixed Step Pane */}
      <aside className="w-80 bg-white border-r border-gray-200 shadow-sm p-8 sticky top-0 h-screen">
        <ol className="space-y-10 text-gray-700 text-base">
          <li
            onClick={() => setCurrentStep(1)}
            className={`cursor-pointer transition-colors ${currentStep === 1 ? "text-blue-600" : "text-gray-400"}`}
          >
            <div className="flex items-start gap-4 relative">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  aspectRatio: '1/1',
                  borderRadius: '100px',
                  border: '1px solid #0266F4',
                  background: '#FFFFFF'
                }}
              >
                <img 
                  src={sourceEnvironmentIcon} 
                  alt="Lead Generation" 
                  className="w-4 h-4"
                  style={{ filter: currentStep === 1 ? 'brightness(0) invert(0)' : 'brightness(0) invert(0.5)' }}
                />
              </div>
              <div className="ml-4">
                <div style={{ color: '#7D7D81', fontFamily: 'Figtree', fontSize: '16px', fontStyle: 'normal', fontWeight: '400', lineHeight: '133.4%' }}>
                  Step 1
                </div>
                <div className={`font-semibold ${currentStep === 1 ? "text-blue-600" : "text-gray-400"}`}>
                  Lead Generation
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Enter basic company and contact details
                </p>
              </div>
            </div>
          </li>

          <li
            onClick={() => setCurrentStep(2)}
            className={`cursor-pointer transition-colors ${currentStep === 2 ? "text-blue-600" : "text-gray-400"}`}
          >
            <div className="flex items-start gap-4 relative">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  aspectRatio: '1/1',
                  borderRadius: '100px',
                  border: '1px solid #0266F4',
                  background: '#FFFFFF'
                }}
              >
                <img 
                  src={requestQuoteIcon} 
                  alt="Financial Documents" 
                  className="w-4 h-4"
                  style={{ filter: currentStep === 2 ? 'brightness(0) invert(0)' : 'brightness(0) invert(0.5)' }}
                />
              </div>
              <div className="ml-4">
                <div style={{ color: '#7D7D81', fontFamily: 'Figtree', fontSize: '16px', fontStyle: 'normal', fontWeight: '400', lineHeight: '133.4%' }}>
                  Step 2
                </div>
                <div className={`font-semibold ${currentStep === 2 ? "text-blue-600" : "text-gray-400"}`}>
                  Financial & Statutory Document Uploads
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Upload financials, tax returns, bank statements, and credit reports
                </p>
              </div>
            </div>
          </li>


        </ol>
      </aside>

      {/* Right Pane: Form Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          {renderStepComponent()}
        </div>
      </main>
    </div>
  );
};

export default Input;
