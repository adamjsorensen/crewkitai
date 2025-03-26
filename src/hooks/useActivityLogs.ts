
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityLogFilters {
  userId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
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

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface UserMap {
  [key: string]: User;
}

const DEFAULT_LIMIT = 20;

export function useActivityLogs(initialFilters: ActivityLogFilters = {}) {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ActivityLogFilters>({
    limit: DEFAULT_LIMIT,
    offset: 0,
    ...initialFilters,
  });

  // Fetch activity logs without joins
  const fetchActivityLogs = async ({ queryKey }: { queryKey: [string, ActivityLogFilters] }) => {
    const [_, currentFilters] = queryKey;
    
    let query = supabase
      .from('user_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (currentFilters.userId) {
      query = query.eq('user_id', currentFilters.userId);
    }
    
    if (currentFilters.actionType && currentFilters.actionType !== 'all') {
      query = query.eq('action_type', currentFilters.actionType);
    }
    
    if (currentFilters.dateFrom) {
      query = query.gte('created_at', currentFilters.dateFrom);
    }
    
    if (currentFilters.dateTo) {
      query = query.lte('created_at', currentFilters.dateTo);
    }

    if (currentFilters.searchTerm) {
      // We need to search in the jsonb field
      query = query.or(`action_details.ilike.%${currentFilters.searchTerm}%`);
    }
    
    if (currentFilters.limit) {
      query = query.limit(currentFilters.limit);
    }
    
    if (currentFilters.offset !== undefined) {
      query = query.range(
        currentFilters.offset,
        currentFilters.offset + (currentFilters.limit || DEFAULT_LIMIT) - 1
      );
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: 'Error fetching activity logs',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
    
    return data || [];
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    if (!userIds.length) return {};

    // Filter out null or undefined values and deduplicate
    const validUserIds = [...new Set(userIds.filter(id => id))];
    
    if (validUserIds.length === 0) return {};

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', validUserIds);

    if (error) {
      console.error('Error fetching user profiles:', error);
      return {};
    }

    // Create a map of user profiles
    const userMap: UserMap = {};
    data?.forEach(user => {
      userMap[user.id] = user;
    });

    return userMap;
  };

  const logsQuery = useQuery({
    queryKey: ['activityLogs', filters],
    queryFn: fetchActivityLogs,
  });

  // Extract unique user IDs from logs, safely handling undefined values
  const getUsersFromLogs = () => {
    const userIds: string[] = [];
    
    (logsQuery.data || []).forEach(log => {
      if (log.user_id) userIds.push(log.user_id);
      if (log.affected_user_id) userIds.push(log.affected_user_id);
    });
    
    return [...new Set(userIds)];
  };

  // Get unique user IDs safely
  const userIds = getUsersFromLogs();

  // Fetch user profiles based on IDs from logs
  const usersQuery = useQuery({
    queryKey: ['activityLogUsers', userIds],
    queryFn: () => fetchUserProfiles(userIds),
    enabled: userIds.length > 0 && !logsQuery.isLoading,
  });

  // Combine logs with user data
  const combinedLogs: ActivityLog[] = (logsQuery.data || []).map(log => {
    const userMap = usersQuery.data || {};
    return {
      ...log,
      user: log.user_id ? userMap[log.user_id] || null : null,
      affected_user: log.affected_user_id ? userMap[log.affected_user_id] || null : null
    };
  });

  const countActivityLogs = async () => {
    let query = supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact' });
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.actionType && filters.actionType !== 'all') {
      query = query.eq('action_type', filters.actionType);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters.searchTerm) {
      // We need to search in the jsonb field
      query = query.or(`action_details.ilike.%${filters.searchTerm}%`);
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

  // Determine if we're still loading data
  const isLoading = logsQuery.isLoading || (usersQuery.isLoading && userIds.length > 0);
  const error = logsQuery.error || usersQuery.error;

  return {
    logs: combinedLogs,
    totalCount,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch: logsQuery.refetch,
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
