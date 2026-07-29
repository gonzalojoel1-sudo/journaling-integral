import { describe, it, expect } from 'vitest';
import {
  HABIT_DECAY_RATE,
  HABIT_BONUS_AMOUNT,
  HABIT_RESCUE_DECAY_THRESHOLD,
  HABIT_RESCUE_MIN_GAIN,
  HABIT_NEW_HABIT_INITIAL_STRENGTH,
  SEMBRAR_MAX_DAYS_PER_CYCLE,
  STREAK_SHIELD_MAX,
  STREAK_SHIELD_AWARD_DAYS,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  RATE_LIMIT_CHAT_PER_MIN,
  RATE_LIMIT_SMART_ENTRY_PER_MIN,
  RATE_LIMIT_REGISTER_PER_HOUR,
  MAX_HABIT_NAME_LENGTH,
  MAX_JOURNAL_TEXT_LENGTH,
  MAX_TRANSCRIPT_LENGTH,
  MAX_DAILY_HABITS,
  ANALYTICS_DAYS_WINDOW,
  ROLE_ADMIN,
  ROLE_USER,
  ALL_ROLES,
  HABIT_TYPE_CRECER,
  HABIT_TYPE_SEMBRAR,
  HABIT_TYPE_CAMBIAR,
  HABIT_TYPE_PILAR,
  HABIT_TYPE_PRECISO,
  HABIT_TYPE_CADENA,
  ALL_HABIT_TYPES,
  DOMAIN_CUERPO,
  DOMAIN_MENTE,
  DOMAIN_TRABAJO,
  DOMAIN_RELACIONES,
  DOMAIN_HOGAR,
  DOMAIN_ESPIRITUAL,
  DOMAIN_FINANZAS,
  ALL_DOMAINS,
} from './constants-domain';

describe('HABIT_DECAY_RATE', () => {
  it('should be less than 1 (decay reduces strength)', () => {
    expect(HABIT_DECAY_RATE).toBeLessThan(1);
  });

  it('should be greater than 0.5 (slow decay, not catastrophic)', () => {
    expect(HABIT_DECAY_RATE).toBeGreaterThan(0.5);
  });
});

describe('HABIT_BONUS_AMOUNT', () => {
  it('should be positive', () => {
    expect(HABIT_BONUS_AMOUNT).toBeGreaterThan(0);
  });
});

describe('HABIT_RESCUE_DECAY_THRESHOLD', () => {
  it('should be in (0, 1) range', () => {
    expect(HABIT_RESCUE_DECAY_THRESHOLD).toBeGreaterThan(0);
    expect(HABIT_RESCUE_DECAY_THRESHOLD).toBeLessThan(1);
  });
});

describe('HABIT_RESCUE_MIN_GAIN', () => {
  it('should be positive (a real gain threshold)', () => {
    expect(HABIT_RESCUE_MIN_GAIN).toBeGreaterThan(0);
  });
});

describe('HABIT_NEW_HABIT_INITIAL_STRENGTH', () => {
  it('should be between 0 and 1 (initial seed)', () => {
    expect(HABIT_NEW_HABIT_INITIAL_STRENGTH).toBeGreaterThanOrEqual(0);
    expect(HABIT_NEW_HABIT_INITIAL_STRENGTH).toBeLessThan(1);
  });
});

describe('SEMBRAR_MAX_DAYS_PER_CYCLE', () => {
  it('should be a positive integer', () => {
    expect(SEMBRAR_MAX_DAYS_PER_CYCLE).toBeGreaterThan(0);
    expect(Number.isInteger(SEMBRAR_MAX_DAYS_PER_CYCLE)).toBe(true);
  });
});

describe('STREAK constants', () => {
  it('STREAK_SHIELD_MAX should be a small positive integer', () => {
    expect(STREAK_SHIELD_MAX).toBeGreaterThan(0);
    expect(Number.isInteger(STREAK_SHIELD_MAX)).toBe(true);
    expect(STREAK_SHIELD_MAX).toBeLessThanOrEqual(10);
  });

  it('STREAK_SHIELD_AWARD_DAYS should be a positive integer', () => {
    expect(STREAK_SHIELD_AWARD_DAYS).toBeGreaterThan(0);
    expect(Number.isInteger(STREAK_SHIELD_AWARD_DAYS)).toBe(true);
  });
});

describe('Time constants', () => {
  it('MS_PER_MINUTE should be 60,000', () => {
    expect(MS_PER_MINUTE).toBe(60_000);
  });

  it('MS_PER_HOUR should be 60 minutes', () => {
    expect(MS_PER_HOUR).toBe(MS_PER_MINUTE * 60);
  });

  it('MS_PER_DAY should be 24 hours', () => {
    expect(MS_PER_DAY).toBe(MS_PER_HOUR * 24);
  });
});

describe('Rate limits', () => {
  it('all rate limits should be positive integers', () => {
    expect(RATE_LIMIT_CHAT_PER_MIN).toBeGreaterThan(0);
    expect(RATE_LIMIT_SMART_ENTRY_PER_MIN).toBeGreaterThan(0);
    expect(RATE_LIMIT_REGISTER_PER_HOUR).toBeGreaterThan(0);
    expect(Number.isInteger(RATE_LIMIT_CHAT_PER_MIN)).toBe(true);
    expect(Number.isInteger(RATE_LIMIT_SMART_ENTRY_PER_MIN)).toBe(true);
    expect(Number.isInteger(RATE_LIMIT_REGISTER_PER_HOUR)).toBe(true);
  });
});

describe('Validation limits', () => {
  it('all length limits should be positive integers', () => {
    expect(MAX_HABIT_NAME_LENGTH).toBeGreaterThan(0);
    expect(MAX_JOURNAL_TEXT_LENGTH).toBeGreaterThan(0);
    expect(MAX_TRANSCRIPT_LENGTH).toBeGreaterThan(0);
    expect(MAX_DAILY_HABITS).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_HABIT_NAME_LENGTH)).toBe(true);
    expect(Number.isInteger(MAX_JOURNAL_TEXT_LENGTH)).toBe(true);
    expect(Number.isInteger(MAX_TRANSCRIPT_LENGTH)).toBe(true);
    expect(Number.isInteger(MAX_DAILY_HABITS)).toBe(true);
  });
});

describe('Analytics window', () => {
  it('ANALYTICS_DAYS_WINDOW should be a positive integer', () => {
    expect(ANALYTICS_DAYS_WINDOW).toBeGreaterThan(0);
    expect(Number.isInteger(ANALYTICS_DAYS_WINDOW)).toBe(true);
  });
});

describe('Role constants', () => {
  it('ROLE_ADMIN should be "admin"', () => {
    expect(ROLE_ADMIN).toBe('admin');
  });

  it('ROLE_USER should be "user"', () => {
    expect(ROLE_USER).toBe('user');
  });

  it('ALL_ROLES should contain both roles', () => {
    expect(ALL_ROLES).toContain(ROLE_ADMIN);
    expect(ALL_ROLES).toContain(ROLE_USER);
    expect(ALL_ROLES.length).toBe(2);
  });
});

describe('Habit type constants', () => {
  it('should expose all 6 habit types', () => {
    expect(HABIT_TYPE_CRECER).toBe('crecer');
    expect(HABIT_TYPE_SEMBRAR).toBe('sembrar');
    expect(HABIT_TYPE_CAMBIAR).toBe('cambiar');
    expect(HABIT_TYPE_PILAR).toBe('pilar');
    expect(HABIT_TYPE_PRECISO).toBe('preciso');
    expect(HABIT_TYPE_CADENA).toBe('cadena');
  });

  it('ALL_HABIT_TYPES should contain all 6 types without duplicates', () => {
    expect(ALL_HABIT_TYPES.length).toBe(6);
    expect(new Set(ALL_HABIT_TYPES).size).toBe(ALL_HABIT_TYPES.length);
  });
});

describe('Domain constants', () => {
  it('should expose all 7 domains', () => {
    expect(DOMAIN_CUERPO).toBe('cuerpo');
    expect(DOMAIN_MENTE).toBe('mente');
    expect(DOMAIN_TRABAJO).toBe('trabajo');
    expect(DOMAIN_RELACIONES).toBe('relaciones');
    expect(DOMAIN_HOGAR).toBe('hogar');
    expect(DOMAIN_ESPIRITUAL).toBe('espiritual');
    expect(DOMAIN_FINANZAS).toBe('finanzas');
  });

  it('ALL_DOMAINS should contain all 7 domains without duplicates', () => {
    expect(ALL_DOMAINS.length).toBe(7);
    expect(new Set(ALL_DOMAINS).size).toBe(ALL_DOMAINS.length);
  });
});