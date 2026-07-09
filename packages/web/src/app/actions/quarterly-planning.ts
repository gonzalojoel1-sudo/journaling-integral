'use server';

import { db } from '../../db/db';
import { quarterlyPlans } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';

export async function getActiveQuarterlyPlan() {
  try {
    const userId = await getCurrentUserId();
    const plan = await db.query.quarterlyPlans.findFirst({
      where: and(
        eq(quarterlyPlans.userId, userId),
        eq(quarterlyPlans.isActive, 1),
      ),
    });
    return { success: true, plan: plan || null };
  } catch (error) {
    console.error('Error al obtener plan trimestral:', error);
    return { success: false, error: 'No se pudo cargar el plan trimestral.' };
  }
}

export async function saveQuarterlyPlan(formData: Record<string, any>) {
  try {
    const userId = await getCurrentUserId();
    const activePlanRes = await getActiveQuarterlyPlan();
    const planId = activePlanRes.plan?.id || randomUUID();

    const planData = {
      id: planId,
      userId: userId,
      quarterLabel: formData.quarterLabel || 'Q1/2026',
      year: formData.year ? Number(formData.year) : new Date().getFullYear(),
      isActive: 1,

      fiveYearSpiritual: formData.fiveYearSpiritual || null,
      fiveYearBeing: formData.fiveYearBeing || null,
      fiveYearBusiness: formData.fiveYearBusiness || null,
      fiveYearRelations: formData.fiveYearRelations || null,

      quarterlySpiritual: formData.quarterlySpiritual || null,
      quarterlyBeing: formData.quarterlyBeing || null,
      quarterlyBusiness: formData.quarterlyBusiness || null,
      quarterlyRelations: formData.quarterlyRelations || null,

      smartObjectivesJson: formData.smartObjectives
        ? JSON.stringify(formData.smartObjectives)
        : '[]',
      actionsPlanJson: formData.actionsPlan
        ? JSON.stringify(formData.actionsPlan)
        : '[]',
      legacyAuditNotes: formData.legacyAuditNotes || null,
      createdAt: activePlanRes.plan?.createdAt || new Date().toISOString(),
    };

    if (activePlanRes.plan) {
      await db
        .update(quarterlyPlans)
        .set(planData)
        .where(eq(quarterlyPlans.id, activePlanRes.plan.id));
    } else {
      await db.insert(quarterlyPlans).values(planData);
    }

    revalidatePath('/quarterly');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar planeamiento trimestral:', error);
    return { success: false, error: 'No se pudo guardar la planeación.' };
  }
}
