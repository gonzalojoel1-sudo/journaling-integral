'use server';

import { db } from '../../db/db';
import { dailyEntries } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { requireCurrentUserId } from './auth';
import { logger } from '@/lib/logger';
import { HabitsDraftSchema } from '@/lib/validations';
import { todayStr } from '@/lib/dates';

export async function saveHabitsDraft(dailyHabits: unknown) {
  try {
    const v = HabitsDraftSchema.safeParse(dailyHabits);
    if (!v.success) {
      logger.warn('save_habits_draft_invalid_payload', {
        issues: v.error.issues.map((i) => i.path.join('.')),
      });
      return { success: false, error: 'Datos de hábitos inválidos' };
    }

    const userId = await requireCurrentUserId();
    const today = todayStr();

    const existing = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, today)),
    });

    const habitsJson = JSON.stringify(v.data);

    if (existing) {
      await db
        .update(dailyEntries)
        .set({ dailyHabitsJson: habitsJson })
        .where(and(eq(dailyEntries.id, existing.id), eq(dailyEntries.userId, userId)));
      return { success: true };
    }

    await db.insert(dailyEntries).values({
      id: randomUUID(),
      userId,
      date: today,
      time: new Date().toISOString(),
      levelAtEntry: 1,
      isPlanBUsed: 0,
      mitSerCompleted: 0,
      mitNegocioCompleted: 0,
      mitRelacionesCompleted: 0,
      bizProspectCompleted: 0,
      bizFollowUpCompleted: 0,
      bizMktActionCompleted: 0,
      bizContactsCount: 0,
      bizSalesCount: 0,
      bizIncome: 0.0,
      bizExpenses: 0.0,
      dominantFocusCompleted: 0,
      dailyHabitsJson: habitsJson,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    logger.error('save_habits_draft_failed', {}, error);
    return { success: false, error: 'Error al guardar el borrador de hábitos' };
  }
}