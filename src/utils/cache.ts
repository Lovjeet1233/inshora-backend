import { logger } from './logger';

// Simple in-memory cache (can be replaced with Redis in production)
class CacheManager {
  private cache: Map<string, { value: any; expiry: number }>;

  constructor() {
    this.cache = new Map();
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(key: string, value: any, ttlSeconds: number = 3600): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    logger.debug(`Cache cleanup: ${this.cache.size} items remaining`);
  }
}

export const cache = new CacheManager();

// Helper function for cached API calls
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const result = await fetchFn();
  cache.set(key, result, ttl);
  return result;
}

export default cache;
