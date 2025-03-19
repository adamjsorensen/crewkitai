
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinancialSummary } from "@/services/financialService";
import FinancialLayout from "@/components/financial/FinancialLayout";
import FinancialDateFilter from "@/components/financial/FinancialDateFilter";
import StatCard from "@/components/financial/StatCard";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDateRange } from "@/hooks/useDateRange";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const FinancialDashboard = () => {
  const { 
    timeFilter, 
    setTimeFilter, 
    dateRange,
    previousDateRange,
    customDateRange,
    setCustomDateRange
  } = useDateRange("month");

  const { data: currentSummary, isLoading: isCurrentLoading } = useQuery({
    queryKey: ["financialSummary", dateRange],
    queryFn: () => getFinancialSummary(dateRange),
  });

  const { data: previousSummary } = useQuery({
    queryKey: ["financialSummary", previousDateRange],
    queryFn: () => getFinancialSummary(previousDateRange),
  });

  const handleCustomDateChange = (startDate: Date, endDate: Date) => {
    setCustomDateRange({ startDate, endDate });
  };

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: current > 0 };
    const trend = ((current - previous) / previous) * 100;
    return { value: trend, isPositive: trend > 0 };
  };

  const revenueTrend = currentSummary && previousSummary
    ? calculateTrend(currentSummary.total_revenue, previousSummary.total_revenue)
    : undefined;

  const expensesTrend = currentSummary && previousSummary
    ? calculateTrend(currentSummary.total_expenses, previousSummary.total_expenses)
    : undefined;

  const profitTrend = currentSummary && previousSummary
    ? calculateTrend(currentSummary.profit, previousSummary.profit)
    : undefined;

  const marginTrend = currentSummary && previousSummary
    ? calculateTrend(currentSummary.profit_margin, previousSummary.profit_margin)
    : undefined;

  // Prepare chart data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const pieData = currentSummary?.expenses_by_category.map((item) => ({
    name: item.category,
    value: item.amount,
  })) || [];

  return (
    <FinancialLayout title="Financial Dashboard">
      <div className="space-y-8">
        <FinancialDateFilter
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          customStartDate={customDateRange.startDate}
          customEndDate={customDateRange.endDate}
          onCustomDateChange={handleCustomDateChange}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={currentSummary?.total_revenue || 0}
            icon={DollarSign}
            iconColor="text-green-500"
            isLoading={isCurrentLoading}
            trend={revenueTrend}
          />
          <StatCard
            title="Expenses"
            value={currentSummary?.total_expenses || 0}
            icon={DollarSign}
            iconColor="text-red-500"
            isLoading={isCurrentLoading}
            trend={expensesTrend}
          />
          <StatCard
            title="Profit"
            value={currentSummary?.profit || 0}
            icon={TrendingUp}
            iconColor="text-blue-500"
            isLoading={isCurrentLoading}
            trend={profitTrend}
          />
          <StatCard
            title="Profit Margin"
            value={`${(currentSummary?.profit_margin || 0).toFixed(1)}%`}
            icon={TrendingDown}
            iconColor="text-purple-500"
            isLoading={isCurrentLoading}
            trend={marginTrend}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue & Expenses Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Expenses</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {currentSummary && currentSummary.monthly_data.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentSummary.monthly_data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#60a5fa" name="Revenue" />
                    <Bar dataKey="expenses" fill="#f87171" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {currentSummary && pieData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {currentSummary && currentSummary.monthly_data.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={currentSummary.monthly_data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </FinancialLayout>
  );
};

export default FinancialDashboard;
