import { Hono } from 'hono';
import { db } from '../db';
import { dailyEntries, users } from '@journaling/shared/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { calculateStreak, checkLevelProgression } from '@journaling/shared';

export const journalRoutes = new Hono();

journalRoutes.post('/entries', async (c) => {
  try {
    const formData = await c.req.json();
    const userId = c.get('userId');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      return c.json({ success: false, error: 'Usuario no encontrado' }, 404);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const existingEntry = await db.query.dailyEntries.findFirst({
      where: and(
        eq(dailyEntries.userId, user.id),
        eq(dailyEntries.date, todayStr),
      ),
    });

    const entryId = existingEntry?.id || randomUUID();

    const entryData = {
      id: entryId,
      userId: user.id,
      date: todayStr,
      time: timeStr,
      levelAtEntry: user.currentLevel,
      isPlanBUsed: formData.isPlanBUsed ? 1 : 0,
      sleepRating: formData.sleepRating ? Number(formData.sleepRating) : null,
      energyRating: formData.energyRating ? Number(formData.energyRating) : null,
      focusRating: formData.focusRating ? Number(formData.focusRating) : null,
      stressRating: formData.stressRating ? Number(formData.stressRating) : null,
      quickEnergyAction: formData.quickEnergyAction || null,
      gratitude1: formData.gratitude1 || null,
      gratitude2: formData.gratitude2 || null,
      gratitude3: formData.gratitude3 || null,
      wisdomRequest: formData.wisdomRequest || null,
      chooseToBeIdentity: formData.chooseToBeIdentity || null,
      identityAction: formData.identityAction || null,
      dailyMicroAchievement: formData.dailyMicroAchievement || null,
      devotionalNotes: formData.devotionalNotes || null,
      autoeducation: formData.autoeducation ? JSON.stringify(formData.autoeducation) : null,
      implementationIntentions: formData.implementationIntentions ? JSON.stringify(formData.implementationIntentions) : null,
      mitSer: formData.mitSer || null,
      mitSerCompleted: formData.mitSerCompleted ? 1 : 0,
      mitNegocio: formData.mitNegocio || null,
      mitNegocioCompleted: formData.mitNegocioCompleted ? 1 : 0,
      mitRelaciones: formData.mitRelaciones || null,
      mitRelacionesCompleted: formData.mitRelacionesCompleted ? 1 : 0,
      dailyHabitsJson: formData.dailyHabits ? JSON.stringify(formData.dailyHabits) : null,
      achievementsTop3: formData.achievementsTop3 ? JSON.stringify(formData.achievementsTop3) : null,
      whatWorked: formData.whatWorked || null,
      whatDidNotWork: formData.whatDidNotWork || null,
      improvementIdea: formData.improvementIdea || null,
      bizProspectCompleted: formData.bizProspectCompleted ? 1 : 0,
      bizFollowUpCompleted: formData.bizFollowUpCompleted ? 1 : 0,
      bizMktActionCompleted: formData.bizMktActionCompleted ? 1 : 0,
      bizActionsSpecific: formData.bizActionsSpecific || null,
      bizContactsCount: formData.bizContactsCount || 0,
      bizSalesCount: formData.bizSalesCount || 0,
      bizIncome: formData.bizIncome || 0,
      bizExpenses: formData.bizExpenses || 0,
      bizImprovementTomorrow: formData.bizImprovementTomorrow || null,
      mindsetStateRating: formData.mindsetStateRating ? Number(formData.mindsetStateRating) : null,
      mindsetEmotion1: formData.mindsetEmotion1 || null,
      mindsetEmotion2: formData.mindsetEmotion2 || null,
      mindsetEmotion3: formData.mindsetEmotion3 || null,
      mindsetTriggers: formData.mindsetTriggers || null,
      mindsetBiblicalTruth: formData.mindsetBiblicalTruth || null,
      mindsetLimitingBelief: formData.mindsetLimitingBelief || null,
      mindsetLimitingAction: formData.mindsetLimitingAction || null,
      mindsetEmpoweringBelief: formData.mindsetEmpoweringBelief || null,
      mindsetEmpoweringAction: formData.mindsetEmpoweringAction || null,
      prepTomorrowJson: formData.prepTomorrow ? JSON.stringify(formData.prepTomorrow) : null,
      legacyReflection: formData.legacyReflection || null,
      dominantFocusCompleted: formData.dominantFocusCompleted ? 1 : 0,
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
    };

    if (existingEntry) {
      await db.update(dailyEntries).set(entryData).where(eq(dailyEntries.id, existingEntry.id));
    } else {
      await db.insert(dailyEntries).values(entryData);

      const newStreak = calculateStreak(user.lastEntryDate, user.streakCurrent, todayStr);
      const newMaxStreak = Math.max(newStreak, user.streakMax);

      await db.update(users).set({
        streakCurrent: newStreak,
        streakMax: newMaxStreak,
        lastEntryDate: todayStr,
      }).where(eq(users.id, user.id));
    }

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    const dateLimitStr = dateLimit.toISOString().split('T')[0];

    const entriesLast30Days = await db.query.dailyEntries.findMany({
      where: and(eq(dailyEntries.userId, user.id), gte(dailyEntries.date, dateLimitStr)),
    });

    const activeDaysCount = entriesLast30Days.length;
    const targetLevel = checkLevelProgression(user.currentLevel, activeDaysCount);

    if (targetLevel !== user.currentLevel) {
      await db.update(users).set({ currentLevel: targetLevel }).where(eq(users.id, user.id));
    }

    return c.json({
      success: true,
      data: {
        levelUpgraded: targetLevel > user.currentLevel,
        newLevel: targetLevel,
      },
    });
  } catch (error) {
    console.error('Error al guardar el diario:', error);
    return c.json({ success: false, error: 'Hubo un error al procesar el guardado' }, 500);
  }
});

journalRoutes.get('/analytics', async (c) => {
  try {
    const userId = c.get('userId');
    const entries = await db.query.dailyEntries.findMany({
      where: eq(dailyEntries.userId, userId),
      orderBy: [desc(dailyEntries.date)],
      limit: 30,
    });
    return c.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error al obtener analiticas:', error);
    return c.json({ success: false, error: 'No se pudo generar el reporte' }, 500);
  }
});
