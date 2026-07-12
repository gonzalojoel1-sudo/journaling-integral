/**
 * In-memory LRU Rate Limiter
 *
 * Suitable for single-server deployments (SQLite local).
 * For serverless/distributed deployments, migrate to @upstash/ratelimit.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Check and increment rate limit for a given key.
 *
 * @param key - Unique identifier (e.g., "chat:user123" or "smart-entry:192.168.1.1")
 * @param limit - Max requests allowed in the window (default: 20)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 min)
 * @returns { success, remaining, resetMs }
 */
export function rateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): { success: boolean; remaining: number; resetMs: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired
  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetMs: windowMs };
  }

  // Within window, check limit
  if (entry.count >= limit) {
    const resetMs = entry.resetTime - now;
    return { success: false, remaining: 0, resetMs };
  }

  entry.count++;
  const resetMs = entry.resetTime - now;
  return { success: true, remaining: limit - entry.count, resetMs };
}

/**
 * Get rate limit info without incrementing (for headers).
 */
export function getRateLimitInfo(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): { count: number; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    return { count: 0, remaining: limit, resetMs: windowMs };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetMs: entry.resetTime - now,
  };
}

/**
 * Extract client identifier from request.
 * Priority: userId from cookie > x-forwarded-for IP > 127.0.0.1
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return userId;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return '127.0.0.1';
}
