import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '../../../db/db';
import { users, dailyEntries, habits } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { AdminUsersClient } from './AdminUsersClient';
import { getUserRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const role = await getUserRole();

  if (role !== 'admin') {
    redirect('/');
  }

  const allUsers = await db.query.users.findMany({
    orderBy: [users.createdAt],
  });

  const usersWithStats = [];

  for (const u of allUsers) {
    const entries = await db.select({
      id: dailyEntries.id,
      devotionalNotes: dailyEntries.devotionalNotes,
      bizActionsSpecific: dailyEntries.bizActionsSpecific,
    })
    .from(dailyEntries)
    .where(eq(dailyEntries.userId, u.id));

    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, u.id),
    });

    const totalEntries = entries.length;
    const devotionalsCompleted = entries.filter(e => e.devotionalNotes && e.devotionalNotes.trim() !== '').length;
    const businessCompleted = entries.filter(e => e.bizActionsSpecific && e.bizActionsSpecific.includes('completed')).length;

    usersWithStats.push({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      currentLevel: u.currentLevel,
      streakCurrent: u.streakCurrent,
      streakMax: u.streakMax,
      createdAt: u.createdAt,
      stats: {
        totalEntries,
        devotionalsCompleted,
        businessCompleted,
        habitsCount: userHabits.length,
      },
    });
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-850 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Panel de Control de Usuarios
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Administración de usuarios y roles
        </p>
      </header>

      <AdminUsersClient users={usersWithStats} />
    </div>
  );
}
