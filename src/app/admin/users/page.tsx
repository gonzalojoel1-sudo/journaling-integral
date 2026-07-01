import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { db } from '../../../db/db';
import { users, dailyEntries, habits } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { AdminUsersClient } from './AdminUsersClient';

export default async function AdminUsersPage() {
  // 1. BLOQUEO ESTRICTO DEL SERVIDOR: Si no es el Administrador, se expulsa inmediatamente
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== 'joel@journalingintegral.demo') {
    redirect('/');
  }

  // 2. CONSULTAR TODOS LOS USUARIOS REGISTRADOS
  const allUsers = await db.query.users.findMany({
    orderBy: [users.createdAt]
  });

  const usersWithStats = [];

  // 3. CALCULAR MÉTRICAS DE COOPERACIÓN Y USO POR USUARIO
  for (const u of allUsers) {
    // Consultar las entradas de diario de este usuario
    const entries = await db.select({
      id: dailyEntries.id,
      devotionalNotes: dailyEntries.devotionalNotes,
      bizActionsSpecific: dailyEntries.bizActionsSpecific,
    })
    .from(dailyEntries)
    .where(eq(dailyEntries.userId, u.id));

    // Consultar catálogo de hábitos activos
    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, u.id)
    });

    const totalEntries = entries.length;
    
    // Contar cuántas veces usaron la sección devocional
    const devotionalsCompleted = entries.filter(e => e.devotionalNotes && e.devotionalNotes.trim() !== '').length;
    
    // Contar cuántas veces usaron el módulo de negocio 1-1-1
    const businessCompleted = entries.filter(e => e.bizActionsSpecific && e.bizActionsSpecific.includes('completed')).length;

    usersWithStats.push({
      id: u.id,
      name: u.name,
      email: u.email,
      currentLevel: u.currentLevel,
      streakCurrent: u.streakCurrent,
      streakMax: u.streakMax,
      createdAt: u.createdAt,
      stats: {
        totalEntries,
        devotionalsCompleted,
        businessCompleted,
        habitsCount: userHabits.length
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-850 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Panel de Control de Usuarios
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Administración oficial del SaaS: Monitorea el uso de los módulos y las métricas de engagement.
        </p>
      </header>

      <AdminUsersClient users={usersWithStats} />
    </div>
  );
}