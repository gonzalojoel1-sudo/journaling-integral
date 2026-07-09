import React from 'react';
import { serverFetch } from '@/lib/server-fetch';
import { JournalForm } from './JournalForm';

export default async function JournalPage() {
  const profileRes = await serverFetch('/api/auth/me');
  const user = profileRes.data;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error al cargar el perfil del usuario para el diario.</p>
      </div>
    );
  }

  // 1. Obtener hábitos activos del catálogo del usuario
  const habitsRes = await serverFetch('/api/habits');
  const habitsList = habitsRes.data || [];

  // 2. Verificar si ya existe un registro para hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const analyticsRes = await serverFetch('/api/journal/analytics');
  const entries = analyticsRes.data || [];
  const existingEntry = entries.find((e: any) => e.date === todayStr) || null;

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-850 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Diario del Día
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {existingEntry 
            ? 'Modo Edición: Actualiza tus pautas y registros para hoy.' 
            : 'Completa tu autoevaluación consciente y alinea tu día.'}
        </p>
      </header>

      <JournalForm 
        userLevel={user.currentLevel} 
        existingEntry={existingEntry || null}
        habitsList={habitsList}
      />
    </div>
  );
}