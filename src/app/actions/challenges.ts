'use server';

import { db } from '../../db/db';
import { challenges, badges } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';
import { ALL_TEMPLATES, getTemplate, ChallengeTemplate } from '@/lib/challenge-templates';
import { validate, ActivateChallengeSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/json';

export async function getActiveChallenges() {
  try {
    const userId = await getCurrentUserId();
    const list = await db.query.challenges.findMany({
      where: and(
        eq(challenges.userId, userId),
        eq(challenges.status, 'active'),
      ),
    });
    return { success: true, challenges: list };
  } catch (error) {
    logger.error('challenges_get_active_failed', {}, error);
    return { success: false, error: 'No se pudieron cargar los desafios' };
  }
}

export async function getAllChallenges() {
  try {
    const userId = await getCurrentUserId();
    const list = await db.query.challenges.findMany({
      where: eq(challenges.userId, userId),
    });
    return { success: true, challenges: list };
  } catch (error) {
    logger.error('challenges_get_all_failed', {}, error);
    return { success: false, error: 'No se pudieron cargar los desafios' };
  }
}

export async function getBadges() {
  try {
    const userId = await getCurrentUserId();
    const list = await db.query.badges.findMany({
      where: eq(badges.userId, userId),
    });
    return { success: true, badges: list };
  } catch (error) {
    logger.error('badges_get_failed', {}, error);
    return { success: false, error: 'No se pudieron cargar las insignias' };
  }
}

export async function activateChallenge(templateId: string) {
  try {
    const v = validate(ActivateChallengeSchema, { templateId });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const template = getTemplate(templateId);
    if (!template) return { success: false, error: 'Desafio no encontrado' };

    const existing = await db.query.challenges.findFirst({
      where: and(
        eq(challenges.userId, userId),
        eq(challenges.templateId, templateId),
        eq(challenges.status, 'active'),
      ),
    });
    if (existing) return { success: false, error: 'Ya tenes este desafio activo' };

    await db.insert(challenges).values({
      id: randomUUID(),
      userId,
      templateId,
      status: 'active',
      currentDay: 1,
      progressJson: JSON.stringify({}),
      startedAt: new Date().toISOString(),
    });

    revalidatePath('/challenges');
    return { success: true };
  } catch (error) {
    logger.error('challenges_activate_failed', {}, error);
    return { success: false, error: 'No se pudo activar el desafio' };
  }
}

export async function validateActiveChallenges(entry: any, user: any) {
  try {
    const activeChallenges = await db.query.challenges.findMany({
      where: and(
        eq(challenges.userId, user.id),
        eq(challenges.status, 'active'),
      ),
    });

    let badgeUnlocked: string | null = null;

    for (const ch of activeChallenges) {
      const template = getTemplate(ch.templateId);
      if (!template) continue;

      const today = new Date().toISOString().split('T')[0];
      const progress: Record<string, boolean> = safeJsonParse<Record<string, boolean>>(
        ch.progressJson,
        {},
      );
      const todayKey = `day_${ch.currentDay}`;

      if (template.check(entry, user)) {
        progress[todayKey] = true;
        const newDay = ch.currentDay + 1;
        const isCompleted = newDay > template.days;

        if (isCompleted) {
          await db.update(challenges)
            .set({
              status: 'completed',
              currentDay: newDay,
              progressJson: JSON.stringify(progress),
              completedAt: new Date().toISOString(),
            })
            .where(eq(challenges.id, ch.id));

          await unlockBadge(user.id, template);
          badgeUnlocked = template.badgeIcon;
        } else {
          await db.update(challenges)
            .set({ currentDay: newDay, progressJson: JSON.stringify(progress) })
            .where(eq(challenges.id, ch.id));
        }
      } else {
        const failCount = Object.values(progress).filter((v) => v === false).length + 1;
        progress[todayKey] = false;

        if (failCount >= 3) {
          await db.update(challenges)
            .set({ status: 'abandoned', progressJson: JSON.stringify(progress) })
            .where(eq(challenges.id, ch.id));
        } else {
          await db.update(challenges)
            .set({ progressJson: JSON.stringify(progress) })
            .where(eq(challenges.id, ch.id));
        }
      }
    }

    return { success: true, badgeUnlocked };
  } catch (error) {
    logger.error('challenges_validate_failed', {}, error);
    return { success: false };
  }
}

async function unlockBadge(userId: string, template: ChallengeTemplate) {
  const existing = await db.query.badges.findFirst({
    where: and(eq(badges.userId, userId), eq(badges.badgeId, template.id)),
  });
  if (existing) return;

  await db.insert(badges).values({
    id: randomUUID(),
    userId,
    badgeId: template.id,
    area: template.area,
    mineral: template.mineral,
    unlockedAt: new Date().toISOString(),
  });

  await checkHiddenChallenges(userId);
}

async function checkHiddenChallenges(userId: string) {
  const allBadges = await db.query.badges.findMany({
    where: eq(badges.userId, userId),
  });

  const badgeIds = new Set(allBadges.map((b) => b.badgeId));
  const completed = await db.query.challenges.findMany({
    where: and(eq(challenges.userId, userId), eq(challenges.status, 'completed')),
  });

  const hiddenChecks: Record<string, () => boolean> = {
    'oculto-trinidad': () =>
      badgeIds.has('fe-oro') && badgeIds.has('identidad-oro') && badgeIds.has('disciplina-oro'),
    'oculto-imperio-integral': () =>
      badgeIds.has('negocio-oro') && badgeIds.has('mente-oro') && badgeIds.has('relaciones-oro'),
    'oculto-equilibrio': () =>
      badgeIds.has('cuerpo-oro') && badgeIds.has('mente-oro') && badgeIds.has('fe-oro'),
    'oculto-milagro': () => badgeIds.has('negocio-diamante'),
    'oculto-titan': () =>
      badgeIds.has('disciplina-legendario') || badgeIds.has('fe-legendario') ||
      badgeIds.has('cuerpo-legendario') || badgeIds.has('negocio-legendario') ||
      badgeIds.has('mente-legendario') || badgeIds.has('identidad-legendario') ||
      badgeIds.has('relaciones-legendario') || badgeIds.has('legado-legendario'),
    'oculto-arquitecto': () => {
      const areas = ['disciplina', 'identidad', 'fe', 'cuerpo', 'negocio', 'mente', 'relaciones', 'legado'];
      return areas.every((area) => badgeIds.has(`${area}-plata`));
    },
    'oculto-elegido': () => completed.length >= 40,
  };

  for (const [hiddenId, check] of Object.entries(hiddenChecks)) {
    if (!badgeIds.has(hiddenId) && check()) {
      const template = getTemplate(hiddenId);
      if (template) {
        await db.insert(badges).values({
          id: randomUUID(),
          userId,
          badgeId: hiddenId,
          area: 'oculto',
          mineral: 'especial',
          unlockedAt: new Date().toISOString(),
        });
      }
    }
  }
}


