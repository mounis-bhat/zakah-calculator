interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const KEY_PREFIX = "zakah_cache_";

export const PRICE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export function getCached<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > maxAgeMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}
