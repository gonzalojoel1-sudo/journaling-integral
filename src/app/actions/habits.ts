'use server';

import { db } from '../../db/db';
import { habits } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';
import { validate, CreateHabitSchema, ArchiveHabitSchema } from '@/lib/validations';

export async function getActiveHabits() {
  try {
    const userId = await getCurrentUserId();
    const list = await db.query.habits.findMany({
      where: and(eq(habits.userId, userId), eq(habits.isActive, 1)),
    });
    return { success: true, habits: list };
  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    return { success: false, error: 'No se pudo cargar la lista de hábitos.' };
  }
}

export async function createHabit(name: string, type: string, strategyDetails: string) {
  try {
    const v = validate(CreateHabitSchema, { name, type, strategyDetails });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    await db.insert(habits).values({
      id: randomUUID(),
      userId: userId,
      name,
      type,
      strategyDetails,
      currentStrength: 0.0,
      lastStrengthDate: null,
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

export async function archiveHabit(habitId: string) {
  try {
    const v = validate(ArchiveHabitSchema, { habitId });
    if (!v.success) return { success: false, error: v.error };

    await db.update(habits).set({ isActive: 0 }).where(eq(habits.id, habitId));
    revalidatePath('/habits');
    return { success: true };
  } catch (error) {
    console.error('Error al archivar hábito:', error);
    return { success: false, error: 'No se pudo completar la operación.' };
  }
}
