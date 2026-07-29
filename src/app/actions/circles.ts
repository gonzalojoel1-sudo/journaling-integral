'use server';

import { db } from '../../db/db';
import { circles, circleMembers } from '../../db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireCurrentUserId } from './auth';
import { logger } from '@/lib/logger';
import {
  validate,
  CreateCircleSchema,
  GenerateInviteSchema,
  JoinCircleSchema,
} from '@/lib/validations';
import { todayStr, yesterdayStr } from '@/lib/dates';

const MAX_CIRCLE_SIZE = 3;
const INVITE_CODE_BYTES = 8;

export async function createCircle(name?: string) {
  try {
    const v = validate(CreateCircleSchema, { name });
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();

    const existing = await db.query.circles.findFirst({
      where: eq(circles.createdBy, userId),
    });
    if (existing) {
      return { success: true, circleId: existing.id, alreadyExisted: true };
    }

    const id = randomUUID();
    try {
      await db.insert(circles).values({
        id,
        name: v.data.name,
        createdBy: userId,
        visibilitySettings: 'only_streak',
        createdAt: new Date().toISOString(),
      });
    } catch (insertErr) {
      const reCheck = await db.query.circles.findFirst({
        where: eq(circles.createdBy, userId),
      });
      if (reCheck) {
        return { success: true, circleId: reCheck.id, alreadyExisted: true };
      }
      throw insertErr;
    }

    revalidatePath('/');
    return { success: true, circleId: id };
  } catch (error) {
    logger.error('create_circle_failed', {}, error);
    return { success: false, error: 'Error al crear el círculo' };
  }
}

export async function generateInvite(circleId: string) {
  try {
    const v = validate(GenerateInviteSchema, { circleId });
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();
    const circle = await db.query.circles.findFirst({
      where: and(eq(circles.id, circleId), eq(circles.createdBy, userId)),
    });
    if (!circle) return { success: false, error: 'Acceso denegado.' };

    const activeMembers = await db.query.circleMembers.findMany({
      where: and(eq(circleMembers.circleId, circleId), eq(circleMembers.status, 'active')),
    });
    if (activeMembers.length >= MAX_CIRCLE_SIZE - 1) {
      return { success: false, error: 'Círculo completo (máx 3 personas).' };
    }

    const inviteCode = randomBytes(INVITE_CODE_BYTES).toString('hex');
    await db.insert(circleMembers).values({
      id: randomUUID(),
      circleId,
      userId: null,
      invitedBy: userId,
      status: 'pending',
      inviteCode,
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/circles/invite?code=${inviteCode}`;
    return { success: true, inviteCode, url };
  } catch (error) {
    logger.error('generate_invite_failed', { circleId }, error);
    return { success: false, error: 'Error al generar la invitación' };
  }
}

export async function joinCircle(inviteCode: string) {
  try {
    const v = validate(JoinCircleSchema, { code: inviteCode });
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();
    const member = await db.query.circleMembers.findFirst({
      where: and(
        eq(circleMembers.inviteCode, v.data.code),
        or(isNull(circleMembers.userId), eq(circleMembers.userId, userId)),
      ),
      with: { circle: true },
    });

    if (!member) {
      return { success: false, error: 'Código inválido o ya usado.' };
    }

    if (member.userId === userId) {
      return { success: true, alreadyJoined: true, circleId: member.circleId };
    }

    const activeMembers = await db.query.circleMembers.findMany({
      where: and(eq(circleMembers.circleId, member.circleId), eq(circleMembers.status, 'active')),
    });
    if (activeMembers.length >= MAX_CIRCLE_SIZE - 1) {
      return { success: false, error: 'Círculo completo.' };
    }

    const updateResult = await db.update(circleMembers)
      .set({ userId, status: 'active', joinedAt: new Date().toISOString() })
      .where(and(eq(circleMembers.id, member.id), isNull(circleMembers.userId)));

    revalidatePath('/');
    if (updateResult.rowsAffected === 0) {
      const reCheck = await db.query.circleMembers.findFirst({
        where: and(
          eq(circleMembers.inviteCode, v.data.code),
          eq(circleMembers.userId, userId),
        ),
      });
      if (reCheck) {
        return { success: true, alreadyJoined: true, circleId: reCheck.circleId };
      }
      return { success: false, error: 'Código ya usado.' };
    }

    return { success: true };
  } catch (error) {
    logger.error('join_circle_failed', {}, error);
    return { success: false, error: 'Error al unirse al círculo' };
  }
}

export async function getCircleWidgetData() {
  try {
    const userId = await requireCurrentUserId();
    const myCircle = await db.query.circles.findFirst({
      where: eq(circles.createdBy, userId),
    });
    if (!myCircle) return { success: true, circle: null, members: [] };

    const members = await db.query.circleMembers.findMany({
      where: and(eq(circleMembers.circleId, myCircle.id), eq(circleMembers.status, 'active')),
      with: {
        user: {
          columns: { id: true, name: true, streakCurrent: true, streakMax: true, lastEntryDate: true },
        },
      },
    });

    const today = todayStr();
    const yesterday = yesterdayStr();

    const enriched = members.map((m: any) => ({
      userId: m.user.id,
      name: m.user.name,
      streak: m.user.streakCurrent,
      maxStreak: m.user.streakMax,
      failedToday: m.user.lastEntryDate !== today && m.user.lastEntryDate !== yesterday,
      lastEntryDate: m.user.lastEntryDate,
    }));

    return { success: true, circle: myCircle, members: enriched };
  } catch (error) {
    logger.error('get_circle_widget_failed', {}, error);
    return { success: false, error: 'Error al cargar datos del círculo', circle: null, members: [] };
  }
}

export async function sendEncouragement(targetUserId: string) {
  try {
    const userId = await requireCurrentUserId();
    if (userId === targetUserId) return { success: false, error: 'No puedes animarte a ti mismo.' };
    logger.info('circle_encouragement_sent', { hasTarget: !!targetUserId });
    return { success: true };
  } catch (error) {
    logger.error('send_encouragement_failed', {}, error);
    return { success: false, error: 'Error al enviar el ánimo' };
  }
}