import { db } from '../db/db';
import { badges, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const ESCALONES = [
  { days: 7, id: 'escalon-7', name: 'Primer Paso' },
  { days: 14, id: 'escalon-14', name: 'Ritmo' },
  { days: 30, id: 'escalon-30', name: 'Hábito' },
  { days: 60, id: 'escalon-60', name: 'Propósito' },
  { days: 90, id: 'escalon-90', name: 'Maestría' },
  { days: 180, id: 'escalon-180', name: 'Constancia' },
  { days: 270, id: 'escalon-270', name: 'Identidad' },
  { days: 365, id: 'escalon-365', name: 'Legado' },
];

const AREA_ESCALONES = [7, 14, 30, 60, 90];

const AREAS = [
  { key: 'fe', check: (e: any) => !!e.devotionalNotes },
  { key: 'negocio', check: (e: any) => e.bizSalesCount > 0 || e.bizProspectCompleted },
  { key: 'mente', check: (e: any) => !!e.autoeducation },
  { key: 'relaciones', check: (e: any) => !!e.gratitude1 },
  { key: 'cuerpo', check: (e: any) => (e.sleepRating || 0) >= 7 || (e.energyRating || 0) >= 7 },
  { key: 'identidad', check: (e: any) => !!e.chooseToBeIdentity },
  { key: 'legado', check: (e: any) => !!e.legacyReflection },
];

export function getEscalonByDays(days: number) {
  return ESCALONES.find(e => e.days === days);
}

export function getCurrentEscalon(streak: number) {
  let last = ESCALONES[0];
  for (const e of ESCALONES) {
    if (streak >= e.days) last = e;
    else break;
  }
  return last;
}

export function getNextEscalon(streak: number) {
  return ESCALONES.find(e => e.days > streak) || null;
}

export async function autoActivateChallenges(userId: string, entry: any) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;
  const streak = user.streakCurrent || 0;

  const allUserBadges = await db.query.badges.findMany({
    where: eq(badges.userId, userId),
  });
  const badgeIds = new Set(allUserBadges.map(b => b.badgeId));

  const areaBadgesByArea = new Map<string, Set<string>>();
  for (const b of allUserBadges) {
    let bucket = areaBadgesByArea.get(b.area);
    if (!bucket) {
      bucket = new Set<string>();
      areaBadgesByArea.set(b.area, bucket);
    }
    bucket.add(b.badgeId);
  }

  for (const e of ESCALONES) {
    if (streak >= e.days && !badgeIds.has(e.id)) {
      await db.insert(badges).values({
        id: randomUUID(),
        userId,
        badgeId: e.id,
        area: 'diario',
        mineral: 'escalon',
        unlockedAt: new Date().toISOString(),
      });
      badgeIds.add(e.id);
    }
  }

  for (const area of AREAS) {
    if (!area.check(entry)) continue;
    const existingBadgeIds = areaBadgesByArea.get(area.key) ?? new Set<string>();

    for (const dias of AREA_ESCALONES) {
      const badgeId = `${area.key}-${dias}`;
      if (existingBadgeIds.has(badgeId)) continue;

      const prevTier = AREA_ESCALONES.filter(d => d < dias).pop() || 0;
      const prevBadgeId = prevTier ? `${area.key}-${prevTier}` : null;
      const hasPrev = prevBadgeId ? existingBadgeIds.has(prevBadgeId) : true;
      if (!prevTier || hasPrev) {
        const minDaysForThis = dias - prevTier;
        if (streak >= minDaysForThis) {
          await db.insert(badges).values({
            id: randomUUID(),
            userId,
            badgeId,
            area: area.key,
            mineral: 'escalon',
            unlockedAt: new Date().toISOString(),
          });
          existingBadgeIds.add(badgeId);
        }
      }
    }
  }
}