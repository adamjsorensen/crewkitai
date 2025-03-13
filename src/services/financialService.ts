
import { supabase } from "@/integrations/supabase/client";
import { 
  FinancialCategory, 
  Job, 
  Transaction, 
  FinancialStatement,
  FinancialSummary,
  DateRange
} from "@/types/financial";

// Categories
export const getCategories = async (): Promise<FinancialCategory[]> => {
  const { data, error } = await supabase
    .from('financial_categories')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  
  return data;
};

export const createCategory = async (category: Omit<FinancialCategory, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialCategory> => {
  const { data, error } = await supabase
    .from('financial_categories')
    .insert(category)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }
  
  return data;
};

export const updateCategory = async (id: string, category: Partial<FinancialCategory>): Promise<FinancialCategory> => {
  const { data, error } = await supabase
    .from('financial_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }
  
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('financial_categories')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Jobs
export const getJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
  
  return data;
};

export const getJob = async (id: string): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
  
  return data;
};

export const createJob = async (job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'total_revenue' | 'total_expenses'>): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...job,
      total_revenue: 0,
      total_expenses: 0
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating job:', error);
    throw error;
  }
  
  return data;
};

export const updateJob = async (id: string, job: Partial<Job>): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .update(job)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating job:', error);
    throw error;
  }
  
  return data;
};

export const deleteJob = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// Transactions
export const getTransactions = async (filters?: {
  job_id?: string;
  type?: 'income' | 'expense';
  dateRange?: DateRange;
  category_id?: string;
}): Promise<Transaction[]> => {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      financial_categories(name),
      jobs(name)
    `)
    .order('transaction_date', { ascending: false });
  
  if (filters?.job_id) {
    query = query.eq('job_id', filters.job_id);
  }
  
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  
  if (filters?.dateRange) {
    query = query
      .gte('transaction_date', filters.dateRange.startDate.toISOString().split('T')[0])
      .lte('transaction_date', filters.dateRange.endDate.toISOString().split('T')[0]);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
  
  return data.map(transaction => ({
    ...transaction,
    category_name: transaction.financial_categories?.name,
    job_name: transaction.jobs?.name
  }));
};

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'job_name'>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
  
  // Update job totals if job_id is provided
  if (transaction.job_id) {
    await updateJobTotals(transaction.job_id);
  }
  
  return data;
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(transaction)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
  
  // Get the full transaction to check if it has a job_id
  const { data: fullTransaction } = await supabase
    .from('transactions')
    .select('job_id')
    .eq('id', id)
    .single();
  
  // Update job totals if job_id is provided
  if (fullTransaction?.job_id) {
    await updateJobTotals(fullTransaction.job_id);
  }
  
  return data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  // Get the job_id before deleting
  const { data: transaction } = await supabase
    .from('transactions')
    .select('job_id')
    .eq('id', id)
    .single();
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
  
  // Update job totals if job_id was provided
  if (transaction?.job_id) {
    await updateJobTotals(transaction.job_id);
  }
};

// Helper function to update job totals
const updateJobTotals = async (jobId: string): Promise<void> => {
  // Get all transactions for this job
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('job_id', jobId);
  
  if (error) {
    console.error('Error fetching job transactions:', error);
    return;
  }
  
  // Calculate totals
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Update job
  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
  
  if (updateError) {
    console.error('Error updating job totals:', updateError);
  }
};

// Financial statements (file uploads)
export const getFinancialStatements = async (): Promise<FinancialStatement[]> => {
  const { data, error } = await supabase
    .from('financial_statements')
    .select('*')
    .order('upload_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching financial statements:', error);
    throw error;
  }
  
  return data;
};

export const createFinancialStatement = async (
  statement: Omit<FinancialStatement, 'id' | 'upload_date' | 'processed' | 'error_message'>
): Promise<FinancialStatement> => {
  const { data, error } = await supabase
    .from('financial_statements')
    .insert({
      ...statement,
      processed: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating financial statement:', error);
    throw error;
  }
  
  return data;
};

export const uploadFinancialDocument = async (file: File, statementType: 'bank' | 'sales' | 'expenses'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${statementType}_${Date.now()}.${fileExt}`;
  const filePath = `${statementType}/${fileName}`;
  
  const { error } = await supabase.storage
    .from('financial_documents')
    .upload(filePath, file);
  
  if (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
  
  // Create a record in financial_statements table
  await createFinancialStatement({
    filename: file.name,
    statement_type: statementType
  });
  
  return filePath;
};

// Financial summary and analytics
export const getFinancialSummary = async (dateRange?: DateRange): Promise<FinancialSummary> => {
  // Get all transactions within date range
  const transactions = await getTransactions({ dateRange });
  
  // Get all categories for mapping
  const categories = await getCategories();
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  // Calculate summary metrics
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  // Get all jobs for job profit calculation
  const jobs = await getJobs();
  const jobProfits = jobs.map(job => job.total_revenue - job.total_expenses);
  const avgJobProfit = jobProfits.length > 0 
    ? jobProfits.reduce((sum, profit) => sum + profit, 0) / jobProfits.length 
    : 0;
  
  // Group by category
  const revenueByCategory: Record<string, number> = {};
  const expensesByCategory: Record<string, number> = {};
  
  transactions.forEach(t => {
    if (!t.category_id) return;
    
    const categoryName = categoryMap.get(t.category_id) || 'Uncategorized';
    
    if (t.type === 'income') {
      revenueByCategory[categoryName] = (revenueByCategory[categoryName] || 0) + Number(t.amount);
    } else {
      expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + Number(t.amount);
    }
  });
  
  // Monthly data
  const monthlyData: Record<string, { revenue: number; expenses: number; profit: number }> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.transaction_date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { revenue: 0, expenses: 0, profit: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthYear].revenue += Number(t.amount);
    } else {
      monthlyData[monthYear].expenses += Number(t.amount);
    }
    
    monthlyData[monthYear].profit = monthlyData[monthYear].revenue - monthlyData[monthYear].expenses;
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  const monthlyDataArray = sortedMonths.map(month => ({
    month,
    ...monthlyData[month]
  }));
  
  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    profit,
    profit_margin: profitMargin,
    average_job_profit: avgJobProfit,
    cash_flow: profit, // Simplified cash flow calculation
    revenue_by_category: Object.entries(revenueByCategory).map(([category, amount]) => ({
      category,
      amount
    })),
    expenses_by_category: Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount
    })),
    monthly_data: monthlyDataArray
  };
};
