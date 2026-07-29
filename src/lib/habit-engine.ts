import { db } from '../db/db';
import { habits } from '../db/schema';
import { eq } from 'drizzle-orm';
import { applyDecayAndBonus } from './habit-strength';

interface HabitEntry {
  habitId: string;
  completed?: boolean;
  temptationAppeared?: boolean;
}

interface PilarState {
  id: string;
  domain: string | null;
  currentStrength: number;
  lastStrengthDate: string | null;
}

export async function processDailyHabits(
  userId: string,
  dailyHabits: HabitEntry[],
  todayStr: string,
): Promise<void> {
  if (!dailyHabits || !Array.isArray(dailyHabits) || dailyHabits.length === 0) {
    return;
  }

  const habitIds = dailyHabits.map((h) => h.habitId).filter(Boolean);
  if (habitIds.length === 0) return;

  const habitRecords = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
  });

  const habitMap = new Map(habitRecords.map((h) => [h.id, h]));

  const pilarHabits: PilarState[] = [];
  let totalNonPilarToComplete = 0;
  let completedNonPilar = 0;

  for (const habitEntry of dailyHabits) {
    if (!habitEntry.habitId) continue;

    const habitRecord = habitMap.get(habitEntry.habitId);
    if (!habitRecord) continue;

    if (habitRecord.habitType === 'pilar') {
      pilarHabits.push({
        id: habitRecord.id,
        domain: habitRecord.domain,
        currentStrength: habitRecord.currentStrength ?? 0,
        lastStrengthDate: habitRecord.lastStrengthDate,
      });
      continue;
    }

    totalNonPilarToComplete++;
    if (habitEntry.completed === true) completedNonPilar++;

    await processNonPilarHabit(habitRecord, habitEntry, todayStr);
  }

  if (pilarHabits.length > 0) {
    const allNonPilarCompleted =
      totalNonPilarToComplete > 0 && totalNonPilarToComplete === completedNonPilar;

    for (const pilar of pilarHabits) {
      const { newStrength, newDate } = applyDecayAndBonus(
        pilar.currentStrength,
        pilar.lastStrengthDate,
        todayStr,
        allNonPilarCompleted,
      );

      await db
        .update(habits)
        .set({
          currentStrength: newStrength,
          lastStrengthDate: newDate,
          pilarCompleted: allNonPilarCompleted ? 1 : 0,
        })
        .where(eq(habits.id, pilar.id));
    }
  }
}

async function processNonPilarHabit(
  habit: any,
  entry: HabitEntry,
  todayStr: string,
): Promise<void> {
  if (habit.habitType === 'preciso') {
    if (entry.completed === true) {
      await db
        .update(habits)
        .set({
          triggerHitCount: (habit.triggerHitCount ?? 0) + 1,
          actionExecutedCount: (habit.actionExecutedCount ?? 0) + 1,
        })
        .where(eq(habits.id, habit.id));
    }
    if (!entry.completed) return;
  }

  const { newStrength, newDate } = applyDecayAndBonus(
    habit.currentStrength ?? 0,
    habit.lastStrengthDate,
    todayStr,
    entry.completed === true,
  );

  await db
    .update(habits)
    .set({
      currentStrength: newStrength,
      lastStrengthDate: newDate,
    })
    .where(eq(habits.id, habit.id));

  if (habit.habitType === 'sembrar') {
    const currentDays = habit.daysInCurrentCycle ?? 0;
    if (entry.completed === true && currentDays < 15) {
      await db
        .update(habits)
        .set({ daysInCurrentCycle: currentDays + 1 })
        .where(eq(habits.id, habit.id));
    }
  }

  if (
    !entry.completed &&
    habit.rescueAction &&
    habit.activeAction !== habit.rescueAction &&
    newStrength < (habit.currentStrength ?? 0) * 0.85
  ) {
    await db
      .update(habits)
      .set({ activeAction: habit.rescueAction })
      .where(eq(habits.id, habit.id));
  }

  if (
    entry.completed === true &&
    habit.rescueAction &&
    habit.rescueAction !== habit.activeAction
  ) {
    if (newStrength >= (habit.currentStrength ?? 0) + 2.5) {
      await db
        .update(habits)
        .set({ activeAction: habit.rescueAction })
        .where(eq(habits.id, habit.id));
    }
  }

  if (habit.habitType === 'crecer') {
    const currentStreak = habit.currentStreak ?? 0;
    const currentShields = habit.streakShields ?? 0;

    if (entry.completed === true) {
      const newStreak = currentStreak + 1;
      const newShields = Math.min(currentShields + (newStreak % 7 === 0 ? 1 : 0), 2);
      await db
        .update(habits)
        .set({ currentStreak: newStreak, streakShields: newShields })
        .where(eq(habits.id, habit.id));
    } else if (currentShields > 0) {
      await db
        .update(habits)
        .set({ streakShields: currentShields - 1 })
        .where(eq(habits.id, habit.id));
    } else {
      await db
        .update(habits)
        .set({ currentStreak: 0 })
        .where(eq(habits.id, habit.id));
    }
  }

  if (habit.habitType === 'cambiar') {
    if (entry.completed === true) {
      await db
        .update(habits)
        .set({ victoryCount: (habit.victoryCount ?? 0) + 1 })
        .where(eq(habits.id, habit.id));
    }
    if (entry.temptationAppeared && !entry.completed) {
      await db
        .update(habits)
        .set({ temptationCount: (habit.temptationCount ?? 0) + 1 })
        .where(eq(habits.id, habit.id));
    }
  }
}
