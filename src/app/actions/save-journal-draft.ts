'use server';

import { db } from '../../db/db';
import { dailyEntries } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { requireCurrentUserId } from './auth';
import { logger } from '@/lib/logger';
import { DraftJournalSchema } from '@/lib/validations';
import { todayStr } from '@/lib/dates';

export async function saveJournalDraft(data: unknown) {
  try {
    const v = DraftJournalSchema.safeParse(data);
    if (!v.success) {
      logger.warn('save_journal_draft_invalid_payload', {
        issues: v.error.issues.map((i) => i.path.join('.')),
      });
      return { success: false, error: 'Datos de borrador inválidos' };
    }

    const userId = await requireCurrentUserId();
    const today = todayStr();

    const existing = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, today)),
    });

    const draft = v.data;

    if (existing) {
      await db
        .update(dailyEntries)
        .set({
          time: new Date().toISOString(),
          sleepRating: draft.sleepRating ?? null,
          energyRating: draft.energyRating ?? null,
          focusRating: draft.focusRating ?? null,
          stressRating: draft.stressRating ?? null,
          quickEnergyAction: draft.quickEnergyAction ?? null,
          gratitude1: draft.gratitude1 ?? null,
          gratitude2: draft.gratitude2 ?? null,
          gratitude3: draft.gratitude3 ?? null,
          wisdomRequest: draft.wisdomRequest ?? null,
          chooseToBeIdentity: draft.chooseToBeIdentity ?? null,
          identityAction: draft.identityAction ?? null,
          dailyMicroAchievement: draft.dailyMicroAchievement ?? null,
          devotionalNotes: draft.devotionalNotes ?? null,
          autoeducation: draft.autoeducation ? JSON.stringify(draft.autoeducation) : null,
          implementationIntentions: draft.implementationIntentions
            ? JSON.stringify(draft.implementationIntentions)
            : null,
          mitSer: draft.mitSer ?? null,
          mitNegocio: draft.mitNegocio ?? null,
          mitRelaciones: draft.mitRelaciones ?? null,
          achievementsTop3: draft.achievementsTop3
            ? JSON.stringify(draft.achievementsTop3)
            : null,
          whatWorked: draft.whatWorked ?? null,
          whatDidNotWork: draft.whatDidNotWork ?? null,
          improvementIdea: draft.improvementIdea ?? null,
          mindsetStateRating: draft.mindsetStateRating ?? null,
          mindsetEmotion1: draft.mindsetEmotion1 ?? null,
          mindsetEmotion2: draft.mindsetEmotion2 ?? null,
          mindsetEmotion3: draft.mindsetEmotion3 ?? null,
          mindsetTriggers: draft.mindsetTriggers ?? null,
          mindsetBiblicalTruth: draft.mindsetBiblicalTruth ?? null,
          mindsetLimitingBelief: draft.mindsetLimitingBelief ?? null,
          mindsetLimitingAction: draft.mindsetLimitingAction ?? null,
          mindsetEmpoweringBelief: draft.mindsetEmpoweringBelief ?? null,
          mindsetEmpoweringAction: draft.mindsetEmpoweringAction ?? null,
          prepTomorrowJson: draft.prepTomorrow ? JSON.stringify(draft.prepTomorrow) : null,
          legacyReflection: draft.legacyReflection ?? null,
        })
        .where(and(eq(dailyEntries.id, existing.id), eq(dailyEntries.userId, userId)));
      return { success: true };
    }

    await db.insert(dailyEntries).values({
      id: randomUUID(),
      userId,
      date: today,
      time: new Date().toISOString(),
      sleepRating: draft.sleepRating ?? null,
      energyRating: draft.energyRating ?? null,
      focusRating: draft.focusRating ?? null,
      stressRating: draft.stressRating ?? null,
      quickEnergyAction: draft.quickEnergyAction ?? null,
      gratitude1: draft.gratitude1 ?? null,
      gratitude2: draft.gratitude2 ?? null,
      gratitude3: draft.gratitude3 ?? null,
      wisdomRequest: draft.wisdomRequest ?? null,
      chooseToBeIdentity: draft.chooseToBeIdentity ?? null,
      identityAction: draft.identityAction ?? null,
      dailyMicroAchievement: draft.dailyMicroAchievement ?? null,
      devotionalNotes: draft.devotionalNotes ?? null,
      autoeducation: draft.autoeducation ? JSON.stringify(draft.autoeducation) : null,
      implementationIntentions: draft.implementationIntentions
        ? JSON.stringify(draft.implementationIntentions)
        : null,
      mitSer: draft.mitSer ?? null,
      mitNegocio: draft.mitNegocio ?? null,
      mitRelaciones: draft.mitRelaciones ?? null,
      achievementsTop3: draft.achievementsTop3 ? JSON.stringify(draft.achievementsTop3) : null,
      whatWorked: draft.whatWorked ?? null,
      whatDidNotWork: draft.whatDidNotWork ?? null,
      improvementIdea: draft.improvementIdea ?? null,
      mindsetStateRating: draft.mindsetStateRating ?? null,
      mindsetEmotion1: draft.mindsetEmotion1 ?? null,
      mindsetEmotion2: draft.mindsetEmotion2 ?? null,
      mindsetEmotion3: draft.mindsetEmotion3 ?? null,
      mindsetTriggers: draft.mindsetTriggers ?? null,
      mindsetBiblicalTruth: draft.mindsetBiblicalTruth ?? null,
      mindsetLimitingBelief: draft.mindsetLimitingBelief ?? null,
      mindsetLimitingAction: draft.mindsetLimitingAction ?? null,
      mindsetEmpoweringBelief: draft.mindsetEmpoweringBelief ?? null,
      mindsetEmpoweringAction: draft.mindsetEmpoweringAction ?? null,
      prepTomorrowJson: draft.prepTomorrow ? JSON.stringify(draft.prepTomorrow) : null,
      legacyReflection: draft.legacyReflection ?? null,
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
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    logger.error('save_journal_draft_failed', {}, error);
    return { success: false, error: 'Error al guardar el borrador' };
  }
}