'use server';

import { db } from '@/db/db';
import { users, dailyEntries, journalEmbeddings } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validate, AdminDeleteUserSchema, AdminSetRoleSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth';
import type { Role } from '@/lib/constants-domain';

async function checkAdmin() {
  await requireAdmin();
}

export async function adminDeleteUser(userId: string) {
  try {
    const v = validate(AdminDeleteUserSchema, { userId });
    if (!v.success) return { success: false, error: v.error };

    await checkAdmin();
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    logger.error('admin_delete_user_failed', { userId }, error);
    return { success: false, error: 'Error al eliminar usuario' };
  }
}

export async function adminSetRole(userId: string, role: Role) {
  try {
    const v = validate(AdminSetRoleSchema, { userId, role });
    if (!v.success) return { success: false, error: v.error };

    await checkAdmin();
    await db.update(users).set({ role }).where(eq(users.id, userId));
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    logger.error('admin_set_role_failed', { userId, role }, error);
    return { success: false, error: 'Error al cambiar rol' };
  }
}

// ============================================================
// TELEMETRY: System observability queries
// ============================================================

export interface TelemetryData {
  totalUsers: number;
  totalEntries: number;
  totalEmbeddings: number;
  recentEmbeddings: {
    id: string;
    entryId: string;
    content: string;
    createdAt: string;
  }[];
}

export async function getSystemTelemetry(): Promise<TelemetryData> {
  try {
    await checkAdmin();

    const [totalUsersResult] = await db.select({ value: count() }).from(users);
    const [totalEntriesResult] = await db.select({ value: count() }).from(dailyEntries);
    const [totalEmbeddingsResult] = await db.select({ value: count() }).from(journalEmbeddings);

    const recentEmbeddings = await db
      .select({
        id: journalEmbeddings.id,
        entryId: journalEmbeddings.entryId,
        content: journalEmbeddings.content,
        createdAt: journalEmbeddings.createdAt,
      })
      .from(journalEmbeddings)
      .orderBy(desc(journalEmbeddings.createdAt))
      .limit(10);

    return {
      totalUsers: totalUsersResult?.value ?? 0,
      totalEntries: totalEntriesResult?.value ?? 0,
      totalEmbeddings: totalEmbeddingsResult?.value ?? 0,
      recentEmbeddings,
    };
  } catch (error) {
    logger.error('get_system_telemetry_failed', {}, error);
    throw error;
  }
}