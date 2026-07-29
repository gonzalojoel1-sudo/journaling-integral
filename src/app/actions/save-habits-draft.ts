'use server';

import { db } from '../../db/db';
import { dailyEntries } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from './auth';
import { logger } from '@/lib/logger';

export async function saveHabitsDraft(dailyHabits: unknown[]) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false };

    const todayStr = new Date().toISOString().split('T')[0];

    const existing = await db.query.dailyEntries.findFirst({
      where: eq(dailyEntries.date, todayStr),
    });

    if (existing) {
      await db.update(dailyEntries)
        .set({ dailyHabitsJson: JSON.stringify(dailyHabits) })
        .where(eq(dailyEntries.id, existing.id));
    } else {
      await db.insert(dailyEntries).values({
        id: crypto.randomUUID(),
        userId,
        date: todayStr,
        time: new Date().toISOString(),
        levelAtEntry: 1,
        isPlanBUsed: 0,
        dailyHabitsJson: JSON.stringify(dailyHabits),
      } as typeof dailyEntries.$inferInsert);
    }

    return { success: true };
  } catch (error) {
    logger.error('save_habits_draft_failed', {}, error);
    return { success: false, error: 'Error al guardar el borrador de hábitos' };
  }
}