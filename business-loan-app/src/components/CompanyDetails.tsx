import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ added useNavigate
import CompanyRatioAnalysis from './CompanyRatioAnalysis';

interface FinancialItem {
  _id: string;
  item: string;
  FY2023: number | null;
  FY2024: number | null;
  FY2025: number | null;
}

interface CompanyData {
  _id: string;
  company_name: string;
  lead_id: string;
  net_worth: number | string;
  debt_to_equity: number | string;
  dscr: number | string;
  year_range: string;
  ratio_health: string;
  balance_sheet: FinancialItem[];
  profit_loss: FinancialItem[];
  cash_flow: FinancialItem[];
}

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // ✅ added navigate
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'ratio'>('source');
  const [selectedDocument, setSelectedDocument] = useState<'balance_sheet' | 'profit_loss' | 'cash_flow'>('balance_sheet');

  // Financial document types
  const financialDocuments = [
    { key: 'balance_sheet', name: 'Balance Sheet Data', icon: '📊' },
    { key: 'profit_loss', name: 'P&L Data', icon: '📈' },
    { key: 'cash_flow', name: 'Cash Flow Data', icon: '💰' }
  ];

  // Fetch company details
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`http://localhost:5000/analysis/${id}`);
        const data = await res.json();

        // Add dummy values to the financial data for display
        const dataWithDummyValues = {
          ...data,
          balance_sheet: (data.balance_sheet || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 || generateDummyValue(item.item, 'balance_sheet', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'balance_sheet', 2024)
          })),
          profit_loss: (data.profit_loss || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 || generateDummyValue(item.item, 'profit_loss', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'profit_loss', 2024)
          })),
          cash_flow: (data.cash_flow || []).map((item: FinancialItem) => ({
            ...item,
            FY2023: item.FY2023 || generateDummyValue(item.item, 'cash_flow', 2023),
            FY2024: item.FY2024 || generateDummyValue(item.item, 'cash_flow', 2024)
          }))
        };

        setCompany(dataWithDummyValues);
      } catch (error) {
        console.error('Failed to fetch company data:', error);
      }
    };
    fetchCompany();
  }, [id]);

  const formatValue = (value: number | string | null) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    const numValue = Number(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN');
  };

  const getValueColor = (value: number | string | null) => {
    if (value === null || value === undefined) return '#111827';

    if (typeof value === 'string') {
      if (value.startsWith('(') && value.endsWith(')')) {
        return '#ef4444'; // Red for negative values in parentheses
      }
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue < 0 ? '#ef4444' : '#111827';
      }
      return '#111827';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return '#111827';
    return numValue < 0 ? '#ef4444' : '#111827';
  };

  const generateDummyValue = (itemName: string, documentType: string, year: number): number => {
    const baseValue = 50000;
    const yearMultiplier = 1 + (year - 2022) * 0.15;

    let itemMultiplier = 1;

    if (documentType === 'balance_sheet') {
      if (itemName.includes('Assets')) itemMultiplier = 2.5;
      else if (itemName.includes('Equity')) itemMultiplier = 1.8;
      else if (itemName.includes('Debt')) itemMultiplier = 0.8;
      else if (itemName.includes('Liabilities')) itemMultiplier = 1.2;
      else if (itemName.includes('Receivables')) itemMultiplier = 0.6;
      else if (itemName.includes('Payables')) itemMultiplier = 0.4;
    } else if (documentType === 'profit_loss') {
      if (itemName.includes('Revenue') || itemName.includes('Sales')) itemMultiplier = 3.0;
      else if (itemName.includes('Profit')) itemMultiplier = 1.5;
      else if (itemName.includes('Expense')) itemMultiplier = 0.7;
      else if (itemName.includes('Depreciation')) itemMultiplier = 0.3;
    } else if (documentType === 'cash_flow') {
      if (itemName.includes('Principal')) itemMultiplier = 0.2;
    }

    return Math.round(baseValue * itemMultiplier * yearMultiplier);
  };

  const getRiskColor = (health: string | undefined) => {
    if (!health) return '#6b7280';
    switch (health.toLowerCase()) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'moderate': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderFinancialTable = (title: string, data: FinancialItem[]) => {
    if (!data || data.length === 0) return null;

    return (
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {title} <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>(all amounts in Crores of Rs.)</span>
          </h3>
        </div>

        {/* Table Content */}
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Item</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>FY2023</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>FY2024</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>FY2025</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row._id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'left', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    {title === 'Cash Flow Summary' && row.item === 'Principal'
                      ? 'Payment of lease liabilities'
                      : row.item}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: getValueColor(row.FY2023), textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{formatValue(row.FY2023)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: getValueColor(row.FY2024), textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{formatValue(row.FY2024)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: getValueColor(row.FY2025), textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{formatValue(row.FY2025)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!company) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Loading company data...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f6f1',
      minHeight: '100vh',
      fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>
        {`
          * {
            font-family: 'Figtree', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
        `}
      </style>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ✅ Back Button */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/reports')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              color: '#111827',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            ← Back to Financial Analysis Table
          </button>
        </div>

        {/* Header Section */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {company.company_name}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {company.lead_id}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Last Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: getRiskColor(company.ratio_health),
                color: '#fff',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '8px',
                fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {company.ratio_health}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div>Debt-to-Equity: {company.debt_to_equity || 'N/A'}</div>
                <div>Net Worth: ₹{formatValue(company.net_worth)}</div>
                <div>DSCR: {company.dscr || 'N/A'}</div>
                <div>Year Range: {company.year_range}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '0 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { key: 'source', label: 'Source Financials' },
              { key: 'ratio', label: 'Ratio Analysis & Health Check' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '16px 24px',
                  borderBottom: `2px solid ${activeTab === tab.key ? '#2563eb' : 'transparent'}`,
                  backgroundColor: activeTab === tab.key ? '#f8fafc' : 'transparent',
                  color: activeTab === tab.key ? '#2563eb' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Left Panel - Documents */}
          <div style={{
            width: '300px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: '#6b7280', marginRight: '8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Documents</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {financialDocuments.map((doc) => (
                <div
                  key={doc.key}
                  onClick={() => setSelectedDocument(doc.key as 'balance_sheet' | 'profit_loss' | 'cash_flow')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: selectedDocument === doc.key ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${selectedDocument === doc.key ? '#0288d1' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ marginRight: '12px', fontSize: '20px' }}>
                    {doc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: selectedDocument === doc.key ? '#0288d1' : '#111827',
                      fontWeight: selectedDocument === doc.key ? '600' : '500',
                      fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      {doc.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Content */}
          <div style={{ flex: 1 }}>
            {activeTab === 'ratio' ? (
              <CompanyRatioAnalysis />
            ) : (
              <>
                {selectedDocument === 'balance_sheet' && renderFinancialTable('Balance Sheet Summary', company.balance_sheet)}
                {selectedDocument === 'profit_loss' && renderFinancialTable('Profit & Loss Summary', company.profit_loss)}
                {selectedDocument === 'cash_flow' && renderFinancialTable('Cash Flow Summary', company.cash_flow)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
