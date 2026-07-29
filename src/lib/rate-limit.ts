import { db } from '../db/db';
import { rateLimits } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

export async function rateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): Promise<{ success: boolean; remaining: number; resetMs: number }> {
  const now = Date.now();
  try {
    const existing = await db
      ?.select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .get();
    if (!existing || now > existing.windowStart + windowMs) {
      await db?.insert(rateLimits)
        .values({ key, count: 1, windowStart: now, updatedAt: new Date().toISOString() })
        .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, windowStart: now, updatedAt: new Date().toISOString() } })
        .run();
      return { success: true, remaining: limit - 1, resetMs: windowMs };
    }
    if (existing.count >= limit) {
      const resetMs = (existing.windowStart + windowMs) - now;
      return { success: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }
    await db?.update(rateLimits)
      .set({ count: existing.count + 1, updatedAt: new Date().toISOString() })
      .where(eq(rateLimits.key, key))
      .run();
    const resetMs = (existing.windowStart + windowMs) - now;
    return { success: true, remaining: limit - (existing.count + 1), resetMs: Math.max(0, resetMs) };
  } catch (error) {
    logger.error('rate_limit_db_error', { key }, error);
    return { success: true, remaining: limit, resetMs: windowMs };
  }
}

export async function getRateLimitInfo(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): Promise<{ count: number; remaining: number; resetMs: number }> {
  const now = Date.now();
  try {
    const existing = await db
      ?.select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .get();
    if (!existing || now > existing.windowStart + windowMs) {
      return { count: 0, remaining: limit, resetMs: windowMs };
    }
    const resetMs = (existing.windowStart + windowMs) - now;
    return {
      count: existing.count,
      remaining: Math.max(0, limit - existing.count),
      resetMs: Math.max(0, resetMs),
    };
  } catch {
    return { count: 0, remaining: limit, resetMs: windowMs };
  }
}

export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return userId;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
