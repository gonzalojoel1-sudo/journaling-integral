'use server';

import { db } from '../../db/db';
import { quarterlyPlans } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireCurrentUserId } from './auth';
import { validate, SaveQuarterlyPlanSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function getActiveQuarterlyPlan() {
  try {
    const userId = await requireCurrentUserId();
    const plan = await db.query.quarterlyPlans.findFirst({
      where: and(
        eq(quarterlyPlans.userId, userId),
        eq(quarterlyPlans.isActive, 1),
      ),
    });
    return { success: true, plan: plan || null };
  } catch (error) {
    logger.error('quarterly_plan_get_failed', {}, error);
    return { success: false, error: 'No se pudo cargar el plan trimestral.' };
  }
}

export async function saveQuarterlyPlan(input: unknown) {
  try {
    const v = validate(SaveQuarterlyPlanSchema, input);
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();

    const year = v.data.year ?? new Date().getFullYear();
    const quarterLabel = v.data.quarterLabel ?? 'Q1/2026';

    await db
      .update(quarterlyPlans)
      .set({ isActive: 0 })
      .where(and(eq(quarterlyPlans.userId, userId), eq(quarterlyPlans.isActive, 1)));

    const existing = await db.query.quarterlyPlans.findFirst({
      where: and(
        eq(quarterlyPlans.userId, userId),
        eq(quarterlyPlans.quarterLabel, quarterLabel),
        eq(quarterlyPlans.year, year),
      ),
    });

    const smartObjectivesJson = v.data.smartObjectives
      ? JSON.stringify(v.data.smartObjectives)
      : '[]';
    const actionsPlanJson = v.data.actionsPlan
      ? JSON.stringify(v.data.actionsPlan)
      : '[]';

    if (existing) {
      await db
        .update(quarterlyPlans)
        .set({
          quarterLabel,
          year,
          isActive: 1,
          fiveYearSpiritual: v.data.fiveYearSpiritual ?? null,
          fiveYearBeing: v.data.fiveYearBeing ?? null,
          fiveYearBusiness: v.data.fiveYearBusiness ?? null,
          fiveYearRelations: v.data.fiveYearRelations ?? null,
          quarterlySpiritual: v.data.quarterlySpiritual ?? null,
          quarterlyBeing: v.data.quarterlyBeing ?? null,
          quarterlyBusiness: v.data.quarterlyBusiness ?? null,
          quarterlyRelations: v.data.quarterlyRelations ?? null,
          smartObjectivesJson,
          actionsPlanJson,
          legacyAuditNotes: v.data.legacyAuditNotes ?? null,
        })
        .where(and(eq(quarterlyPlans.id, existing.id), eq(quarterlyPlans.userId, userId)));
      revalidatePath('/quarterly');
      return { success: true, planId: existing.id };
    }

    const id = randomUUID();
    await db.insert(quarterlyPlans).values({
      id,
      userId,
      quarterLabel,
      year,
      isActive: 1,
      fiveYearSpiritual: v.data.fiveYearSpiritual ?? null,
      fiveYearBeing: v.data.fiveYearBeing ?? null,
      fiveYearBusiness: v.data.fiveYearBusiness ?? null,
      fiveYearRelations: v.data.fiveYearRelations ?? null,
      quarterlySpiritual: v.data.quarterlySpiritual ?? null,
      quarterlyBeing: v.data.quarterlyBeing ?? null,
      quarterlyBusiness: v.data.quarterlyBusiness ?? null,
      quarterlyRelations: v.data.quarterlyRelations ?? null,
      smartObjectivesJson,
      actionsPlanJson,
      legacyAuditNotes: v.data.legacyAuditNotes ?? null,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/quarterly');
    return { success: true, planId: id };
  } catch (error) {
    logger.error('quarterly_plan_save_failed', {}, error);
    return { success: false, error: 'No se pudo guardar la planeación.' };
  }
}