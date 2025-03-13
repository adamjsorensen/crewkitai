
export type FinancialCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  name: string;
  client_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  total_revenue: number;
  total_expenses: number;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  job_id?: string;
  category_id?: string;
  transaction_date: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
  // For UI display
  category_name?: string;
  job_name?: string;
};

export type FinancialStatement = {
  id: string;
  filename: string;
  statement_type: 'bank' | 'sales' | 'expenses';
  upload_date: string;
  start_date?: string;
  end_date?: string;
  processed: boolean;
  error_message?: string;
};

export type FinancialSummary = {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  profit_margin: number;
  average_job_profit: number;
  cash_flow: number;
  revenue_by_category: { category: string; amount: number }[];
  expenses_by_category: { category: string; amount: number }[];
  monthly_data: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
};

export type TimeFilter = 'month' | 'quarter' | 'year' | 'custom';
export type DateRange = {
  startDate: Date;
  endDate: Date;
};
