import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { hashPassword } from '@/lib/password';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado.' }, { status: 400 });
    }

    const userId = randomUUID();
    const hashedPassword = hashPassword(password);

    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      currentLevel: 1,
      streakCurrent: 0,
      streakMax: 0,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('register_user_failed', { message: error?.message }, error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}