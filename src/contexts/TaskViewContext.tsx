
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  // Load user preferences when component mounts
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

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
        const prefs = data.view_preferences;
        setViewType(prefs.viewType || 'list');
        setFilters(prefs.filters || defaultFilters);
      }
    } catch (err) {
      console.error('Error in load preferences:', err);
    }
  };

  const saveViewPreference = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('compass_user_profiles')
        .update({
          view_preferences: {
            viewType,
            filters
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving view preferences:', error);
      }
    } catch (err) {
      console.error('Error in save preferences:', err);
    }
  };

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
