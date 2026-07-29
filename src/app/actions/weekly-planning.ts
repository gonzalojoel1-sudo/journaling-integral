'use server';

import { db } from '../../db/db';
import { weeklyPlans } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';
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
    const userId = await getCurrentUserId();
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

export async function saveWeeklyPlan(formData: Record<string, any>) {
  try {
    const v = validate(SaveWeeklyPlanSchema, formData);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const currentWeekLabel = getISOWeekLabel();

    const activePlanRes = await getActiveWeeklyPlan();
    const planId = activePlanRes.plan?.id || randomUUID();

    const planData = {
      id: planId,
      userId: userId,
      weekLabel: currentWeekLabel,
      focus: formData.focus || '',
      tasksJson: formData.tasks ? JSON.stringify(formData.tasks) : '[]',
      relationToNutre: formData.relationToNutre || null,
      createdAt: activePlanRes.plan?.createdAt || new Date().toISOString(),
    };

    if (activePlanRes.plan) {
      await db
        .update(weeklyPlans)
        .set(planData)
        .where(eq(weeklyPlans.id, activePlanRes.plan.id));
    } else {
      await db.insert(weeklyPlans).values(planData);
    }

    revalidatePath('/');
    revalidatePath('/review');
    return { success: true };
  } catch (error) {
    logger.error('weekly_plan_save_failed', {}, error);
    return { success: false, error: 'No se pudo guardar la planeación dominical.' };
  }
}
