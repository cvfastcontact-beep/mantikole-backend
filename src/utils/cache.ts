/**
 * Zero-Dependency In-Memory TTL Cache (Ponytail & Clean Code)
 * Provides ultra-fast in-memory caching (<1ms) for high-traffic read operations
 * with automatic time-to-live and key/pattern invalidation.
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Retrieve item from cache if not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store item with TTL in seconds (default 60 seconds).
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete specific key or wildcard pattern (e.g. 'articles:*').
   */
  del(keyOrPattern: string): void {
    if (keyOrPattern.endsWith('*')) {
      const prefix = keyOrPattern.slice(0, -1);
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      }
    } else {
      this.store.delete(keyOrPattern);
    }
  }

  /**
   * Clear all cache.
   */
  clear(): void {
    this.store.clear();
  }
}

export const appCache = new MemoryCache();
