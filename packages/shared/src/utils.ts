export function calculateStreak(
  lastEntryDate: string | null,
  currentStreak: number,
  todayStr: string,
): number {
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastEntryDate === yesterdayStr) {
    return currentStreak + 1;
  }
  if (lastEntryDate !== todayStr) {
    return 1;
  }
  return currentStreak;
}

export function checkLevelProgression(currentLevel: number, activeDaysCount: number): number {
  if (currentLevel === 1 && activeDaysCount >= 18) return 2;
  if (currentLevel === 2 && activeDaysCount >= 25) return 3;
  return currentLevel;
}

export function getISOWeekLabel(date: Date = new Date()): string {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((tempDate.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return tempDate.getFullYear().toString() + '-W' + weekNum.toString();
}
