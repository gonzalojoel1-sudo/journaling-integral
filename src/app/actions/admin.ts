'use server';

import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
}

export async function adminDeleteUser(userId: string) {
  await checkAdmin();
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}

export async function adminSetRole(userId: string, role: 'admin' | 'user') {
  await checkAdmin();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}
