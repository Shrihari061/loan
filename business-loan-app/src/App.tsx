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

  // Function to get current page title
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    
    // Check for exact matches first
    const exactMatch = navItems.find(item => item.path === currentPath);
    if (exactMatch) return exactMatch.label;
    
    // Check for path starts with (for nested routes)
    const pathMatch = navItems.find(item => currentPath.startsWith(item.path));
    if (pathMatch) return pathMatch.label;
    
    // Special cases for specific routes
    if (currentPath.startsWith('/lead/new')) return 'Create New Lead';
    if (currentPath.startsWith('/memos/') && currentPath !== '/memos') return 'Memo Details';
    if (currentPath.startsWith('/report/') && currentPath !== '/reports') return 'Company Details';
    if (currentPath.startsWith('/risk/') && currentPath !== '/risk') return 'Risk Details';
    if (currentPath.startsWith('/qc/') && currentPath !== '/qc') return 'QC Details';
    
    return 'Dashboard'; // Default fallback
  };

  return (
    <div className="flex font-sans">
      {/* Sidebar */}
      <div className="w-[220px] h-screen fixed top-0 left-0 bg-gray-800 text-gray-100 pt-5 overflow-y-auto">
        {/* Heading */}
        <div className="text-2xl font-bold px-5 pb-5">
          LOS
        </div>

        {navItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className={`px-5 py-3 cursor-pointer ${
              location.pathname.startsWith(item.path)
                ? 'bg-gray-700'
                : 'hover:bg-gray-700'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="ml-[220px] w-full">
        {/* Header with Page Title and Notification Bell */}
        <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">
            {getCurrentPageTitle()}
          </h1>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {/* User Profile Icon */}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loans" element={<h2>Loan Applications (Coming Soon)</h2>} />
            <Route path="/lead" element={<LeadManagement />} />
            <Route path="/lead/new" element={<Input />} />
            <Route path="/lead/new/step1" element={<Step1 />} />
            <Route path="/lead/new/step2" element={<Step2 />} />
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
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <Layout />
  </Router>
);

export default App;
