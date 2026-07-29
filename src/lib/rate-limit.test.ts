import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/db', () => ({
  db: {
    delete: vi.fn(),
  },
}));

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { db } from '../db/db';
import { rateLimits } from '../db/schema';
import { cleanupRateLimits } from './rate-limit';

const mockedDb = vi.mocked(db);

describe('cleanupRateLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a number on successful cleanup', async () => {
    const mockChain = {
      where: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ rowsAffected: 5 }),
    };
    mockedDb.delete.mockReturnValue(mockChain as any);

    const result = await cleanupRateLimits();

    expect(typeof result).toBe('number');
    expect(result).toBe(5);
    expect(mockedDb.delete).toHaveBeenCalledWith(rateLimits);
    expect(mockChain.where).toHaveBeenCalledTimes(1);
    expect(mockChain.run).toHaveBeenCalledTimes(1);
  });

  it('returns 0 when no rows to clean', async () => {
    const mockChain = {
      where: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
    };
    mockedDb.delete.mockReturnValue(mockChain as any);

    const result = await cleanupRateLimits();

    expect(result).toBe(0);
  });

  it('returns 0 and logs error on DB failure without throwing', async () => {
    const mockChain = {
      where: vi.fn().mockReturnThis(),
      run: vi.fn().mockRejectedValue(new Error('db down')),
    };
    mockedDb.delete.mockReturnValue(mockChain as any);

    const result = await cleanupRateLimits();

    expect(result).toBe(0);
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('returns 0 when db is undefined (no DB configured)', async () => {
    mockedDb.delete.mockReturnValue(undefined as any);

    const result = await cleanupRateLimits();

    expect(result).toBe(0);
  });
});