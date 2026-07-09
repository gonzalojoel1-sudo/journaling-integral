'use server';

import { db } from '../../db/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/options';
import { cache } from 'react';
import {
  DEMO_USER_ID,
  DEMO_USER_EMAIL,
  DEMO_USER_NAME,
  DEMO_USER_PASSWORD_HASH,
} from '@/lib/constants';

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

export const getOrCreateUserProfile = cache(async () => {
  try {
    const userId = await getCurrentUserId();

    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      const existingByEmail = await db.query.users.findFirst({
        where: eq(users.email, DEMO_USER_EMAIL),
      });

      if (existingByEmail) {
        user = existingByEmail;
      } else {
        const newUser = {
          id: DEMO_USER_ID,
          name: DEMO_USER_NAME,
          email: DEMO_USER_EMAIL,
          password: DEMO_USER_PASSWORD_HASH,
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
