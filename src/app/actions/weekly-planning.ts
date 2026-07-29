'use server';

import { db } from '../../db/db';
import { weeklyPlans } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireCurrentUserId } from './auth';
import { validate, SaveWeeklyPlanSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

function getISOWeekLabel(date: Date = new Date()): string {
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

export async function getActiveWeeklyPlan() {
  try {
    const userId = await requireCurrentUserId();
    const currentWeekLabel = getISOWeekLabel();
    const plan = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, userId),
        eq(weeklyPlans.weekLabel, currentWeekLabel),
      ),
    });
    return { success: true, plan: plan || null };
  } catch (error) {
    logger.error('weekly_plan_get_failed', {}, error);
    return { success: false, error: 'No se pudo cargar la planificación semanal.' };
  }
}

export async function saveWeeklyPlan(input: unknown) {
  try {
    const v = validate(SaveWeeklyPlanSchema, input);
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();
    const currentWeekLabel = getISOWeekLabel();

    const existing = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, userId),
        eq(weeklyPlans.weekLabel, currentWeekLabel),
      ),
    });

    const tasksJson = v.data.tasks ? JSON.stringify(v.data.tasks) : '[]';

    if (existing) {
      await db
        .update(weeklyPlans)
        .set({
          focus: v.data.focus ?? '',
          tasksJson,
          relationToNutre: v.data.relationToNutre ?? null,
        })
        .where(and(eq(weeklyPlans.id, existing.id), eq(weeklyPlans.userId, userId)));
      revalidatePath('/');
      revalidatePath('/review');
      return { success: true, planId: existing.id };
    }

    const id = randomUUID();
    await db.insert(weeklyPlans).values({
      id,
      userId,
      weekLabel: currentWeekLabel,
      focus: v.data.focus ?? '',
      tasksJson,
      relationToNutre: v.data.relationToNutre ?? null,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/');
    revalidatePath('/review');
    return { success: true, planId: id };
  } catch (error) {
    logger.error('weekly_plan_save_failed', {}, error);
    return { success: false, error: 'No se pudo guardar la planeación dominical.' };
  }
}