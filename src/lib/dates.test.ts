import { describe, it, expect, vi } from 'vitest';
import { todayStr, yesterdayStr, formatDateKey, addDays } from './dates';

describe('todayStr', () => {
  it('returns YYYY-MM-DD using local time', () => {
    const real = new Date(2026, 6, 15, 9, 5, 0);
    vi.useFakeTimers();
    vi.setSystemTime(real);
    try {
      expect(todayStr()).toBe('2026-07-15');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not suffer UTC drift when local date is different', () => {
    // 2026-07-15 23:30 local in UTC-8 = 2026-07-16 07:30 UTC.
    // Must still report local date.
    const real = new Date(2026, 6, 15, 23, 30, 0);
    vi.useFakeTimers();
    vi.setSystemTime(real);
    try {
      expect(todayStr()).toBe('2026-07-15');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('yesterdayStr', () => {
  it('returns the calendar day before today', () => {
    const real = new Date(2026, 6, 15, 12, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(real);
    try {
      expect(yesterdayStr()).toBe('2026-07-14');
    } finally {
      vi.useRealTimers();
    }
  });

  it('crosses month boundaries correctly', () => {
    const real = new Date(2026, 7, 1, 9, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(real);
    try {
      expect(yesterdayStr()).toBe('2026-07-31');
    } finally {
      vi.useRealTimers();
    }
  });

  it('crosses year boundaries correctly', () => {
    const real = new Date(2026, 0, 1, 9, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(real);
    try {
      expect(yesterdayStr()).toBe('2025-12-31');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('formatDateKey', () => {
  it('formats a Date to YYYY-MM-DD using local components', () => {
    const date = new Date(2026, 6, 9, 23, 59, 0);
    expect(formatDateKey(date)).toBe('2026-07-09');
  });

  it('zero-pads single-digit months and days', () => {
    const date = new Date(2026, 0, 3, 12, 0, 0);
    expect(formatDateKey(date)).toBe('2026-01-03');
  });
});

describe('addDays', () => {
  it('adds positive days to a date key', () => {
    expect(addDays('2026-07-15', 5)).toBe('2026-07-20');
  });

  it('subtracts days when given a negative number', () => {
    expect(addDays('2026-07-15', -1)).toBe('2026-07-14');
  });

  it('crosses month boundaries forward', () => {
    expect(addDays('2026-07-30', 5)).toBe('2026-08-04');
  });

  it('crosses year boundaries backward', () => {
    expect(addDays('2026-01-02', -3)).toBe('2025-12-30');
  });

  it('returns the same date when adding 0 days', () => {
    expect(addDays('2026-07-15', 0)).toBe('2026-07-15');
  });
});
