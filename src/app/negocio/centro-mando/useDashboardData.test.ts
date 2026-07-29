import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { rangeStart, formatCurrency, FILTERS, SETTINGS_EMPTY_STATE } from './useDashboardData';

describe('useDashboardData pure helpers', () => {
  describe('formatCurrency', () => {
    it('formats small numbers using es-MX locale without decimals', () => {
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(999)).toBe('$999');
    });

    it('formats thousands with the k suffix and one decimal', () => {
      expect(formatCurrency(1000)).toBe('$1.0k');
      expect(formatCurrency(12345)).toBe('$12.3k');
    });
  });

  describe('rangeStart', () => {
    const today = new Date('2026-07-29T15:30:00Z');

    it('returns the start of today for FilterPeriod "today"', () => {
      const result = rangeStart('today', today);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('subtracts 7 days for FilterPeriod "week"', () => {
      const result = rangeStart('week', today);
      const expected = new Date(today);
      expected.setHours(0, 0, 0, 0);
      expected.setDate(expected.getDate() - 7);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('subtracts 30 days for FilterPeriod "month"', () => {
      const result = rangeStart('month', today);
      const expected = new Date(today);
      expected.setHours(0, 0, 0, 0);
      expected.setDate(expected.getDate() - 30);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('subtracts 183 days for FilterPeriod "sixMonths"', () => {
      const result = rangeStart('sixMonths', today);
      const expected = new Date(today);
      expected.setHours(0, 0, 0, 0);
      expected.setDate(expected.getDate() - 183);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('returns the start of today for FilterPeriod "all" (used by caller)', () => {
      const result = rangeStart('all', today);
      const expected = new Date(today);
      expected.setHours(0, 0, 0, 0);
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('FILTERS constant', () => {
    it('exposes all five filter periods in display order', () => {
      expect(FILTERS.map((f) => f.key)).toEqual([
        'today',
        'week',
        'month',
        'sixMonths',
        'all',
      ]);
    });

    it('each filter has a non-empty Spanish label', () => {
      for (const f of FILTERS) {
        expect(typeof f.label).toBe('string');
        expect(f.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('SETTINGS_EMPTY_STATE default filter', () => {
    it('defaults to sixMonths for the empty-state experience', () => {
      expect(SETTINGS_EMPTY_STATE).toBe('sixMonths');
    });
  });
});
