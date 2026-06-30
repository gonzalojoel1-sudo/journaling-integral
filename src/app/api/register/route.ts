import { NextResponse } from 'next/server';
import { db } from '../../../../db/db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { scryptSync } from 'crypto';

function hashPassword(password: string): string {
  const salt = 'journaling-integral-salt-key';
  return scryptSync(password, salt, 64).toString('hex');
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    // Comprobar si el email ya existe
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
    console.error('Error al registrar usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}