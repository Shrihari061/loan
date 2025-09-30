import React, { useState } from 'react';

interface CompanyDetails {
  name: string;
  registrationNo: string;
  incorporatedDate: string;
  email: string;
  address: {
    line1: string;
    city: string;
    state: string;
    country: string;
  };
  lead_id?: string;
}

interface DirectorDetails {
  din: string;
  firstName: string;
  lastName: string;
}

export default function Step1({
  setLeadData,
  leadData: _leadData,
  goToNextStep,
}: {
  setLeadData: React.Dispatch<React.SetStateAction<any>>;
  leadData: any;
  goToNextStep: () => void;
}) {
  const [cin, setCIN] = useState('');
  const [cinValid, setCinValid] = useState<boolean | null>(null);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [directorDetails, setDirectorDetails] = useState<DirectorDetails[]>([]);

  const [amlCompanyStatus, setAmlCompanyStatus] = useState<'idle' | 'initiated' | 'pending' | 'done' | 'failed'>('idle');
  const [amlDirectorStatus, setAmlDirectorStatus] = useState<'idle' | 'initiated' | 'pending' | 'done' | 'failed'>('idle');

  const [designation, setDesignation] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loanType, setLoanType] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');

  const [contactPersonData, setContactPersonData] = useState<Array<{ name: string, phone: string, designation: string }>>([]);
  const [loanTypes, setLoanTypes] = useState<string[]>([]);

  const availableContactPersons = contactPersonData.map(person => person.name);

  const handleContactPersonChange = (selectedPerson: string) => {
    setContactPerson(selectedPerson);
    if (selectedPerson) {
      const personData = contactPersonData.find(person => person.name === selectedPerson);
      if (personData) {
        setPhoneNumber(personData.phone);
        setDesignation(personData.designation);
      }
    } else {
      setPhoneNumber('');
      setDesignation('');
    }
  };

  const handleCINChange = (value: string) => {
    setCIN(value);
    setCinValid(null);
    setCompanyDetails(null);
    setDirectorDetails([]);
    setAmlCompanyStatus('idle');
    setAmlDirectorStatus('idle');
  };

  // Utility to generate a random lead ID
  const generateLeadId = () => {
    return 'LEAD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const validateCIN = async () => {
    const regex = /^[A-Z0-9]{21}$/;
    const isValid = regex.test(cin);
    setCinValid(isValid);
    if (!isValid) return;

    try {
      const response = await fetch(`http://localhost:5000/leads/${cin}/data`);
      if (!response.ok) {
        setCinValid(false);
        return;
      }

      const data = await response.json();

      setCompanyDetails({ ...data.company, registrationNo: cin, lead_id: generateLeadId() });
      setDirectorDetails(data.directors || []);
      setContactPersonData(data.contactPersons || []);
      setLoanTypes(data.loanTypes || []);

      startAMLCheckForCompany(data.company.name);

      const incorporatedYear = parseInt(data.company.incorporatedDate.split('-')[2], 10);
      if (new Date().getFullYear() - incorporatedYear < 5) {
        startAMLCheckForDirectors(data.directors || []);
      }
    } catch (err) {
      console.error("Error verifying CIN:", err);
      setCinValid(false);
    }
  };

  const startAMLCheckForCompany = (_companyName: string) => {
    setAmlCompanyStatus('initiated');
    setTimeout(() => setAmlCompanyStatus('pending'), 1000);
    setTimeout(() => {
      const passed = true; // Always pass AML check
      setAmlCompanyStatus(passed ? 'done' : 'failed');
    }, 2500);
  };

  const startAMLCheckForDirectors = (_directors: DirectorDetails[]) => {
    setAmlDirectorStatus('initiated');
    setTimeout(() => setAmlDirectorStatus('pending'), 1000);
    setTimeout(() => {
      const passed = true; // Always pass AML check
      setAmlDirectorStatus(passed ? 'done' : 'failed');
    }, 3000);
  };

  const handleSaveAndContinue = () => {
    if (!companyDetails) return;

    setLeadData((prevData: any) => ({
      ...prevData,
      lead_id: companyDetails.lead_id,
      cin: cin,
      registration_no: companyDetails.registrationNo,
      business_name: companyDetails.name,
      incorporated_date: companyDetails.incorporatedDate,
      contact_email: companyDetails.email,
      address: companyDetails.address,
      directors: directorDetails,
      contact_person: contactPerson,
      contact_phone: phoneNumber,
      designation: designation,
      loan_type: loanType,
      loan_amount: loanAmount ? Number(loanAmount) : undefined,
      aml_company_status: amlCompanyStatus,
      aml_director_status: amlDirectorStatus,
    }));

    goToNextStep();
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Lead Generation</h1>

      {/* CIN Entry */}
      <div className="mb-8 flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Corporate Identification Number (CIN)</label>
          <input
            value={cin}
            onChange={(e) => handleCINChange(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter CIN"
          />
        </div>
        <button
          onClick={validateCIN}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Verify
        </button>
        {cinValid !== null && (
          <span className="text-sm font-semibold">
            {cinValid ? (
              <span className="text-green-600">✓ Valid</span>
            ) : (
              <span className="text-red-600">✗ Invalid</span>
            )}
          </span>
        )}
      </div>

      {/* Company Details */}
      {companyDetails && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
            <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
              {companyDetails.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Lead ID</label>
            <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
              {companyDetails.lead_id}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Incorporation Date</label>
            <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
              {companyDetails.incorporatedDate}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
              {companyDetails.email}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
              {`${companyDetails.address.line1}, ${companyDetails.address.city}, ${companyDetails.address.state}`}
            </div>
          </div>
        </div>
      )}

      {/* Director Details */}
      {directorDetails.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Director Details</h3>
          <div className="space-y-4">
            {directorDetails.map((d, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">DIN</label>
                  <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">{d.din}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">{d.firstName}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">{d.lastName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AML Status */}
      {(amlCompanyStatus !== 'idle' || amlDirectorStatus !== 'idle') && (
        <div className="mb-6 space-y-1 text-sm">
          {amlCompanyStatus !== 'idle' && (
            <div>
              Company AML:{" "}
              <span
                className={`font-semibold ${amlCompanyStatus === 'done'
                  ? 'text-green-600'
                  : amlCompanyStatus === 'failed'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                  }`}
              >
                {amlCompanyStatus.toUpperCase()}
              </span>
            </div>
          )}
          {amlDirectorStatus !== 'idle' && (
            <div>
              Director AML:{" "}
              <span
                className={`font-semibold ${amlDirectorStatus === 'done'
                  ? 'text-green-600'
                  : amlDirectorStatus === 'failed'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                  }`}
              >
                {amlDirectorStatus.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Fields */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2">Assigned To</label>
          <select
            value={contactPerson}
            onChange={(e) => handleContactPersonChange(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Contact Person</option>
            {availableContactPersons.map((person) => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
          <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
            {designation || '—'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
          <div className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900">
            {phoneNumber || '—'}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2">Loan Type</label>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Loan Type</option>
            {loanTypes.map((lt) => (
              <option key={lt} value={lt}>{lt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2">Loan Amount</label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Save & Submit Buttons */}
      <div className="mt-10 flex gap-4">
        <button
          className="bg-white text-gray-700 px-8 py-3 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 font-medium"
        >
          Save
        </button>
        <button
          disabled={
            amlCompanyStatus !== 'done' ||
            (amlDirectorStatus !== 'idle' && amlDirectorStatus !== 'done')
          }
          onClick={handleSaveAndContinue}
          className="bg-gray-600 text-white px-8 py-3 rounded-lg shadow-sm disabled:bg-gray-400 hover:bg-gray-700 font-medium"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
