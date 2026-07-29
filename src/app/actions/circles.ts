'use server';

import { db } from '../../db/db';
import { circles, circleMembers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';
import { logger } from '@/lib/logger';
import {
  validate,
  CreateCircleSchema,
  GenerateInviteSchema,
  JoinCircleSchema,
} from '@/lib/validations';

const MAX_CIRCLE_SIZE = 3;

export async function createCircle(name?: string) {
  try {
    const v = validate(CreateCircleSchema, { name });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const existing = await db.query.circles.findFirst({
      where: eq(circles.createdBy, userId),
    });
    if (existing) return { success: false, error: 'Ya tienes un círculo.' };

    const id = randomUUID();
    await db.insert(circles).values({
      id,
      name: v.data.name,
      createdBy: userId,
      visibilitySettings: 'only_streak',
      createdAt: new Date().toISOString(),
    });

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

    const userId = await getCurrentUserId();
    const circle = await db.query.circles.findFirst({
      where: and(eq(circles.id, circleId), eq(circles.createdBy, userId)),
    });
    if (!circle) return { success: false, error: 'Acceso denegado.' };

    const memberCount = await db.query.circleMembers.findMany({
      where: and(eq(circleMembers.circleId, circleId), eq(circleMembers.status, 'active')),
    });
    if (memberCount.length >= MAX_CIRCLE_SIZE - 1) {
      return { success: false, error: 'Círculo completo (máx 3 personas).' };
    }

    const inviteCode = randomUUID().slice(0, 8);
    await db.insert(circleMembers).values({
      id: randomUUID(),
      circleId,
      userId: '',
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

    const userId = await getCurrentUserId();
    const member = await db.query.circleMembers.findFirst({
      where: eq(circleMembers.inviteCode, inviteCode),
      with: { circle: true },
    });
    if (!member) return { success: false, error: 'Invitación inválida.' };
    if (member.status === 'active') return { success: false, error: 'Código ya usado.' };

    const activeMembers = await db.query.circleMembers.findMany({
      where: and(eq(circleMembers.circleId, member.circleId), eq(circleMembers.status, 'active')),
    });
    if (activeMembers.length >= MAX_CIRCLE_SIZE - 1) {
      return { success: false, error: 'Círculo completo.' };
    }

    await db.update(circleMembers)
      .set({ userId, status: 'active', joinedAt: new Date().toISOString() })
      .where(eq(circleMembers.id, member.id));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error('join_circle_failed', {}, error);
    return { success: false, error: 'Error al unirse al círculo' };
  }
}

export async function getCircleWidgetData() {
  try {
    const userId = await getCurrentUserId();
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

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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
    const userId = await getCurrentUserId();
    if (userId === targetUserId) return { success: false, error: 'No puedes animarte a ti mismo.' };
    logger.info('circle_encouragement_sent', { hasTarget: !!targetUserId });
    return { success: true };
  } catch (error) {
    logger.error('send_encouragement_failed', {}, error);
    return { success: false, error: 'Error al enviar el ánimo' };
  }
}