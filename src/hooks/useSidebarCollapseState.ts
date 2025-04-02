
import { useState, useEffect } from "react";

/**
 * Hook to persist the sidebar collapse state
 * @param defaultCollapsed - Default state for the sidebar (collapsed or expanded)
 * @returns [isCollapsed, setIsCollapsed] tuple
 */
export function useSidebarCollapseState(defaultCollapsed: boolean = false) {
  const STORAGE_KEY = "sidebar-collapse-state";

  // Initialize from localStorage if available
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(STORAGE_KEY);
      return savedState ? JSON.parse(savedState) : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  // Save to localStorage whenever collapse state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  return [isCollapsed, setIsCollapsed] as const;
}
