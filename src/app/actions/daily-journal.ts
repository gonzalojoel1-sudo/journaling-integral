'use server';

import { db } from '../../db/db';
import { dailyEntries, users, habits, businessTransactions } from '../../db/schema';
import { applyDecayAndBonus } from '../../lib/habit-strength';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId, getOrCreateUserProfile } from './auth';
import { validateActiveChallenges } from './challenges';
import {
  validate,
  DailyEntrySchema,
  CreateBusinessTransactionSchema,
} from '@/lib/validations';
import { storeEntryEmbedding, buildEntryContent } from '@/lib/rag';

function calculateStreak(
  lastEntryDate: string | null,
  currentStreak: number,
  todayStr: string,
): number {
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastEntryDate === yesterdayStr) {
    return currentStreak + 1;
  }
  if (lastEntryDate !== todayStr) {
    return 1;
  }
  return currentStreak;
}

function checkLevelProgression(currentLevel: number, activeDaysCount: number): number {
  if (currentLevel === 1 && activeDaysCount >= 18) return 2;
  if (currentLevel === 2 && activeDaysCount >= 25) return 3;
  if (currentLevel === 3 && activeDaysCount >= 28) return 3; // Lvl 4-5 requieren badges, no dias
  return currentLevel;
}

export async function submitDailyEntry(formData: Record<string, any>) {
  try {
    const v = validate(DailyEntrySchema, formData);
    if (!v.success) return { success: false, error: v.error };

    const profileRes = await getOrCreateUserProfile();
    if (!profileRes.success || !profileRes.user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    const user = profileRes.user;
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const existingEntry = await db.query.dailyEntries.findFirst({
      where: and(
        eq(dailyEntries.userId, user.id),
        eq(dailyEntries.date, todayStr),
      ),
    });

    const entryId = existingEntry?.id || randomUUID();
    const isUpdate = !!existingEntry;

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
      implementationIntentions: formData.implementationIntentions
        ? JSON.stringify(formData.implementationIntentions)
        : null,

      mitSer: formData.mitSer || null,
      mitSerCompleted: formData.mitSerCompleted ? 1 : 0,
      mitNegocio: formData.mitNegocio || null,
      mitNegocioCompleted: formData.mitNegocioCompleted ? 1 : 0,
      mitRelaciones: formData.mitRelaciones || null,
      mitRelacionesCompleted: formData.mitRelacionesCompleted ? 1 : 0,

      dailyHabitsJson: formData.dailyHabits ? JSON.stringify(formData.dailyHabits) : null,
      achievementsTop3: formData.achievementsTop3
        ? JSON.stringify(formData.achievementsTop3)
        : null,
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
      mindsetStateRating: formData.mindsetStateRating
        ? Number(formData.mindsetStateRating)
        : null,
      mindsetEmotion1: formData.mindsetEmotion1 || null,
      mindsetEmotion2: formData.mindsetEmotion2 || null,
      mindsetEmotion3: formData.mindsetEmotion3 || null,
      mindsetTriggers: formData.mindsetTriggers || null,
      mindsetBiblicalTruth: formData.mindsetBiblicalTruth || null,
      mindsetLimitingBelief: formData.mindsetLimitingBelief || null,
      mindsetLimitingAction: formData.mindsetLimitingAction || null,
      mindsetEmpoweringBelief: formData.mindsetEmpoweringBelief || null,
      mindsetEmpoweringAction: formData.mindsetEmpoweringAction || null,
      prepTomorrowJson: formData.prepTomorrow
        ? JSON.stringify(formData.prepTomorrow)
        : null,

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

      await db
        .update(users)
        .set({
          streakCurrent: newStreak,
          streakMax: newMaxStreak,
          lastEntryDate: todayStr,
        })
        .where(eq(users.id, user.id));
    }

    // RAG: Generate embedding in background (non-blocking)
    const contentForEmbedding = buildEntryContent(entryData);
    storeEntryEmbedding(user.id, entryId, contentForEmbedding).catch((err) =>
      console.error('[RAG] Falló la generación del embedding en segundo plano:', err),
    );

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    const dateLimitStr = dateLimit.toISOString().split('T')[0];

    const entriesLast30Days = await db.query.dailyEntries.findMany({
      where: and(
        eq(dailyEntries.userId, user.id),
        gte(dailyEntries.date, dateLimitStr),
      ),
    });

    const activeDaysCount = entriesLast30Days.length;
    const targetLevel = checkLevelProgression(user.currentLevel, activeDaysCount);

    if (targetLevel !== user.currentLevel) {
      await db
        .update(users)
        .set({ currentLevel: targetLevel })
        .where(eq(users.id, user.id));
    }

    if (formData.dailyHabits && Array.isArray(formData.dailyHabits)) {
      const todayStr = new Date().toISOString().split('T')[0];

      for (const habitEntry of formData.dailyHabits) {
        if (!habitEntry.habitId) continue;

        const habitRecord = await db.query.habits.findFirst({
          where: eq(habits.id, habitEntry.habitId),
        });

        if (!habitRecord) continue;

        const { newStrength, newDate } = applyDecayAndBonus(
          habitRecord.currentStrength ?? 0,
          habitRecord.lastStrengthDate,
          todayStr,
          habitEntry.completed === true,
        );

        await db
          .update(habits)
          .set({
            currentStrength: newStrength,
            lastStrengthDate: newDate,
          })
          .where(eq(habits.id, habitEntry.habitId));

        if (habitRecord.habitType === 'sembrar') {
          const currentDays = habitRecord.daysInCurrentCycle ?? 0;
          if (habitEntry.completed === true && currentDays < 15) {
            await db.update(habits).set({
              daysInCurrentCycle: currentDays + 1,
            }).where(eq(habits.id, habitEntry.habitId));
          }
        }

        if (
          !habitEntry.completed &&
          habitRecord.rescueAction &&
          habitRecord.activeAction !== habitRecord.rescueAction &&
          newStrength < (habitRecord.currentStrength ?? 0) * 0.85
        ) {
          await db
            .update(habits)
            .set({ activeAction: habitRecord.rescueAction })
            .where(eq(habits.id, habitEntry.habitId));
        }

        if (
          habitEntry.completed === true &&
          habitRecord.rescueAction &&
          habitRecord.rescueAction !== habitRecord.activeAction
        ) {
          if (newStrength >= (habitRecord.currentStrength ?? 0) + 2.5) {
            await db
              .update(habits)
              .set({ activeAction: habitRecord.rescueAction })
              .where(eq(habits.id, habitEntry.habitId));
          }
        }
      }
    }

    revalidatePath('/');
    revalidatePath('/journal');
    revalidatePath('/progress');
    revalidatePath('/challenges');
    revalidatePath('/habits');
    revalidatePath('/negocio');

    let badgeUnlocked: string | null = null;
    if (!isUpdate) {
      const cr = await validateActiveChallenges(entryData, user);
      badgeUnlocked = cr.badgeUnlocked ?? null;
    }

    return {
      success: true,
      isUpdate,
      levelUpgraded: targetLevel > user.currentLevel,
      newLevel: targetLevel,
      badgeUnlocked,
    };
  } catch (error) {
    console.error('Error al guardar el diario:', error);
    return { success: false, error: 'Hubo un error al procesar el guardado.' };
  }
}

export async function getAnalyticsData() {
  try {
    const userId = await getCurrentUserId();
    const entries = await db.query.dailyEntries.findMany({
      where: eq(dailyEntries.userId, userId),
      orderBy: [desc(dailyEntries.date)],
      limit: 30,
    });
    return { success: true, entries };
  } catch (error) {
    console.error('Error al obtener analíticas:', error);
    return { success: false, error: 'No se pudo generar el reporte de analíticas.' };
  }
}

export async function getDailyBusinessMetrics(date?: string) {
  try {
    const userId = await getCurrentUserId();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const txns = await db.query.businessTransactions.findMany({
      where: and(
        eq(businessTransactions.userId, userId),
        eq(businessTransactions.date, targetDate),
      ),
    });

    const totalIncome = txns
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = txns
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSales = txns.filter((t) => t.isSale === 1).length;

    const netMargin = totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 100) / 100
      : 0;

    return {
      success: true,
      totalIncome,
      totalExpenses,
      totalSales,
      netMargin,
      transactionCount: txns.length,
      transactions: txns,
    };
  } catch (error) {
    console.error('Error al obtener métricas de negocio:', error);
    return { success: false, error: 'No se pudieron obtener las métricas.' };
  }
}

export async function getBusinessMetricsRange(startDate: string, endDate: string) {
  try {
    const userId = await getCurrentUserId();

    const txns = await db.query.businessTransactions.findMany({
      where: and(
        eq(businessTransactions.userId, userId),
        gte(businessTransactions.date, startDate),
        lte(businessTransactions.date, endDate),
      ),
    });

    const entries = await db.query.dailyEntries.findMany({
      where: and(
        eq(dailyEntries.userId, userId),
        gte(dailyEntries.date, startDate),
        lte(dailyEntries.date, endDate),
      ),
    });

    const totalIncome = txns
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = txns
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSales = txns.filter((t) => t.isSale === 1).length;
    const totalContacts = entries.reduce((sum, e) => sum + e.bizContactsCount, 0);

    const netMargin = totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 100) / 100
      : 0;

    const pipelineConversion = totalContacts > 0
      ? Math.round((totalSales / totalContacts) * 100 * 100) / 100
      : 0;

    const weeklyData = entries.reduce((acc: Record<string, any>, e) => {
      const date = new Date(e.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!acc[weekKey]) {
        acc[weekKey] = { week: weekKey, income: 0, prospectDone: 0, followUpDone: 0, mktDone: 0, days: 0 };
      }
      acc[weekKey].income += e.bizIncome;
      acc[weekKey].prospectDone += e.bizProspectCompleted ? 1 : 0;
      acc[weekKey].followUpDone += e.bizFollowUpCompleted ? 1 : 0;
      acc[weekKey].mktDone += e.bizMktActionCompleted ? 1 : 0;
      acc[weekKey].days += 1;
      return acc;
    }, {});

    return {
      success: true,
      totalIncome,
      totalExpenses,
      totalSales,
      totalContacts,
      netMargin,
      pipelineConversion,
      transactions: txns,
      weeklyData: Object.values(weeklyData),
    };
  } catch (error) {
    console.error('Error al obtener métricas de negocio:', error);
    return { success: false, error: 'No se pudieron obtener las métricas.' };
  }
}

export async function createBusinessTransaction(data: {
  amount: number;
  cost?: number;
  type: string;
  description?: string;
  source?: string;
  isSale?: boolean;
  date?: string;
}) {
  try {
    const v = validate(CreateBusinessTransactionSchema, data);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const todayStr = new Date().toISOString().split('T')[0];

    await db.insert(businessTransactions).values({
      id: randomUUID(),
      userId,
      amount: data.amount,
      cost: data.cost ?? 0,
      type: data.type,
      description: data.description || null,
      source: data.source || 'General',
      isSale: data.isSale ? 1 : 0,
      date: data.date || todayStr,
      dailyEntryId: null,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/negocio');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al crear transacción:', error);
    return { success: false, error: 'No se pudo crear la transacción.' };
  }
}
