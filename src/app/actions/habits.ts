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

export async function createHabit(data: {
  name: string;
  habitType: string;
  domain?: string;
  rescueAction: string;
  activeAction?: string;
  celebration?: string;
  anchor?: string;
  ifTrigger?: string;
  ifAction?: string;
  cue?: string;
  oldRoutine?: string;
  newRoutine?: string;
  identityLabel?: string;
  belongsToChainId?: string;
  nextHabitId?: string;
}) {
  try {
    const v = validate(CreateHabitSchema, data);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const defaultCelebration: Record<string, string> = {
      crecer: '✅ Hecho',
      sembrar: '',
      cambiar: '🔄 Avance',
      preciso: '🎯 Ejecutado',
      pilar: '🏛️ Un paso más',
    };

    const celebration = data.celebration || defaultCelebration[data.habitType] || '✅ Hecho';

    await db.insert(habits).values({
      id: randomUUID(),
      userId,
      name: data.name,
      habitType: data.habitType,
      domain: data.domain || null,
      rescueAction: data.rescueAction,
      activeAction: data.activeAction || data.rescueAction,
      celebration,
      anchor: data.anchor || null,
      ifTrigger: data.ifTrigger || null,
      ifAction: data.ifAction || null,
      cue: data.cue || null,
      oldRoutine: data.oldRoutine || null,
      newRoutine: data.newRoutine || null,
      identityLabel: data.identityLabel || null,
      belongsToChainId: data.belongsToChainId || null,
      nextHabitId: data.nextHabitId || null,
      currentStrength: 0.0,
      lastStrengthDate: null,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/habits');
    revalidatePath('/journal');
    revalidatePath('/');
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
    revalidatePath('/journal');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al archivar hábito:', error);
    return { success: false, error: 'No se pudo completar la operación.' };
  }
}

export async function triggerAutoRescue(habitId: string) {
  try {
    const userId = await getCurrentUserId();
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });
    if (!habit) return { success: false, error: 'Hábito no encontrado' };

    await db.update(habits)
      .set({ activeAction: habit.rescueAction })
      .where(eq(habits.id, habitId));

    revalidatePath('/habits');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error en auto-rescue:', error);
    return { success: false, error: 'No se pudo ejecutar el rescate.' };
  }
}
