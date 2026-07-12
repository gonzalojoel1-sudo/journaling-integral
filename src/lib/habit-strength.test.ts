import { describe, it, expect } from 'vitest';
import { applyDecayAndBonus, getRealTimeStrength } from './habit-strength';

const DECAY_RATE = 0.90;

describe('applyDecayAndBonus', () => {
  it('should add +1.0 when completed today (no previous strength)', () => {
    const result = applyDecayAndBonus(0, null, '2026-07-11', true);
    expect(result.newStrength).toBe(1.0);
    expect(result.newDate).toBe('2026-07-11');
  });

  it('should return 0 when not completed and no previous strength', () => {
    const result = applyDecayAndBonus(0, null, '2026-07-11', false);
    expect(result.newStrength).toBe(0);
    expect(result.newDate).toBe('2026-07-11');
  });

  it('should apply decay for 1 day skipped', () => {
    // Previous strength: 5.0, last date: yesterday, today: completed
    // Decay: 5.0 * 0.90^1 = 4.5
    // Bonus: 4.5 + 1.0 = 5.5
    const result = applyDecayAndBonus(5.0, '2026-07-10', '2026-07-11', true);
    expect(result.newStrength).toBe(5.5);
  });

  it('should apply decay for 2 days skipped', () => {
    // Previous strength: 5.0, last date: 2 days ago
    // Decay: 5.0 * 0.90^2 = 5.0 * 0.81 = 4.05
    // Bonus: 4.05 + 1.0 = 5.05
    const result = applyDecayAndBonus(5.0, '2026-07-09', '2026-07-11', true);
    expect(result.newStrength).toBe(5.05);
  });

  it('should apply decay for 7 days skipped (one week)', () => {
    // Previous strength: 10.0, last date: 7 days ago
    // Decay: 10.0 * 0.90^7 = 10.0 * 0.4782969 = 4.782969
    // Bonus: 4.782969 + 1.0 = 5.782969
    // Rounded: 5.78
    const result = applyDecayAndBonus(10.0, '2026-07-04', '2026-07-11', true);
    expect(result.newStrength).toBe(5.78);
  });

  it('should not add bonus when not completed today', () => {
    // Previous strength: 5.0, last date: yesterday, not completed
    // Decay: 5.0 * 0.90^1 = 4.5
    const result = applyDecayAndBonus(5.0, '2026-07-10', '2026-07-11', false);
    expect(result.newStrength).toBe(4.5);
  });

  it('should handle same day (no decay)', () => {
    // Previous strength: 3.0, last date: today, completed
    // Decay: 3.0 * 0.90^0 = 3.0
    // Bonus: 3.0 + 1.0 = 4.0
    const result = applyDecayAndBonus(3.0, '2026-07-11', '2026-07-11', true);
    expect(result.newStrength).toBe(4.0);
  });

  it('should handle same day (not completed)', () => {
    // Previous strength: 3.0, last date: today, not completed
    // Decay: 3.0 * 0.90^0 = 3.0
    const result = applyDecayAndBonus(3.0, '2026-07-11', '2026-07-11', false);
    expect(result.newStrength).toBe(3.0);
  });

  it('should round to 2 decimal places', () => {
    // Previous strength: 1.0, last date: 3 days ago
    // Decay: 1.0 * 0.90^3 = 0.729
    // Bonus: 0.729 + 1.0 = 1.729
    // Rounded: 1.73
    const result = applyDecayAndBonus(1.0, '2026-07-08', '2026-07-11', true);
    expect(result.newStrength).toBe(1.73);
  });

  it('should handle large strength values', () => {
    // Previous strength: 100.0, last date: yesterday, completed
    // Decay: 100.0 * 0.90^1 = 90.0
    // Bonus: 90.0 + 1.0 = 91.0
    const result = applyDecayAndBonus(100.0, '2026-07-10', '2026-07-11', true);
    expect(result.newStrength).toBe(91.0);
  });

  it('should handle consecutive completions building strength', () => {
    // Day 1: complete → strength = 1.0
    let result = applyDecayAndBonus(0, null, '2026-07-01', true);
    expect(result.newStrength).toBe(1.0);

    // Day 2: complete → strength = 1.0 * 0.90^1 + 1.0 = 1.9
    result = applyDecayAndBonus(result.newStrength, '2026-07-01', '2026-07-02', true);
    expect(result.newStrength).toBe(1.9);

    // Day 3: complete → strength = 1.9 * 0.90^1 + 1.0 = 2.71
    result = applyDecayAndBonus(result.newStrength, '2026-07-02', '2026-07-03', true);
    expect(result.newStrength).toBe(2.71);

    // Day 4: skip → strength = 2.71 * 0.90^1 = 2.439 → 2.44
    result = applyDecayAndBonus(result.newStrength, '2026-07-03', '2026-07-04', false);
    expect(result.newStrength).toBe(2.44);

    // Day 5: complete → strength = 2.44 * 0.90^1 + 1.0 = 3.196 → 3.2
    result = applyDecayAndBonus(result.newStrength, '2026-07-04', '2026-07-05', true);
    expect(result.newStrength).toBe(3.2);
  });
});

describe('getRealTimeStrength', () => {
  it('should return current strength if no lastStrengthDate', () => {
    const result = getRealTimeStrength(5.0, null);
    expect(result).toBe(5.0);
  });

  it('should return current strength if lastStrengthDate is today', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = getRealTimeStrength(5.0, today);
    expect(result).toBe(5.0);
  });

  it('should apply decay for past dates', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const result = getRealTimeStrength(10.0, yesterday);
    // 10.0 * 0.90^1 = 9.0
    expect(result).toBe(9.0);
  });

  it('should apply decay for 3 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const result = getRealTimeStrength(10.0, threeDaysAgo);
    // 10.0 * 0.90^3 = 7.29
    expect(result).toBe(7.29);
  });

  it('should round to 2 decimal places', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const result = getRealTimeStrength(1.0, yesterday);
    // 1.0 * 0.90^1 = 0.9
    expect(result).toBe(0.9);
  });
});
