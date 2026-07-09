import { Hono } from 'hono';
import { db } from '../db';
import { users } from '@journaling/shared/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID, scryptSync } from 'crypto';
import { authMiddleware } from '../middleware/auth';
import { registerSchema, updateLevelSchema } from '@journaling/shared';
import { DEMO_USER_ID, DEMO_USER_EMAIL, DEMO_USER_NAME, DEMO_USER_PASSWORD_HASH } from '@journaling/shared';

export const authRoutes = new Hono();

authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Datos invalidos' }, 400);
    }

    const { name, email, password } = parsed.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existingUser) {
      return c.json({ success: false, error: 'El correo ya esta registrado' }, 400);
    }

    const salt = 'journaling-integral-salt-key';
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');

    await db.insert(users).values({
      id: randomUUID(),
      name,
      email,
      password: hashedPassword,
      currentLevel: 1,
      streakCurrent: 0,
      streakMax: 0,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') || DEMO_USER_ID;

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

    return c.json({ success: true, data: user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return c.json({ success: false, error: 'No se pudo cargar el perfil' }, 500);
  }
});

authRoutes.patch('/level', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = updateLevelSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Nivel invalido' }, 400);
    }

    const userId = c.get('userId') || DEMO_USER_ID;
    await db.update(users).set({ currentLevel: parsed.data.level }).where(eq(users.id, userId));

    return c.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar nivel:', error);
    return c.json({ success: false, error: 'No se pudo actualizar el nivel' }, 500);
  }
});
