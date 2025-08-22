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
  const [loanAmount, setLoanAmount] = useState<string>('');

  const [contactPersonData] = useState<Array<{ name: string, phone: string, designation: string }>>([
  { name: 'Ashwini Shekhawat', phone: '+91-98765-43210', designation: 'RM' },
  { name: 'Sarah Johnson', phone: '+91-91234-56780', designation: 'BM' },
  { name: 'Shrihari Rao', phone: '+91-87654-32109', designation: 'RM' },
  { name: 'Emily Davis', phone: '+91-92345-67890', designation: 'BM' },
  { name: 'Rajesh Kumar', phone: '+91-76543-21098', designation: 'RM' },
  { name: 'Lisa Anderson', phone: '+91-93456-78901', designation: 'BM' },
  { name: 'Robert Taylor', phone: '+91-94567-89012', designation: 'RM' },
  { name: 'Jennifer Martinez', phone: '+91-95678-90123', designation: 'BM' },
  { name: 'David Schwimmer', phone: '+91-96789-01234', designation: 'RM' },
  { name: 'Monica Geller', phone: '+91-97890-12345', designation: 'BM' },
  { name: 'Phoebe Buffay', phone: '+91-98901-23456', designation: 'RM' },
  { name: 'Joey Tribbiani', phone: '+91-99012-34567', designation: 'BM' },
  { name: 'Chandler Bing', phone: '+91-90123-45678', designation: 'RM' },
  { name: 'Rachel Green', phone: '+91-91234-56789', designation: 'BM' },
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
        incorporatedDate: '02-07-1981',
        email: 'askus@infosys.com',
        address: {
          line1: 'No. 44/97 A, Next to SBI Bank, Hosur Road, Electronic City',
          city: 'Bengaluru',
          state: 'Karnataka-560100',
          country: 'India',
        },
        lead_id: generateLeadId(),
      },
      directors: [
        { din: '00041245', firstName: 'Nandan', lastName: 'Nilekani' },
        { din: '01876159', firstName: 'Salil', lastName: 'Parekh' },
        { din: '00019437', firstName: 'Bobby', lastName: 'Parekh' },
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
      loan_amount: loanAmount ? Number(loanAmount) : undefined,
      aml_company_status: amlCompanyStatus,
      aml_director_status: amlDirectorStatus,
    });

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
            <label className="text-sm font-semibold text-gray-700 mb-2">Company Name</label>
            <input value={companyDetails.name} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2">Lead ID</label>
            <input value={companyDetails.lead_id} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2">Incorporation Date</label>
            <input value={companyDetails.incorporatedDate} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input value={companyDetails.email} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-semibold text-gray-700 mb-2">Address</label>
            <input
              value={`${companyDetails.address.line1}, ${companyDetails.address.city}, ${companyDetails.address.state}`}
              readOnly
              className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
            />
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
                  <label className="text-sm font-semibold text-gray-700 mb-2">DIN</label>
                  <input value={d.din} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input value={d.firstName} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input value={d.lastName} readOnly className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50" />
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
          <label className="text-sm font-semibold text-gray-700 mb-2">Designation</label>
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Designation will auto-populate"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Phone number will auto-populate"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2">Loan Type</label>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Loan Type</option>
            <option value="Term Loan">Term Loan</option>
            <option value="OD/CC">OD/CC</option>
            <option value="LC">LC</option>
            <option value="BG">BG</option>
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
