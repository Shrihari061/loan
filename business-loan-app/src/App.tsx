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

// Add new nav item here
const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Loan Applications', path: '/loans' },
  { label: 'Lead Management', path: '/lead' }, // <-- Added this line
  { label: 'Quality Check (QC)', path: '/qc' },
  { label: 'Financial Analysis', path: '/reports' },
  { label: 'Appraisal Memos', path: '/memos' },
  { label: 'Risk Assessment', path: '/risk' },
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
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}>
          Loan Origination System
        </div>

        {/* Notification Bell - Right */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-[220px] h-screen fixed top-0 left-0 text-gray-700 pt-5 overflow-y-auto bg-white rounded-lg shadow" style={{ marginTop: '60px', marginLeft: '16px', marginBottom: '16px', height: 'calc(100vh - 76px)' }}>

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
              fontWeight: location.pathname.startsWith(item.path) ? '500' : '400'
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="ml-[220px] p-8 w-full" style={{ backgroundColor: '#f8f6f1', marginTop: '60px', minHeight: '100vh' }}>
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
          <Route path="/report/:id" element={<CompanyDetails />} />
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
