// Shared caching utilities for Supabase Edge Functions
// Provides Redis-like caching interface with built-in memory fallback

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000;
  
  set<T>(key: string, value: T, ttlSeconds: number): void {
    // Simple LRU eviction when cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Global memory cache instance
const memoryCache = new MemoryCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Cache response with automatic cache-aside pattern
 * @param key Cache key
 * @param ttlSeconds Time to live in seconds
 * @param fetchFn Function to fetch fresh data
 * @returns Cached or fresh data
 */
export async function getCachedResponse<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try memory cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const fresh = await fetchFn();
  
  // Cache the result
  memoryCache.set(key, fresh, ttlSeconds);
  
  return fresh;
}

/**
 * Cache invalidation utilities
 */
export const cacheUtils = {
  /**
   * Invalidate cache entries by pattern
   * @param pattern Cache key pattern (supports wildcards)
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache['cache'].keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  },
  
  /**
   * Invalidate specific cache key
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    memoryCache.delete(key);
  },
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    memoryCache.clear();
  }
};

/**
 * Cache TTL constants for different data types
 */
export const CACHE_TTL = {
  // Static or rarely changing data
  SALON_PROFILE: 30 * 60, // 30 minutes
  SALON_SERVICES: 15 * 60, // 15 minutes
  USER_PROFILE: 10 * 60, // 10 minutes
  
  // Dynamic data with moderate update frequency
  SALON_SEARCH: 5 * 60, // 5 minutes
  AVAILABILITY: 2 * 60, // 2 minutes
  
  // Frequently changing data
  APPOINTMENT_STATUS: 30, // 30 seconds
  REAL_TIME_DATA: 10, // 10 seconds
  
  // Long-term cacheable data
  STATIC_CONFIG: 60 * 60, // 1 hour
  API_KEYS: 60 * 60, // 1 hour
} as const;

/**
 * Generate cache keys with consistent naming
 */
export const cacheKeys = {
  salonProfile: (salonId: string) => `salon:profile:${salonId}`,
  salonServices: (salonId: string) => `salon:services:${salonId}`,
  salonSearch: (query: string, city?: string, state?: string) => 
    `salon:search:${query}:${city || 'any'}:${state || 'any'}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  availability: (salonId: string, date: string) => `availability:${salonId}:${date}`,
  appointment: (appointmentId: string) => `appointment:${appointmentId}`,
} as const;