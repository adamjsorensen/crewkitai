import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityLogFilters {
  userId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  affected_user_id?: string;
  affected_resource_type?: string;
  affected_resource_id?: string;
  user?: {
    full_name: string;
    email: string;
  } | null;
  affected_user?: {
    full_name: string;
    email: string;
  } | null;
}

const DEFAULT_LIMIT = 20;

export function useActivityLogs(initialFilters: ActivityLogFilters = {}) {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ActivityLogFilters>({
    limit: DEFAULT_LIMIT,
    offset: 0,
    ...initialFilters,
  });

  const fetchActivityLogs = async ({ queryKey }) => {
    const [_, currentFilters] = queryKey;
    
    let query = supabase
      .from('user_activity_logs')
      .select(`
        *,
        user:profiles!user_id(full_name, email),
        affected_user:profiles!affected_user_id(full_name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (currentFilters.userId) {
      query = query.eq('user_id', currentFilters.userId);
    }
    
    if (currentFilters.actionType) {
      query = query.eq('action_type', currentFilters.actionType);
    }
    
    if (currentFilters.dateFrom) {
      query = query.gte('created_at', currentFilters.dateFrom);
    }
    
    if (currentFilters.dateTo) {
      query = query.lte('created_at', currentFilters.dateTo);
    }
    
    if (currentFilters.limit) {
      query = query.limit(currentFilters.limit);
    }
    
    if (currentFilters.offset) {
      query = query.range(
        currentFilters.offset,
        currentFilters.offset + (currentFilters.limit || DEFAULT_LIMIT) - 1
      );
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: 'Error fetching activity logs',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
    
    // Cast the data to ActivityLog[] with type assertion after validation
    const logData = data as unknown as ActivityLog[];
    
    return { logs: logData, count };
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activityLogs', filters],
    queryFn: fetchActivityLogs,
  });

  const countActivityLogs = async () => {
    let query = supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact' });
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting activity logs:', error);
      return 0;
    }
    
    return count || 0;
  };

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['activityLogsCount', filters],
    queryFn: countActivityLogs,
  });

  const updateFilters = (newFilters: Partial<ActivityLogFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: newFilters.offset !== undefined ? newFilters.offset : 0,
    }));
  };

  return {
    logs: data?.logs || [],
    count: totalCount,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    pagination: {
      pageCount: Math.ceil(totalCount / (filters.limit || DEFAULT_LIMIT)),
      currentPage: Math.floor((filters.offset || 0) / (filters.limit || DEFAULT_LIMIT)) + 1,
      pageSize: filters.limit || DEFAULT_LIMIT,
      onPageChange: (page: number) => {
        updateFilters({
          offset: (page - 1) * (filters.limit || DEFAULT_LIMIT),
        });
      },
      onPageSizeChange: (size: number) => {
        updateFilters({
          limit: size,
          offset: 0,
        });
      },
    },
  };
}
