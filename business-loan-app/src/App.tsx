import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AppraisalTable from './components/AppraisalTable';
import MemoDetails from './components/MemoDetails';
import CompanyTable from './components/CompanyTable';
import CompanyDetails from './components/CompanyDetails';
import RiskTable from './components/riskTable';
import RiskDetail from './components/RiskDetail';
import Dashboard from './components/Dashboard';
import QCTable from './components/QCTable';
import QCViewer from './components/QCViewer';
import LeadManagement from './components/LeadManagement';
import Step1 from './components/input_form/Step1';
import Step2 from './components/input_form/Step2';
import Input from './components/input_form/Input';
import unityBankLogo from './assets/unity-bank-logo.svg';
import NotificationBell from './components/NotificationBell';
import Group50Icon from './assets/Group50.svg';

// Add new nav item here
const navItems = [
  { 
    label: 'Dashboard', 
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    label: 'Lead Management', 
    path: '/lead',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    label: 'Quality Check (QC)', 
    path: '/qc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    label: 'Financial Analysis', 
    path: '/reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )
  },
  { 
    label: 'Risk Assessment', 
    path: '/risk',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    )
  },
  { 
    label: 'Appraisal Memos', 
    path: '/memos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex font-sans" style={{ backgroundColor: '#f8f6f1' }}>
      {/* Unity Bank Logo Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#f8f6f1',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        {/* Unity Bank Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Unity Bank Logo */}
          <img 
            src={unityBankLogo} 
            alt="Unity Small Finance Bank" 
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Loan Origination System - Centered */}
        {/* <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151',
          fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Loan Origination System
        </div> */}

        {/* Notification Bell - Right */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-[220px] h-screen fixed top-0 left-0 text-gray-700 pt-5 overflow-y-auto bg-white rounded-lg shadow" style={{ 
        marginTop: '60px', 
        marginLeft: '16px', 
        marginBottom: '16px', 
        height: 'calc(100vh - 76px)',
        zIndex: 999,
        position: 'fixed',
        padding: '20px'
      }}>

        {/* Logo and CLOS Text */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
          padding: '12px 20px'
        }}>
          <img 
            src={Group50Icon} 
            alt="CLOS Logo" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain'
            }}
          />
          <div style={{
            width: '1px',
            height: '20px',
            backgroundColor: '#374151'
          }}></div>
          <span style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#000000',
            fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            CLOS
          </span>
        </div>

        {/* Navigation Items */}
        <div>
          {navItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className={`px-5 py-3 cursor-pointer transition-colors duration-200 ${
              location.pathname.startsWith(item.path)
                ? 'bg-gray-100'
                : 'hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: location.pathname.startsWith(item.path) ? '#f3f4f6' : 'transparent',
              color: location.pathname.startsWith(item.path) ? '#111827' : '#6b7280',
              fontWeight: location.pathname.startsWith(item.path) ? '500' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{
              color: location.pathname.startsWith(item.path) ? '#111827' : '#6b7280',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.icon}
            </div>
            {item.label}
          </div>
        ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-[220px] p-8 w-full" style={{ 
        backgroundColor: '#f8f6f1', 
        marginTop: '60px', 
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loans" element={<h2>Loan Applications (Coming Soon)</h2>} />
          <Route path="/lead" element={<LeadManagement />} />
          <Route path="/lead/new" element={<Input />} />
          <Route path="/lead/new/step1" element={<Step1 setLeadData={() => {}} leadData={{}} goToNextStep={() => {}} />} />
          <Route path="/lead/new/step2" element={<Step2 leadData={{}} setLeadData={() => {}} />} />
          <Route path="/memos" element={<AppraisalTable />} />
          <Route path="/memos/:id" element={<MemoDetails />} />
          <Route path="/reports" element={<CompanyTable />} />
          <Route path="/reports/:id" element={<CompanyDetails />} />
          <Route path="/risk" element={<RiskTable />} />
          <Route path="/risk/:id" element={<RiskDetail />} />
          <Route path="/qc" element={<QCTable />} />
          <Route path="/qc/:id" element={<QCViewer />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <Layout />
  </Router>
);

export default App;
