
import { useState, useEffect, useMemo } from 'react';
import { CompassTaskDisplay } from '@/types/compass';
import { useTaskView, FilterCriteria } from '@/contexts/TaskViewContext';

export const useFilteredTasks = (tasks: CompassTaskDisplay[]) => {
  const { filters } = useTaskView();
  
  // Use useMemo to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    return applyFilters(tasks, filters);
  }, [tasks, filters]);

  return filteredTasks;
};

// This function can be used directly by any component that needs to filter tasks
export const applyFilters = (tasks: CompassTaskDisplay[], filters: FilterCriteria): CompassTaskDisplay[] => {
  if (!tasks || tasks.length === 0 || !filters || Object.keys(filters).length === 0) {
    return tasks || [];
  }
  
  let filtered = [...tasks];
  
  // Apply priority filters
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(task => filters.priority?.includes(task.priority));
  }
  
  // Apply category filters
  if (filters.category && filters.category.length > 0) {
    filtered = filtered.filter(task => task.category && filters.category?.includes(task.category.id));
  }
  
  // Apply tag filters
  if (filters.tag && filters.tag.length > 0) {
    filtered = filtered.filter(task => 
      task.tags && task.tags.some(tag => filters.tag?.includes(tag.id))
    );
  }
  
  // Apply due date filters
  if (filters.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    filtered = filtered.filter(task => {
      if (!task.due_date) return filters.dueDate === null;
      
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (filters.dueDate === 'today') {
        return dueDate.getTime() === today.getTime();
      } else if (filters.dueDate === 'week') {
        return dueDate >= today && dueDate <= endOfWeek;
      } else if (filters.dueDate === 'month') {
        return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
      } else if (filters.dueDate === 'overdue') {
        return dueDate < today;
      }
      return false;
    });
  }
  
  return filtered;
};
