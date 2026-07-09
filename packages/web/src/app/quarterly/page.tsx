import React from 'react';
import { serverFetch } from '@/lib/api-client';
import { QuarterlyPlanForm } from './QuarterlyPlanForm';

export default async function QuarterlyPlanPage() {
  const profileRes = await serverFetch('/api/auth/me');
  const user = profileRes.data;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error al cargar el perfil del usuario para la planeación.</p>
      </div>
    );
  }

  // Consultar plan trimestral activo
  const res = await serverFetch('/api/planning/quarterly');
  const activePlan = res.data;

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-850 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Planeamiento Trimestral
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          "Ejecuta más, planea menos. El poder es la acción." Define tus metas estratégicas del período.
        </p>
      </header>

      {/* Pasar el nivel del usuario para modular la visualización */}
      <QuarterlyPlanForm initialPlan={activePlan} userLevel={user.currentLevel} />
    </div>
  );
}