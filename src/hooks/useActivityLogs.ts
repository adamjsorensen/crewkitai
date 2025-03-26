
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
  affected_user_id?: string | null;
  affected_resource_type?: string | null;
  affected_resource_id?: string | null;
  conversation_id?: string | null;
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

  // Fetch activity logs from both tables
  const fetchActivityLogs = async ({ queryKey }: { queryKey: [string, ActivityLogFilters] }) => {
    const [_, currentFilters] = queryKey;
    
    // Query user_activity_logs
    let userActivityQuery = supabase
      .from('user_activity_logs')
      .select('*, action_type, action_details, created_at, user_id, affected_user_id, affected_resource_type, affected_resource_id, ip_address, user_agent')
      .order('created_at', { ascending: false });
    
    // Query pg_activity_logs
    let pgActivityQuery = supabase
      .from('pg_activity_logs')
      .select('*, action_type, action_details, created_at, user_id, conversation_id')
      .order('created_at', { ascending: false });
    
    // Apply filters to both queries
    if (currentFilters.userId) {
      userActivityQuery = userActivityQuery.eq('user_id', currentFilters.userId);
      pgActivityQuery = pgActivityQuery.eq('user_id', currentFilters.userId);
    }
    
    if (currentFilters.actionType && currentFilters.actionType !== 'all') {
      userActivityQuery = userActivityQuery.eq('action_type', currentFilters.actionType);
      pgActivityQuery = pgActivityQuery.eq('action_type', currentFilters.actionType);
    }
    
    if (currentFilters.dateFrom) {
      userActivityQuery = userActivityQuery.gte('created_at', currentFilters.dateFrom);
      pgActivityQuery = pgActivityQuery.gte('created_at', currentFilters.dateFrom);
    }
    
    if (currentFilters.dateTo) {
      userActivityQuery = userActivityQuery.lte('created_at', currentFilters.dateTo);
      pgActivityQuery = pgActivityQuery.lte('created_at', currentFilters.dateTo);
    }

    if (currentFilters.searchTerm) {
      userActivityQuery = userActivityQuery.or(`action_details.ilike.%${currentFilters.searchTerm}%`);
      pgActivityQuery = pgActivityQuery.or(`action_details.ilike.%${currentFilters.searchTerm}%`);
    }
    
    // Execute both queries
    const [userActivityResult, pgActivityResult] = await Promise.all([
      userActivityQuery,
      pgActivityQuery
    ]);
    
    if (userActivityResult.error) {
      console.error('Error fetching user activity logs:', userActivityResult.error);
      toast({
        title: 'Error fetching user activity logs',
        description: userActivityResult.error.message,
        variant: 'destructive',
      });
      throw userActivityResult.error;
    }
    
    if (pgActivityResult.error) {
      console.error('Error fetching pg activity logs:', pgActivityResult.error);
      toast({
        title: 'Error fetching pg activity logs',
        description: pgActivityResult.error.message,
        variant: 'destructive',
      });
      throw pgActivityResult.error;
    }
    
    // Normalize pg_activity_logs to match the format of user_activity_logs
    const normalizedPgLogs = (pgActivityResult.data || []).map(log => ({
      ...log,
      affected_resource_id: log.conversation_id,
      affected_resource_type: log.conversation_id ? 'conversation' : null,
      affected_user_id: null,
      ip_address: null,
      user_agent: null
    }));
    
    // Combine results
    const combinedLogs = [
      ...(userActivityResult.data || []),
      ...normalizedPgLogs
    ];
    
    // Sort by created_at
    combinedLogs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Apply pagination
    if (currentFilters.limit !== undefined && currentFilters.offset !== undefined) {
      const start = currentFilters.offset;
      const end = start + currentFilters.limit;
      return combinedLogs.slice(start, end);
    }
    
    return combinedLogs;
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
    
    return [...new Set(userIds.filter(id => id))];
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
    // Count from user_activity_logs
    let userActivityQuery = supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact' });
    
    // Count from pg_activity_logs
    let pgActivityQuery = supabase
      .from('pg_activity_logs')
      .select('id', { count: 'exact' });
    
    // Apply the same filters to both
    if (filters.userId) {
      userActivityQuery = userActivityQuery.eq('user_id', filters.userId);
      pgActivityQuery = pgActivityQuery.eq('user_id', filters.userId);
    }
    
    if (filters.actionType && filters.actionType !== 'all') {
      userActivityQuery = userActivityQuery.eq('action_type', filters.actionType);
      pgActivityQuery = pgActivityQuery.eq('action_type', filters.actionType);
    }
    
    if (filters.dateFrom) {
      userActivityQuery = userActivityQuery.gte('created_at', filters.dateFrom);
      pgActivityQuery = pgActivityQuery.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      userActivityQuery = userActivityQuery.lte('created_at', filters.dateTo);
      pgActivityQuery = pgActivityQuery.lte('created_at', filters.dateTo);
    }

    if (filters.searchTerm) {
      userActivityQuery = userActivityQuery.or(`action_details.ilike.%${filters.searchTerm}%`);
      pgActivityQuery = pgActivityQuery.or(`action_details.ilike.%${filters.searchTerm}%`);
    }
    
    // Execute both counts
    const [userResult, pgResult] = await Promise.all([
      userActivityQuery,
      pgActivityQuery
    ]);
    
    if (userResult.error) {
      console.error('Error counting user activity logs:', userResult.error);
      return 0;
    }
    
    if (pgResult.error) {
      console.error('Error counting pg activity logs:', pgResult.error);
      return 0;
    }
    
    // Return the sum of both counts
    return (userResult.count || 0) + (pgResult.count || 0);
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
