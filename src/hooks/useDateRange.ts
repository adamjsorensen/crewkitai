
import { useState, useMemo } from 'react';
import { TimeFilter, DateRange } from '@/types/financial';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';

export const useDateRange = (initialFilter: TimeFilter = 'month') => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialFilter);
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: subMonths(new Date(), 1),
    endDate: new Date()
  });

  const dateRange = useMemo(() => {
    const today = new Date();
    
    switch (timeFilter) {
      case 'month':
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        };
      case 'quarter':
        return {
          startDate: startOfQuarter(today),
          endDate: endOfQuarter(today)
        };
      case 'year':
        return {
          startDate: startOfYear(today),
          endDate: endOfYear(today)
        };
      case 'custom':
        return customDateRange;
    }
  }, [timeFilter, customDateRange]);

  const previousDateRange = useMemo(() => {
    switch (timeFilter) {
      case 'month':
        return {
          startDate: startOfMonth(subMonths(dateRange.startDate, 1)),
          endDate: endOfMonth(subMonths(dateRange.endDate, 1))
        };
      case 'quarter':
        return {
          startDate: startOfQuarter(subQuarters(dateRange.startDate, 1)),
          endDate: endOfQuarter(subQuarters(dateRange.endDate, 1))
        };
      case 'year':
        return {
          startDate: startOfYear(subYears(dateRange.startDate, 1)),
          endDate: endOfYear(subYears(dateRange.endDate, 1))
        };
      case 'custom':
        // For custom, calculate same length of time but previous
        const durationMs = dateRange.endDate.getTime() - dateRange.startDate.getTime();
        return {
          startDate: new Date(dateRange.startDate.getTime() - durationMs),
          endDate: new Date(dateRange.endDate.getTime() - durationMs)
        };
    }
  }, [timeFilter, dateRange]);

  return {
    timeFilter,
    setTimeFilter,
    dateRange,
    previousDateRange,
    customDateRange,
    setCustomDateRange
  };
};
