
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { useToast } from "@/hooks/use-toast";

// Logging levels control
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set this to control logging verbosity
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN;

// Custom logger to control logging
const logger = {
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[usePromptParameters] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[usePromptParameters] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[usePromptParameters] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[usePromptParameters] ${message}`, ...args);
  }
};

// Connection test throttling
const MIN_TIME_BETWEEN_TESTS = 60000; // 1 minute
let lastConnectionTest = 0;

/**
 * Cache for storing fetched parameters by promptId
 */
const parametersCache = new Map<string, {
  data: ParameterWithTweaks[],
  timestamp: number
}>();

// Cache expiration time
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching prompt parameters with their tweaks with improved caching and performance
 */
export function usePromptParameters(promptId: string | undefined) {
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  
  // Track when parameters were last successfully fetched
  const lastSuccessfulFetchRef = useRef<number | null>(null);
  
  // Track fetch attempts
  const fetchAttemptCountRef = useRef<number>(0);
  
  // Track component mounted state
  const isMountedRef = useRef(true);
  
  // Debounce fetch to prevent multiple concurrent calls
  const fetchingRef = useRef(false);

  // Use cached data if available and not expired
  const useCachedData = useCallback((promptId: string | undefined) => {
    if (!promptId) return null;
    
    const cachedEntry = parametersCache.get(promptId);
    if (cachedEntry) {
      const now = Date.now();
      if (now - cachedEntry.timestamp < CACHE_EXPIRY_TIME) {
        logger.debug(`Using cached parameters for prompt ID: ${promptId}`);
        return cachedEntry.data;
      } else {
        // Cache expired, remove it
        logger.debug(`Cache expired for prompt ID: ${promptId}`);
        parametersCache.delete(promptId);
      }
    }
    return null;
  }, []);

  // Database connection test with throttling
  const testDatabaseConnection = useCallback(async () => {
    const now = Date.now();
    
    // Skip test if one was done recently
    if (now - lastConnectionTest < MIN_TIME_BETWEEN_TESTS) {
      logger.debug("Skipping database connection test (throttled)");
      return true;
    }
    
    try {
      logger.debug("Testing database connection...");
      const { error: testError } = await supabase.from('prompts').select('count').limit(1);
      
      lastConnectionTest = now;
      
      if (testError) {
        logger.error("Database connection test failed:", testError);
        return false;
      }
      
      logger.debug("Database connection test successful");
      return true;
    } catch (err) {
      lastConnectionTest = now;
      logger.error("Database connection test threw exception:", err);
      return false;
    }
  }, []);

  const fetchParameters = useCallback(async () => {
    if (!promptId) {
      logger.debug("No promptId provided, skipping parameter fetch");
      setParameters([]);
      setIsLoading(false);
      return;
    }
    
    // Don't fetch if already fetching
    if (fetchingRef.current) {
      logger.debug("Already fetching parameters, skipping redundant fetch");
      return;
    }
    
    // Try to use cached data first
    const cachedData = useCachedData(promptId);
    if (cachedData) {
      if (isMountedRef.current) {
        setParameters(cachedData);
        setIsLoading(false);
        setError(null);
      }
      // Still fetch in the background to update the cache
    }

    // Set fetching flag to prevent duplicate requests
    fetchingRef.current = true;
    const attemptNumber = ++fetchAttemptCountRef.current;
    
    try {
      logger.info(`Fetching parameters for prompt ID: ${promptId} (Attempt: ${attemptNumber}, Retry: ${retryCount})`);
      
      // Test connection first (throttled)
      const connectionOk = await testDatabaseConnection();
      
      if (!connectionOk) {
        throw new Error("Database connection test failed");
      }
      
      // SINGLE OPERATION: Fetch everything in a single operation with joins
      const { data: parametersWithRules, error: queryError } = await supabase
        .from('prompt_parameter_rules')
        .select(`
          id,
          is_required,
          is_active,
          order,
          prompt_id,
          parameter_id,
          parameter:prompt_parameters(
            id, 
            name, 
            description, 
            type, 
            active,
            created_at,
            updated_at,
            tweaks:parameter_tweaks(
              id, 
              parameter_id, 
              name, 
              sub_prompt, 
              active, 
              order,
              created_at,
              updated_at
            )
          )
        `)
        .eq('prompt_id', promptId)
        .eq('is_active', true)
        .order('order');
      
      if (queryError) {
        logger.error("Error in joined parameter query:", queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }
      
      if (!parametersWithRules || parametersWithRules.length === 0) {
        logger.info(`No parameter rules found for prompt: ${promptId}`);
        
        // Update cache with empty array
        parametersCache.set(promptId, {
          data: [],
          timestamp: Date.now()
        });
        
        if (isMountedRef.current) {
          setParameters([]);
          setIsLoading(false);
          setError(null);
        }
        
        lastSuccessfulFetchRef.current = Date.now();
        fetchingRef.current = false;
        return;
      }
      
      logger.debug(`Found ${parametersWithRules.length} parameter rules with joined data`);
      
      // Transform the nested data into our expected format
      const transformedParameters = parametersWithRules
        .filter(rule => rule.parameter?.active && rule.parameter?.id)
        .map(rule => {
          const parameter = rule.parameter;
          
          if (!parameter) {
            logger.warn(`Rule ${rule.id} has no valid parameter data`);
            return null;
          }
          
          // Filter out inactive tweaks
          const activeTweaks = (parameter.tweaks || []).filter(tweak => tweak.active);
          
          return {
            ...parameter,
            tweaks: activeTweaks || [],
            rule: {
              id: rule.id,
              prompt_id: rule.prompt_id,
              parameter_id: rule.parameter_id,
              is_active: rule.is_active,
              is_required: rule.is_required,
              order: rule.order,
              created_at: parameter.created_at,
              updated_at: parameter.updated_at
            }
          } as ParameterWithTweaks;
        })
        .filter(Boolean) as ParameterWithTweaks[];
      
      // Update the cache
      parametersCache.set(promptId, {
        data: transformedParameters,
        timestamp: Date.now()
      });
      
      if (isMountedRef.current) {
        setParameters(transformedParameters);
        setError(null);
        setIsLoading(false);
      }
      
      lastSuccessfulFetchRef.current = Date.now();
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching parameters:", err);
      
      if (isMountedRef.current) {
        setError(`Failed to load parameters: ${errorMessage}`);
        
        // Don't clear parameters if we already have cached data
        if (!cachedData) {
          setParameters([]);
        }
        
        setIsLoading(false);
      }
      
      // Only show toast for network or critical errors after multiple failures
      if (attemptNumber > 2 && (errorMessage.includes('network') || errorMessage.includes('connection'))) {
        toast({
          title: "Connection Error",
          description: "There was a problem with your network connection. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [promptId, toast, retryCount, testDatabaseConnection, useCachedData]);

  // Fetch parameters when promptId changes or when retry is triggered
  useEffect(() => {
    // Skip effects if no prompt id or promptId is invalid UUID format
    if (!promptId) return;
    
    // Check for cached data first
    const cachedData = useCachedData(promptId);
    if (cachedData) {
      setParameters(cachedData);
      setIsLoading(false);
      setError(null);
      
      // Still fetch in background to refresh cache but don't show loading state
      fetchParameters();
      return;
    }
    
    setIsLoading(true);
    fetchParameters();
    
    return () => {};
  }, [fetchParameters, promptId, useCachedData]);
  
  // Track component mounted state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Provide a retry mechanism
  const retry = useCallback(() => {
    logger.info("Manually retrying parameter fetch");
    setRetryCount(prev => prev + 1);
    fetchAttemptCountRef.current = 0; // Reset attempt counter on manual retry
  }, []);

  return { 
    parameters, 
    isLoading, 
    error, 
    retry,
    lastSuccessfulFetch: lastSuccessfulFetchRef.current 
  };
}
