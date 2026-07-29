'use server';

import { z } from 'zod';
import { db } from '../../db/db';
import { dailyEntries, habits } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireCurrentUserId } from './auth';
import { logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/json';
import { todayStr } from '@/lib/dates';

const ToggleKindSchema = z.enum(['habit', 'mitSer', 'mitNegocio', 'mitRelaciones']);

const ToggleHabitSchema = z.object({
  kind: ToggleKindSchema,
  habitId: z.string().min(1).max(100).optional(),
  completed: z.boolean(),
});

type ToggleHabitInput = z.infer<typeof ToggleHabitSchema>;

interface DailyHabitEntry {
  habitId: string;
  name?: string;
  habitType?: string;
  completed?: boolean;
}

function readHabitsJson(json: string | null): DailyHabitEntry[] {
  return safeJsonParse<DailyHabitEntry[]>(json, []);
}

function buildEntryHabits(existing: DailyHabitEntry[], habitId: string, completed: boolean): DailyHabitEntry[] {
  const has = existing.some((h) => h.habitId === habitId);
  if (has) {
    return existing.map((h) => (h.habitId === habitId ? { ...h, completed } : h));
  }
  return [...existing, { habitId, completed }];
}

export async function toggleHabitCompleted(input: ToggleHabitInput) {
  const parsed = ToggleHabitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }

  if (parsed.data.kind === 'habit' && !parsed.data.habitId) {
    return { success: false, error: 'habitId requerido' };
  }

  try {
    const userId = await requireCurrentUserId();
    const today = todayStr();

    if (parsed.data.kind === 'habit') {
      const habitId = parsed.data.habitId as string;

      const habit = await db.query.habits.findFirst({
        where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
      });
      if (!habit) {
        return { success: false, error: 'Hábito no encontrado' };
      }

      const existing = await db.query.dailyEntries.findFirst({
        where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, today)),
      });

      const habitsArr = buildEntryHabits(
        readHabitsJson(existing?.dailyHabitsJson ?? null),
        habitId,
        parsed.data.completed,
      );
      const habitsJson = JSON.stringify(habitsArr);

      if (!existing) {
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
      } else {
        await db
          .update(dailyEntries)
          .set({ dailyHabitsJson: habitsJson })
          .where(and(eq(dailyEntries.id, existing.id), eq(dailyEntries.userId, userId)));
      }

      revalidatePath('/');
      return { success: true };
    }

    const fieldMap: Record<z.infer<typeof ToggleKindSchema>, string> = {
      habit: 'dailyHabitsJson',
      mitSer: 'mitSerCompleted',
      mitNegocio: 'mitNegocioCompleted',
      mitRelaciones: 'mitRelacionesCompleted',
    };
    const field = fieldMap[parsed.data.kind];
    const value = parsed.data.completed ? 1 : 0;

    const existing = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, today)),
    });

    if (!existing) {
      await db.insert(dailyEntries).values({
        id: randomUUID(),
        userId,
        date: today,
        time: new Date().toISOString(),
        levelAtEntry: 1,
        isPlanBUsed: 0,
        mitSerCompleted: field === 'mitSerCompleted' ? value : 0,
        mitNegocioCompleted: field === 'mitNegocioCompleted' ? value : 0,
        mitRelacionesCompleted: field === 'mitRelacionesCompleted' ? value : 0,
        bizProspectCompleted: 0,
        bizFollowUpCompleted: 0,
        bizMktActionCompleted: 0,
        bizContactsCount: 0,
        bizSalesCount: 0,
        bizIncome: 0.0,
        bizExpenses: 0.0,
        dominantFocusCompleted: 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      await db
        .update(dailyEntries)
        .set({ [field]: value })
        .where(and(eq(dailyEntries.id, existing.id), eq(dailyEntries.userId, userId)));
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error('toggle_habit_failed', {}, error);
    return { success: false, error: 'Error al alternar hábito' };
  }
}
