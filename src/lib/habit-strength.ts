const DECAY_RATE = 0.90;

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
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

  let strength = currentStrength * Math.pow(DECAY_RATE, daysSince);

  if (completedToday) {
    strength += 1.0;
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

  const todayStr = new Date().toISOString().split('T')[0];
  const daysSince = daysBetween(lastStrengthDate, todayStr);

  if (daysSince <= 0) return currentStrength;

  const strength = currentStrength * Math.pow(DECAY_RATE, daysSince);
  return Math.round(strength * 100) / 100;
}
