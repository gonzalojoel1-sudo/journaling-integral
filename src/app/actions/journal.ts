'use server';

import { db } from '../../db/db';
import { users, dailyEntries, quarterlyPlans, weeklyPlans, habits, bibleVerses } from '../../db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth'; 
import { authOptions } from '../api/auth/[...nextauth]/options';
import { cache } from 'react';

const DEMO_USER_ID = 'demo-user-id';

/**
 * Calcula de manera estándar el número de semana ISO-8601 actual para el reset.
 * Se remueve la palabra 'export' para cumplir de forma estricta con el contrato
 * de archivos 'use server' de Next.js (que exige que toda exportación sea asíncrona).
 */
function getISOWeekLabel(date: Date = new Date()): string {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return tempDate.getFullYear().toString() + '-W' + weekNum.toString();
}

/**
 * Resuelve el ID del usuario en sesión activa de forma cacheada
 */
export const getCurrentUserId = cache(async (): Promise<string> => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
      });
      if (dbUser) {
        return dbUser.id;
      }
    }
  } catch (error) {
    console.error('Error al resolver ID de usuario en sesión:', error);
  }
  return DEMO_USER_ID; 
});

/**
 * Obtiene el perfil del usuario actual de manera cacheada y ultra-rápida.
 */
export const getOrCreateUserProfile = cache(async () => {
  try {
    const userId = await getCurrentUserId();

    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      const existingByEmail = await db.query.users.findFirst({
        where: eq(users.email, 'joel@journalingintegral.demo'),
      });

      if (existingByEmail) {
        user = existingByEmail;
      } else {
        const newUser = {
          id: DEMO_USER_ID,
          name: 'Joel Pacheco',
          email: 'joel@journalingintegral.demo',
          password: '64cbe39276226f3044a69e7cf8db172ff2753177894d075276e0537482fc60f97970d47343e57140e4f8ff169997193d56bc080922896564619965da4970633b', // Hash precalculado de 'admin123'
          currentLevel: 1,
          streakCurrent: 0,
          streakMax: 0,
          lastEntryDate: null,
          createdAt: new Date().toISOString(),
        };
        await db.insert(users).values(newUser);
        user = newUser;
      }
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return { success: false, error: 'No se pudo cargar el perfil del usuario.' };
  }
});

/**
 * Obtiene un versículo bíblico diario de manera aleatoria.
 */
export async function getRandomVerse(level: number = 1) {
  try {
    const list = await db.select().from(bibleVerses);
    if (!list.length) return null;

    const filtered = list.filter((v) => v.recommendedLevel === level);
    const selectionSource = filtered.length > 0 ? filtered : list;
    
    const randomIndex = Math.floor(Math.random() * selectionSource.length);
    return selectionSource[randomIndex];
  } catch (error) {
    console.error('Error al obtener versículo:', error);
    return null;
  }
}

/**
 * Guarda o actualiza una entrada de Journal Diario.
 */
export async function submitDailyEntry(formData: Record<string, any>) {
  try {
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
        eq(dailyEntries.date, todayStr)
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

      let newStreak = user.streakCurrent;
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (user.lastEntryDate === yesterdayStr) {
        newStreak += 1;
      } else if (user.lastEntryDate !== todayStr) {
        newStreak = 1;
      }

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

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    const dateLimitStr = dateLimit.toISOString().split('T')[0];

    const entriesLast30Days = await db.query.dailyEntries.findMany({
      where: and(
        eq(dailyEntries.userId, user.id),
        gte(dailyEntries.date, dateLimitStr)
      ),
    });

    const activeDaysCount = entriesLast30Days.length;
    let targetLevel = user.currentLevel;

    if (user.currentLevel === 1 && activeDaysCount >= 18) {
      targetLevel = 2;
    } else if (user.currentLevel === 2 && activeDaysCount >= 25) {
      targetLevel = 3;
    }

    if (targetLevel !== user.currentLevel) {
      await db
        .update(users)
        .set({ currentLevel: targetLevel })
        .where(eq(users.id, user.id));
    }

    revalidatePath('/');
    revalidatePath('/journal');
    revalidatePath('/progress');

    return { 
      success: true, 
      levelUpgraded: targetLevel > user.currentLevel, 
      newLevel: targetLevel 
    };
  } catch (error) {
    console.error('Error al guardar el diario:', error);
    return { success: false, error: 'Hubo un error al procesar el guardado.' };
  }
}

/**
 * Obtiene el plan trimestral activo del usuario de forma dinámica.
 */
export async function getActiveQuarterlyPlan() {
  try {
    const userId = await getCurrentUserId();
    const plan = await db.query.quarterlyPlans.findFirst({
      where: and(
        eq(quarterlyPlans.userId, userId),
        eq(quarterlyPlans.isActive, 1)
      ),
    });
    return { success: true, plan: plan || null };
  } catch (error) {
    console.error('Error al obtener plan trimestral:', error);
    return { success: false, error: 'No se pudo cargar el plan trimestral.' };
  }
}

/**
 * Registra o actualiza el Planeamiento Trimestral bajo el usuario activo.
 */
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

      smartObjectivesJson: formData.smartObjectives ? JSON.stringify(formData.smartObjectives) : '[]',
      actionsPlanJson: formData.actionsPlan ? JSON.stringify(formData.actionsPlan) : '[]',
      legacyAuditNotes: formData.legacyAuditNotes || null,
      createdAt: activePlanRes.plan?.createdAt || new Date().toISOString(),
    };

    if (activePlanRes.plan) {
      await db.update(quarterlyPlans).set(planData).where(eq(quarterlyPlans.id, activePlanRes.plan.id));
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

/**
 * Obtiene el listado de hábitos activos del usuario en sesión.
 */
export async function getActiveHabits() {
  try {
    const userId = await getCurrentUserId();
    const list = await db.query.habits.findMany({
      where: and(
        eq(habits.userId, userId),
        eq(habits.isActive, 1)
      ),
    });
    return { success: true, habits: list };
  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    return { success: false, error: 'No se pudo cargar la lista de hábitos.' };
  }
}

/**
 * Crea un nuevo hábito dentro de la estructura EOR para el usuario activo.
 */
export async function createHabit(name: string, type: string, strategyDetails: string) {
  try {
    const userId = await getCurrentUserId();
    await db.insert(habits).values({
      id: randomUUID(),
      userId: userId,
      name,
      type,
      strategyDetails,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/habits');
    revalidatePath('/journal');
    return { success: true };
  } catch (error) {
    console.error('Error al añadir hábito:', error);
    return { success: false, error: 'Ocurrió un error al guardar el hábito.' };
  }
}

/**
 * Elimina o archiva un hábito.
 */
export async function archiveHabit(habitId: string) {
  try {
    await db.update(habits).set({ isActive: 0 }).where(eq(habits.id, habitId));
    revalidatePath('/habits');
    return { success: true };
  } catch (error) {
    console.error('Error al archivar hábito:', error);
    return { success: false, error: 'No se pudo completar la operación.' };
  }
}

/**
 * Obtiene las entradas históricas del usuario activo.
 */
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

/**
 * Forzar el cambio de nivel del usuario (Exclusivo Administrador/Pruebas)
 */
export async function updateUserLevel(level: number) {
  try {
    const userId = await getCurrentUserId();
    await db
      .update(users)
      .set({ currentLevel: level })
      .where(eq(users.id, userId));
    
    revalidatePath('/');
    revalidatePath('/journal');
    revalidatePath('/habits');
    revalidatePath('/progress');
    return { success: true };
  } catch (error) {
    console.error('Error al forzar nivel de usuario:', error);
    return { success: false, error: 'No se pudo actualizar el nivel.' };
  }
}

/**
 * Obtiene versículos de la biblioteca filtrados por un tópico específico con fallback dinámico de rotación.
 */
export async function getVersesByTopic(topic?: string) {
  try {
    let list;
    if (topic) {
      list = await db.query.bibleVerses.findMany({
        where: eq(bibleVerses.topic, topic)
      });
    } else {
      list = await db.query.bibleVerses.findMany();
    }
    
    if (!list || list.length === 0) {
      const fallback = await db.query.bibleVerses.findFirst();
      if (fallback) return fallback;
      throw new Error();
    }
    
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  } catch (error) {
    const offlineFallbacks = [
      {
        id: 'fallback-1',
        reference: 'Josué 1:9',
        text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.',
        interpretation: 'Tu fortaleza está garantizada hoy. Camina con valentía y asume las tareas con diligencia y fe.',
        recommendedLevel: 1,
        topic: 'Dominio Propio'
      },
      {
        id: 'fallback-2',
        reference: 'Proverbios 21:5',
        text: 'Los pensamientos del diligente ciertamente tienden a la abundancia; mas todo el que se apresura alocadamente, de cierto va a la pobreza.',
        interpretation: 'La disciplina en planificar vence a la reactividad de tus impulsos. Administra tu negocio con cobredad hoy.',
        recommendedLevel: 1,
        topic: 'Finanzas'
      },
      {
        id: 'fallback-3',
        reference: 'Jeremías 31:3',
        text: 'Con amor eterno te he amado; por tanto, te prolongué mi misericordia.',
        interpretation: 'Tu valor identitario como ser humano no depende de tu nivel de productividad diaria, sino del amor de tu creador.',
        recommendedLevel: 1,
        topic: 'Identidad'
      }
    ];

    const randomIndex = Math.floor(Math.random() * offlineFallbacks.length);
    return offlineFallbacks[randomIndex];
  }
}

/**
 * Obtiene el plan semanal activo del usuario de forma dinámica para el reset.
 */
export async function getActiveWeeklyPlan() {
  try {
    const userId = await getCurrentUserId();
    const currentWeekLabel = getISOWeekLabel();
    const plan = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, userId),
        eq(weeklyPlans.weekLabel, currentWeekLabel)
      ),
    });
    return { success: true, plan: plan || null };
  } catch (error) {
    console.error('Error al obtener plan semanal:', error);
    return { success: false, error: 'No se pudo cargar la planificación semanal.' };
  }
}

/**
 * Guarda o actualiza la planificación semanal (Sunday Reset).
 */
export async function saveWeeklyPlan(formData: Record<string, any>) {
  try {
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
      await db.update(weeklyPlans).set(planData).where(eq(weeklyPlans.id, activePlanRes.plan.id));
    } else {
      await db.insert(weeklyPlans).values(planData);
    }

    revalidatePath('/');
    revalidatePath('/review');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar plan semanal:', error);
    return { success: false, error: 'No se pudo guardar la planeación dominical.' };
  }
}