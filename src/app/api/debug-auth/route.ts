import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { scryptSync } from 'crypto';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // 1. Check env vars
    results.tursoUrlSet = !!process.env.TURSO_DATABASE_URL;
    results.tursoTokenSet = !!process.env.TURSO_AUTH_TOKEN;
    results.tursoUrlPrefix = process.env.TURSO_DATABASE_URL?.substring(0, 20) + '...';
    results.nextAuthSecretSet = !!process.env.NEXTAUTH_SECRET;
    results.nextAuthUrlSet = !!process.env.NEXTAUTH_URL;
  } catch (e) {
    results.envError = (e as Error).message;
  }

  try {
    // 2. Try to query users
    const allUsers = await db.query.users.findMany();
    results.userCount = allUsers.length;
    results.users = allUsers.map(u => ({ id: u.id, email: u.email, name: u.name }));
  } catch (e) {
    results.queryError = (e as Error).message;
    results.queryStack = (e as Error).stack?.substring(0, 500);
  }

  try {
    // 3. Try to find the demo user
    const demoUser = await db.query.users.findFirst({
      where: eq(users.email, 'joel@journalingintegral.demo'),
    });
    results.demoUserFound = !!demoUser;
    if (demoUser) {
      // 4. Verify password hash
      const salt = 'journaling-integral-salt-key';
      const inputHash = scryptSync('admin123', salt, 64).toString('hex');
      results.passwordMatch = demoUser.password === inputHash;
      results.storedHashPrefix = demoUser.password.substring(0, 10) + '...';
    }
  } catch (e) {
    results.demoUserError = (e as Error).message;
  }

  return NextResponse.json(results);
}
