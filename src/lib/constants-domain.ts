// src/lib/constants-domain.ts
// Domain-specific constants used by runtime application code.

// ============================================================
// HABIT STRENGTH DECAY & BONUSES
// ============================================================

export const HABIT_DECAY_RATE = 0.90;
export const HABIT_BONUS_AMOUNT = 1.0;
export const HABIT_RESCUE_DECAY_THRESHOLD = 0.85;
export const HABIT_RESCUE_MIN_GAIN = 2.5;
export const HABIT_NEW_HABIT_INITIAL_STRENGTH = 0.15;

// Sembrar cycle length (days)
export const SEMBRAR_MAX_DAYS_PER_CYCLE = 15;

// ============================================================
// STREAKS
// ============================================================

export const STREAK_SHIELD_MAX = 2;
export const STREAK_SHIELD_AWARD_DAYS = 7;

// ============================================================
// TIME (milliseconds)
// ============================================================

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_MINUTE = 60 * 1000;

// ============================================================
// RATE LIMITS
// ============================================================

export const RATE_LIMIT_CHAT_PER_MIN = 20;
export const RATE_LIMIT_SMART_ENTRY_PER_MIN = 5;
export const RATE_LIMIT_REGISTER_PER_HOUR = 5;

// ============================================================
// VALIDATION LIMITS
// ============================================================

export const MAX_HABIT_NAME_LENGTH = 100;
export const MAX_JOURNAL_TEXT_LENGTH = 5000;
export const MAX_TRANSCRIPT_LENGTH = 10_000;
export const MAX_DAILY_HABITS = 30;

// ============================================================
// ANALYTICS WINDOWS
// ============================================================

export const ANALYTICS_DAYS_WINDOW = 30;

// ============================================================
// ROLES
// ============================================================

export const ROLE_ADMIN = 'admin' as const;
export const ROLE_USER = 'user' as const;

export const ALL_ROLES = [ROLE_ADMIN, ROLE_USER] as const;
export type Role = typeof ALL_ROLES[number];

// ============================================================
// HABIT TYPES
// ============================================================

export const HABIT_TYPE_CRECER = 'crecer' as const;
export const HABIT_TYPE_SEMBRAR = 'sembrar' as const;
export const HABIT_TYPE_CAMBIAR = 'cambiar' as const;
export const HABIT_TYPE_PILAR = 'pilar' as const;
export const HABIT_TYPE_PRECISO = 'preciso' as const;
export const HABIT_TYPE_CADENA = 'cadena' as const;

export const ALL_HABIT_TYPES = [
  HABIT_TYPE_CRECER,
  HABIT_TYPE_SEMBRAR,
  HABIT_TYPE_CAMBIAR,
  HABIT_TYPE_PILAR,
  HABIT_TYPE_PRECISO,
  HABIT_TYPE_CADENA,
] as const;

export type HabitType = typeof ALL_HABIT_TYPES[number];

// ============================================================
// DOMAINS
// ============================================================

export const DOMAIN_CUERPO = 'cuerpo' as const;
export const DOMAIN_MENTE = 'mente' as const;
export const DOMAIN_TRABAJO = 'trabajo' as const;
export const DOMAIN_RELACIONES = 'relaciones' as const;
export const DOMAIN_HOGAR = 'hogar' as const;
export const DOMAIN_ESPIRITUAL = 'espiritual' as const;
export const DOMAIN_FINANZAS = 'finanzas' as const;

export const ALL_DOMAINS = [
  DOMAIN_CUERPO,
  DOMAIN_MENTE,
  DOMAIN_TRABAJO,
  DOMAIN_RELACIONES,
  DOMAIN_HOGAR,
  DOMAIN_ESPIRITUAL,
  DOMAIN_FINANZAS,
] as const;

export type Domain = typeof ALL_DOMAINS[number];