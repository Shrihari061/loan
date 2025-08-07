export interface Memo {
  _id: string;
  memo_id: string;
  loan_id: string;
  date: string;
  created_by: string;
  loan_purpose_table: string;
  last_updated: string;
  status: string;
  executive_summary: string;
  financial_analysis: {
    revenue: any;
    profitability: any;
    liquidity: any;
    debt_service_capacity: any;
    summary_highlights: string[];
  };
  SWOT_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  security_offered: {
    primary: string[];
    collateral: {
      description: string;
      valuation: number;
      valuation_date: string;
    };
    personal_guarantees: string[];
  };
  recommendation: {
    tenor: string;
    repayment_terms: string;
    interest_rate_policy: string;
    covenants: string[];
  };
}
