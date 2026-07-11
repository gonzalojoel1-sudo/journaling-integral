import React from 'react';
import { getActiveHabits } from '../actions/habits';
import { HabitsClient } from './HabitsClient';

export const dynamic = 'force-dynamic';

export default async function HabitsPage() {
  // Obtener hábitos activos del usuario demo
  const res = await getActiveHabits();
  const initialHabits = (res.habits || []).map(h => ({
    ...h,
    currentStrength: h.currentStrength ?? 0,
    lastStrengthDate: h.lastStrengthDate ?? null,
  }));

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Gestor de Hábitos EOR
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Diseña tu comportamiento mediante el protocolo de hábitos atómicos: 
          <strong> Estandarizar, Optimizar y Reemplazar</strong>.
        </p>
      </header>

      <HabitsClient initialHabits={initialHabits} />
    </div>
  );
}