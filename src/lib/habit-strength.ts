import { todayStr } from './dates';
import { HABIT_DECAY_RATE, HABIT_BONUS_AMOUNT, STREAK_SHIELD_MAX, STREAK_SHIELD_AWARD_DAYS, MS_PER_DAY } from './constants-domain';

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY));
}

export function applyDecayAndBonus(
  currentStrength: number,
  lastStrengthDate: string | null,
  todayStr: string,
  completedToday: boolean,
): { newStrength: number; newDate: string } {
  let daysSince = 0;

  if (lastStrengthDate) {
    daysSince = daysBetween(lastStrengthDate, todayStr);
  }

  let strength = currentStrength * Math.pow(HABIT_DECAY_RATE, daysSince);

  if (completedToday) {
    strength += HABIT_BONUS_AMOUNT;
  }

  return {
    newStrength: Math.round(strength * 100) / 100,
    newDate: todayStr,
  };
}

export function getRealTimeStrength(
  currentStrength: number,
  lastStrengthDate: string | null,
): number {
  if (!lastStrengthDate) return currentStrength;

  const today = todayStr();
  const daysSince = daysBetween(lastStrengthDate, today);

  if (daysSince <= 0) return currentStrength;

  const strength = currentStrength * Math.pow(HABIT_DECAY_RATE, daysSince);
  return Math.round(strength * 100) / 100;
}

export function applyStreakShield(
  currentStreak: number,
  currentShields: number,
  completedToday: boolean,
): { newStreak: number; newShields: number } {
  if (completedToday) {
    const newStreak = currentStreak + 1;
    const newShields = Math.min(
      currentShields + (newStreak % STREAK_SHIELD_AWARD_DAYS === 0 ? 1 : 0),
      STREAK_SHIELD_MAX,
    );
    return { newStreak, newShields };
  }

  if (currentShields > 0) {
    return { newStreak: currentStreak, newShields: currentShields - 1 };
  }

  return { newStreak: 0, newShields: 0 };
}