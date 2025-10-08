import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CompanyRatioAnalysis from './CompanyRatioAnalysis';
import FinancialStatementViewer from './FinancialStatementViewer';
import type { AnalysisData } from './QCViewer/types';

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'ratio'>('source');
  const [selectedDocument, setSelectedDocument] = useState<'balance_sheet' | 'profit_loss' | 'cash_flow'>('balance_sheet');

  const financialDocuments = [
    { key: 'balance_sheet', name: 'Balance Sheet Data', icon: '📊' },
    { key: 'profit_loss', name: 'P&L Data', icon: '📈' },
    { key: 'cash_flow', name: 'Cash Flow Data', icon: '💰' }
  ];

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`http://localhost:5000/analysis/${id}`);
        const data = await res.json();
        setCompany(data);
      } catch (error) {
        console.error('Failed to fetch company data:', error);
      }
    };
    fetchCompany();
  }, [id]);

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
                {company.customer_name}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {company.lead_id}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Last Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div>Financial Year: FY2023-2025</div>
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
                onClick={() => setActiveTab(tab.key as 'source' | 'ratio')}
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
          {/* Left Panel - Documents (hidden on Ratio tab) */}
          {activeTab !== 'ratio' && (
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
          )}

          {/* Right Panel - Content */}
          <div style={{ flex: 1 }}>
            {activeTab === 'ratio' ? (
              <CompanyRatioAnalysis />
            ) : (
              <FinancialStatementViewer
                analysisData={company}
                selectedDocument={selectedDocument}
                isMultiYear={true}
                isReadOnly={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
