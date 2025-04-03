
// Define a global cache version to help with cache invalidation
if (typeof window !== 'undefined' && typeof (window as any).globalCacheVersion === 'undefined') {
  (window as any).globalCacheVersion = 1;
}

// Ensure globalCacheVersion is accessible globally
declare global {
  var globalCacheVersion: number;
}

if (typeof globalThis !== 'undefined' && typeof globalThis.globalCacheVersion === 'undefined') {
  globalThis.globalCacheVersion = 1;
}

export function useVersionedCache() {
  // Create a local Map instance for caching
  const localCache = new Map<string, any>();
  
  const getCache = () => {
    return localCache;
  };
  
  const clearCache = () => {
    localCache.clear();
    // Increment the global version to invalidate caches across components
    globalCacheVersion++;
  };
  
  return {
    getCache,
    clearCache
  };
}
