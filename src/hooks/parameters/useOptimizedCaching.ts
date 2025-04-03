
import { useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheOptions {
  expiryTime?: number;       // Time in ms until cache entry expires
  cleanupInterval?: number;  // Time in ms between cache cleanup operations
  maxSize?: number;          // Maximum number of entries in the cache
}

const DEFAULT_OPTIONS: CacheOptions = {
  expiryTime: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  maxSize: 100
};

/**
 * Creates a memory cache with versioning, automatic cleanup, and LRU eviction
 */
export function createVersionedCache<T>(options: CacheOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const cache = new Map<string, CacheEntry<T>>();
  let currentVersion = 1;
  let cleanupTimer: NodeJS.Timeout | null = null;
  
  // Track access to implement LRU
  const accessTimestamps = new Map<string, number>();
  
  // Start the cleanup timer
  const startCleanupTimer = () => {
    if (cleanupTimer) clearInterval(cleanupTimer);
    
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      
      // Check for expired entries
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > mergedOptions.expiryTime!) {
          cache.delete(key);
          accessTimestamps.delete(key);
        }
      }
      
      // If cache exceeds max size, evict least recently used entries
      if (cache.size > mergedOptions.maxSize!) {
        const sortedKeys = Array.from(accessTimestamps.entries())
          .sort((a, b) => a[1] - b[1])
          .map(([key]) => key);
        
        const keysToRemove = sortedKeys.slice(0, cache.size - mergedOptions.maxSize!);
        
        for (const key of keysToRemove) {
          cache.delete(key);
          accessTimestamps.delete(key);
        }
      }
    }, mergedOptions.cleanupInterval);
  };
  
  startCleanupTimer();
  
  return {
    get: (key: string): T | null => {
      const entry = cache.get(key);
      const now = Date.now();
      
      if (entry && entry.version === currentVersion && now - entry.timestamp < mergedOptions.expiryTime!) {
        // Update access timestamp for LRU
        accessTimestamps.set(key, now);
        return entry.data;
      }
      
      return null;
    },
    
    set: (key: string, data: T): void => {
      const timestamp = Date.now();
      cache.set(key, { data, timestamp, version: currentVersion });
      accessTimestamps.set(key, timestamp);
      
      // If we exceed max size immediately, evict least recently used entry
      if (cache.size > mergedOptions.maxSize!) {
        const oldestKey = Array.from(accessTimestamps.entries())
          .sort((a, b) => a[1] - b[1])[0][0];
        
        cache.delete(oldestKey);
        accessTimestamps.delete(oldestKey);
      }
    },
    
    delete: (key: string): void => {
      cache.delete(key);
      accessTimestamps.delete(key);
    },
    
    clear: (): void => {
      cache.clear();
      accessTimestamps.clear();
    },
    
    updateVersion: (): void => {
      currentVersion++;
    },
    
    size: (): number => {
      return cache.size;
    },
    
    cleanup: (): void => {
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    }
  };
}

/**
 * Hook for using the versioned cache
 */
export function useVersionedCache<T>(options?: CacheOptions) {
  // Create a ref to the cache so it persists between renders
  // We'll create it lazily outside the component to enable sharing across hooks
  
  const getCache = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    // Use a global singleton cache
    if (!window.__VERSIONED_CACHE__) {
      window.__VERSIONED_CACHE__ = createVersionedCache<T>(options);
    }
    
    return window.__VERSIONED_CACHE__ as ReturnType<typeof createVersionedCache<T>>;
  }, [options]);
  
  const updateGlobalVersion = useCallback(() => {
    if (typeof window !== 'undefined') {
      globalCacheVersion++;
      const cache = getCache();
      if (cache) cache.updateVersion();
    }
  }, [getCache]);
  
  return {
    getCache,
    updateGlobalVersion
  };
}

// Add TypeScript definitions
declare global {
  interface Window {
    __VERSIONED_CACHE__: any;
  }
  var globalCacheVersion: number;
}

// Initialize if not already defined
if (typeof globalCacheVersion === 'undefined') {
  globalThis.globalCacheVersion = 1;
}
