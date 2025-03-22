import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Define the feature flags interface
export interface FeatureFlags {
  enableStreaming: boolean;
  // Add more feature flags here as needed
}

// Default feature flags
export const defaultFlags: FeatureFlags = {
  enableStreaming: false,
};

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  updateFlag: (name: keyof FeatureFlags, value: boolean) => Promise<void>;
  refreshFlags: () => Promise<void>;
  isAdmin: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  // Debug logging function
  const logDebug = (message: string, data?: any) => {
    console.log(`[FeatureFlags] ${message}`, data || '');
  };

  // Function to check if user is an admin
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      // Query the database to check if the user has admin role
      logDebug('Checking admin status for user', user.id);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        logDebug('Error checking admin status', error);
        setIsAdmin(false);
        return;
      }

      const isUserAdmin = data?.role === 'admin';
      logDebug('User admin status', isUserAdmin);
      setIsAdmin(isUserAdmin);
    } catch (error) {
      logDebug('Exception checking admin status', error);
      setIsAdmin(false);
    }
  };

  // Function to fetch flags from localStorage
  const fetchFlags = async () => {
    try {
      logDebug('Fetching feature flags from localStorage');
      const storedFlags = localStorage.getItem('featureFlags');
      if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags);
        logDebug('Successfully loaded feature flags from localStorage', parsedFlags);
        setFlags({ ...defaultFlags, ...parsedFlags });
      } else {
        logDebug('No feature flags found in localStorage, using defaults', defaultFlags);
        setFlags(defaultFlags);
      }
    } catch (error) {
      logDebug('Error loading feature flags from localStorage', error);
      setFlags(defaultFlags);
    }
  };

  // Function to fetch flags from the database
  const fetchFlagsFromDB = async () => {
    try {
      logDebug('Fetching feature flags from database');
      const { data, error } = await supabase
        .from('feature_flags')
        .select('name, enabled');

      if (error) {
        logDebug('Error fetching feature flags from database', error);
        return;
      }

      if (data && data.length > 0) {
        const dbFlags: Partial<FeatureFlags> = {};
        
        data.forEach((flag) => {
          dbFlags[flag.name as keyof FeatureFlags] = flag.enabled;
        });

        logDebug('Successfully loaded feature flags from database', dbFlags);
        
        // Update localStorage with the latest flags
        localStorage.setItem('featureFlags', JSON.stringify(dbFlags));
        
        // Update state with the latest flags
        setFlags({ ...defaultFlags, ...dbFlags });
      } else {
        logDebug('No feature flags found in database, using defaults', defaultFlags);
      }
    } catch (error) {
      logDebug('Exception fetching feature flags from database', error);
    }
  };

  // Function to update a flag (admin only)
  const updateFlag = async (name: keyof FeatureFlags, value: boolean): Promise<void> => {
    if (!isAdmin) {
      logDebug('Update flag attempt by non-admin user', { name, value });
      throw new Error('Only admins can update feature flags');
    }

    try {
      logDebug(`Updating feature flag: ${name} to ${value}`);
      
      // Update in database
      const { error } = await supabase
        .from('feature_flags')
        .upsert({
          name: name.toString(),
          enabled: value,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        logDebug('Error updating feature flag in database', { name, value, error });
        throw new Error(`Failed to update feature flag: ${error.message}`);
      }

      // Update local state
      const updatedFlags = { ...flags, [name]: value };
      setFlags(updatedFlags);
      
      // Update localStorage
      localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
      
      logDebug('Feature flag updated successfully', { name, value });
    } catch (error) {
      logDebug('Exception updating feature flag', { name, value, error });
      throw error;
    }
  };

  // Function to refresh flags (fetch latest from database)
  const refreshFlags = async (): Promise<void> => {
    logDebug('Refreshing feature flags');
    await fetchFlagsFromDB();
  };

  // Initialize on mount
  useEffect(() => {
    logDebug('FeatureFlagsProvider mounted');
    fetchFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check admin status when user changes
  useEffect(() => {
    logDebug('User changed, checking admin status');
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refresh flags from database when user logs in
  useEffect(() => {
    if (user) {
      logDebug('User logged in, fetching flags from database');
      fetchFlagsFromDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, updateFlag, refreshFlags, isAdmin }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};