import { Hono } from 'hono';
import { db } from '../db';
import { habits } from '@journaling/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createHabitSchema } from '@journaling/shared';

export const habitsRoutes = new Hono();

habitsRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const list = await db.query.habits.findMany({
      where: and(eq(habits.userId, userId), eq(habits.isActive, 1)),
    });
    return c.json({ success: true, data: list });
  } catch (error) {
    console.error('Error al obtener habitos:', error);
    return c.json({ success: false, error: 'No se pudo cargar la lista de habitos' }, 500);
  }
});

habitsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createHabitSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Datos invalidos' }, 400);
    }

    const userId = c.get('userId');
    const { name, type, strategyDetails } = parsed.data;

    await db.insert(habits).values({
      id: randomUUID(),
      userId,
      name,
      type,
      strategyDetails,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error al crear habito:', error);
    return c.json({ success: false, error: 'Ocurrio un error al guardar el habito' }, 500);
  }
});

habitsRoutes.delete('/:id', async (c) => {
  try {
    const habitId = c.req.param('id');
    await db.update(habits).set({ isActive: 0 }).where(eq(habits.id, habitId));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error al archivar habito:', error);
    return c.json({ success: false, error: 'No se pudo completar la operacion' }, 500);
  }
});
