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


const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Loan Applications', path: '/loans' },
  { label: 'Appraisal Memos', path: '/memos' },
  { label: 'Financial Analysis', path: '/reports' },
  { label: 'Risk Assessment', path: '/risk' },
  { label: 'Quality Check (QC)', path: '/qc' }, // <-- Added this line
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
            className={`px-5 py-3 cursor-pointer ${location.pathname.startsWith(item.path)
                ? 'bg-gray-700'
                : 'hover:bg-gray-700'
              }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="ml-[220px] p-8 w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/memos" />} />
          <Route path="/memos" element={<AppraisalTable />} />
          <Route path="/memos/:id" element={<MemoDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loans" element={<h2>Loan Applications (Coming Soon)</h2>} />
          <Route path="/reports" element={<CompanyTable />} />
          <Route path="/report/:id" element={<CompanyDetails />} />
          <Route path="/risk" element={<RiskTable />} />
          <Route path="/risk/:id" element={<RiskDetail />} />
          <Route path="/qc" element={<QCTable />} />
          <Route path="/qc/:id" element={<QCViewer />} />  // add route
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
