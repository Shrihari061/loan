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
  leadData,
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
  const [loanAmount, setLoanAmount] = useState<number | undefined>();

  const [contactPersonData] = useState<Array<{ name: string, phone: string, designation: string }>>([
    { name: 'Ashwini Shekhawat', phone: '+91-98765-43210', designation: 'RM' },
    { name: 'Sarah Johnson', phone: '+1-555-0123', designation: 'BM' },
    { name: 'Shrihari Rao', phone: '+91-87654-32109', designation: 'RM' },
    { name: 'Emily Davis', phone: '+1-555-0124', designation: 'BM' },
    { name: 'Rajesh Kumar', phone: '+91-76543-21098', designation: 'RM' },
    { name: 'Lisa Anderson', phone: '+1-555-0125', designation: 'BM' },
    { name: 'Robert Taylor', phone: '+1-555-0126', designation: 'RM' },
    { name: 'Jennifer Martinez', phone: '+1-555-0127', designation: 'BM' },
    { name: 'David Schwimmer', phone: '+1-555-0128', designation: 'RM' },
    { name: 'Monica Geller', phone: '+1-555-0129', designation: 'BM' },
    { name: 'Phoebe Buffay', phone: '+1-555-0130', designation: 'RM' },
    { name: 'Joey Tribbiani', phone: '+1-555-0131', designation: 'BM' },
    { name: 'Chandler Bing', phone: '+1-555-0132', designation: 'RM' },
    { name: 'Rachel Green', phone: '+1-555-0133', designation: 'BM' },
  ]);

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

  const validateCIN = () => {
    const regex = /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    const isValid = regex.test(cin);
    setCinValid(isValid);
    if (!isValid) return;

    const mockData = {
      company: {
        name: 'Infosys',
        registrationNo: cin,
        incorporatedDate: '12-05-2021',
        email: 'contact@acmetech.com',
        address: {
          line1: '1234 Tech Park Lane',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
        },
        lead_id: generateLeadId(),
      },
      directors: [
        { din: '10020030', firstName: 'Ravi', lastName: 'Sharma' },
        { din: '20030040', firstName: 'Priya', lastName: 'Kumar' },
      ],
    };

    setCompanyDetails(mockData.company);
    setDirectorDetails(mockData.directors);

    startAMLCheckForCompany(mockData.company.name);

    const incorporatedYear = parseInt(mockData.company.incorporatedDate.split('-')[2], 10);
    if (new Date().getFullYear() - incorporatedYear < 5) {
      startAMLCheckForDirectors(mockData.directors);
    }
  };

  const startAMLCheckForCompany = (_companyName: string) => {
    setAmlCompanyStatus('initiated');
    setTimeout(() => setAmlCompanyStatus('pending'), 1000);
    setTimeout(() => {
      const passed = Math.random() > 0.1;
      setAmlCompanyStatus(passed ? 'done' : 'failed');
    }, 2500);
  };

  const startAMLCheckForDirectors = (_directors: DirectorDetails[]) => {
    setAmlDirectorStatus('initiated');
    setTimeout(() => setAmlDirectorStatus('pending'), 1000);
    setTimeout(() => {
      const passed = Math.random() > 0.1;
      setAmlDirectorStatus(passed ? 'done' : 'failed');
    }, 3000);
  };

  const handleSaveAndContinue = () => {
    if (!companyDetails) return;

    setLeadData({
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
      loan_amount: loanAmount,
      aml_company_status: amlCompanyStatus,
      aml_director_status: amlDirectorStatus,
    });

    goToNextStep();
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Company Info & AML Check</h1>

      {/* CIN Entry */}
      <div className="mb-6 flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">CIN Number</label>
          <input
            value={cin}
            onChange={(e) => handleCINChange(e.target.value)}
            className="w-full border px-3 py-2 rounded shadow-sm"
            placeholder="Enter CIN"
          />
        </div>
        <button
          onClick={validateCIN}
          className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700"
        >
          Verify CIN
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <input value={companyDetails.name} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
          </div>
          <div>
            <label className="text-sm font-medium">Lead ID</label>
            <input value={companyDetails.lead_id} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
          </div>
          <div>
            <label className="text-sm font-medium">Incorporation Date</label>
            <input value={companyDetails.incorporatedDate} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={companyDetails.email} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Address</label>
            <input
              value={`${companyDetails.address.line1}, ${companyDetails.address.city}, ${companyDetails.address.state}`}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>
        </div>
      )}

      {/* Director Details */}
      {directorDetails.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-md mb-3">Director Details</h3>
          <div className="space-y-2">
            {directorDetails.map((d, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">DIN</label>
                  <input value={d.din} readOnly className="w-full border px-2 py-1 rounded bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input value={d.firstName} readOnly className="w-full border px-2 py-1 rounded bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input value={d.lastName} readOnly className="w-full border px-2 py-1 rounded bg-gray-100" />
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Contact Person</label>
          <select
            value={contactPerson}
            onChange={(e) => handleContactPersonChange(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Contact Person</option>
            {availableContactPersons.map((person) => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Phone Number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Phone number will auto-populate"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Loan Type</label>
          <select
            value={loanType} // <- Added binding
            onChange={(e) => setLoanType(e.target.value)} // <- Added handler
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Loan Type</option>
            <option value="Term Loan">Term Loan</option>
            <option value="OD/CC">OD/CC</option>
            <option value="LC">LC</option>
            <option value="BG">BG</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Loan Amount</label>
          <input
            type="number"
            value={loanAmount ?? ''} // <- Added binding
            onChange={(e) => setLoanAmount(Number(e.target.value))} // <- Added handler
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Designation</label>
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Designation will auto-populate"
          />
        </div>
      </div>

      {/* Save & Continue */}
      <div className="mt-8">
        <button
          disabled={amlCompanyStatus !== 'done' || (amlDirectorStatus && amlDirectorStatus !== 'done')}
          onClick={handleSaveAndContinue}
          className="bg-green-600 text-white px-6 py-2 rounded shadow disabled:bg-gray-400"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
