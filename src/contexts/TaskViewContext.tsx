
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export type ViewType = 'list' | 'kanban' | 'calendar';
export type FilterCriteria = {
  priority?: string[];
  category?: string[];
  tag?: string[];
  dueDate?: 'today' | 'week' | 'month' | 'overdue' | null;
};

interface TaskViewContextType {
  viewType: ViewType;
  setViewType: (view: ViewType) => void;
  filters: FilterCriteria;
  setFilters: (filters: FilterCriteria) => void;
  saveViewPreference: () => Promise<void>;
}

// Define ViewPreferences as a Record with string keys and Json-compatible values
// This ensures compatibility with the Json type expected by Supabase
interface ViewPreferences extends Record<string, Json> {
  viewType?: ViewType;
  filters?: {
    priority?: string[];
    category?: string[];
    tag?: string[];
    dueDate?: 'today' | 'week' | 'month' | 'overdue' | null;
  };
}

const defaultFilters: FilterCriteria = {};

const TaskViewContext = createContext<TaskViewContextType>({
  viewType: 'list',
  setViewType: () => {},
  filters: defaultFilters,
  setFilters: () => {},
  saveViewPreference: async () => {},
});

export const useTaskView = () => useContext(TaskViewContext);

export const TaskViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [filters, setFilters] = useState<FilterCriteria>(defaultFilters);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Load user preferences when component mounts
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('compass_user_profiles')
        .select('view_preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading view preferences:', error);
        return;
      }

      if (data?.view_preferences) {
        // Safe parsing of the preferences
        const prefs = data.view_preferences as Record<string, any>;
        
        if (prefs.viewType && ['list', 'kanban', 'calendar'].includes(prefs.viewType)) {
          setViewType(prefs.viewType as ViewType);
        }
        
        if (prefs.filters && typeof prefs.filters === 'object') {
          setFilters(prefs.filters as FilterCriteria);
        }
      }
    } catch (err) {
      console.error('Error in load preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveViewPreference = useCallback(async () => {
    if (!user) return;
    
    try {
      // Create a properly structured object that matches the Json type
      const viewPreferences: ViewPreferences = {
        viewType: viewType,
        filters: filters
      };
      
      const { error } = await supabase
        .from('compass_user_profiles')
        .update({
          view_preferences: viewPreferences as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving view preferences:', error);
        toast.error('Failed to save view preferences');
        return;
      }
      
      // Only show toast for successful saves if we have any filters
      if (Object.keys(filters).length > 0) {
        toast.success('View preferences saved');
      }
    } catch (err) {
      console.error('Error in save preferences:', err);
      toast.error('Failed to save view preferences');
    }
  }, [user, viewType, filters]);

  return (
    <TaskViewContext.Provider
      value={{
        viewType,
        setViewType,
        filters,
        setFilters,
        saveViewPreference
      }}
    >
      {children}
    </TaskViewContext.Provider>
  );
};
