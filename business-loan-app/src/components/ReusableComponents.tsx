import React from 'react';
import { globalStyles } from '../styles/globalStyles';

// Reusable container component with Figtree font
export const FigtreeContainer: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div 
    style={{ 
      ...globalStyles.container, 
      ...style 
    }} 
    className={className}
  >
    {children}
  </div>
);

// Reusable card component with Figtree font
export const FigtreeCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div 
    style={{ 
      ...globalStyles.card, 
      ...style 
    }} 
    className={className}
  >
    {children}
  </div>
);

// Reusable heading component with Figtree font
export const FigtreeHeading: React.FC<{
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, level = 2, style, className }) => {
  const headingStyle = { 
    ...globalStyles.heading, 
    ...style 
  };
  
  switch (level) {
    case 1:
      return <h1 style={headingStyle} className={className}>{children}</h1>;
    case 2:
      return <h2 style={headingStyle} className={className}>{children}</h2>;
    case 3:
      return <h3 style={headingStyle} className={className}>{children}</h3>;
    case 4:
      return <h4 style={headingStyle} className={className}>{children}</h4>;
    case 5:
      return <h5 style={headingStyle} className={className}>{children}</h5>;
    case 6:
      return <h6 style={headingStyle} className={className}>{children}</h6>;
    default:
      return <h2 style={headingStyle} className={className}>{children}</h2>;
  }
};

// Reusable table component with Figtree font
export const FigtreeTable: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <table 
    style={{ 
      ...globalStyles.table, 
      ...style 
    }} 
    className={className}
  >
    {children}
  </table>
);

// Reusable table container with modern styling
export const FigtreeTableContainer: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div 
    style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      boxShadow: '0 4px 13px 2px rgba(0, 0, 0, 0.07)',
      ...style 
    }} 
    className={className}
  >
    {children}
  </div>
);

// Reusable sortable header component
export const SortableHeader: React.FC<{
  children: React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, sortable = true, sortKey, currentSort, onSort, style, className }) => {
  const isActive = currentSort?.key === sortKey;
  const isAsc = currentSort?.direction === 'asc';
  
  const handleClick = () => {
    if (sortable && sortKey && onSort) {
      onSort(sortKey);
    }
  };

  return (
    <th 
      style={{ 
        padding: '16px 20px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        textTransform: 'none',
        letterSpacing: '0.02em',
        borderBottom: '1px solid #e5e7eb',
        cursor: sortable ? 'pointer' : 'default',
        ...style 
      }} 
      className={className}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {children}
                {sortable && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={{
                color: isActive && isAsc ? '#2563eb' : '#9ca3af',
                marginBottom: '-1px'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 14l5-5 5 5" />
            </svg>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={{
                color: isActive && !isAsc ? '#2563eb' : '#9ca3af',
                marginTop: '-1px'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10l5 5 5-5" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
};

// Reusable non-sortable header component with single arrow
export const NonSortableHeader: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <th 
    style={{ 
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      textTransform: 'none',
      letterSpacing: '0.02em',
      borderBottom: '1px solid #e5e7eb',
      cursor: 'default',
      ...style 
    }} 
    className={className}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {children}
      <svg 
        width="10" 
        height="10" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        style={{ color: '#9ca3af' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10l5 5 5-5" />
      </svg>
    </div>
  </th>
);

// Reusable table cell component
export const FigtreeTableCell: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <td 
    style={{ 
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '14px',
      color: '#111827',
      borderBottom: '1px solid #f3f4f6',
      ...style 
    }} 
    className={className}
  >
    {children}
  </td>
);

// Reusable pagination component
export const FigtreePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  style?: React.CSSProperties;
  className?: string;
}> = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, style, className }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        marginTop: '20px',
        padding: '16px 20px',
        ...style 
      }} 
      className={className}
    >
      <div style={{ color: '#6b7280', fontSize: '14px', fontFamily: 'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {startItem}-{endItem} of {totalItems}
      </div>
    </div>
  );
}; 