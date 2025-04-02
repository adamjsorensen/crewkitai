
import React, { useState, useEffect } from "react";

/**
 * Hook to manage accordion state with localStorage persistence
 * @param defaultValue - Default values for the accordion state
 * @param storageKey - Key to use for localStorage
 * @returns Accordion state and setter
 */
export function useAccordionState(defaultValue: string[] = [], storageKey: string = "sidebar-accordion-state") {
  // Initialize state from localStorage or use default
  const [state, setState] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(storageKey);
      return savedState ? JSON.parse(savedState) : defaultValue;
    }
    return defaultValue;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey]);

  return [state, setState] as const;
}
