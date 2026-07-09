import React from 'react';
import { serverFetch } from '@/lib/api-client';
import { ProgressClient } from './ProgressClient';

export default async function ProgressPage() {
  // Obtener los datos históricos de los últimos 30 días
  const analyticsRes = await serverFetch('/api/journal/analytics');
  const entries = analyticsRes.data || [];

  // Obtener el plan trimestral activo para posibilitar su exportación
  const planRes = await serverFetch('/api/planning/quarterly');
  const activePlan = planRes.data;

  return (
    <div className="space-y-6">
      {/* Cabecera oculta al imprimir */}
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Progreso y Análisis
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Visualiza tus métricas de bienestar, correlaciones conductuales y exporta tu planeamiento estratégico trimestral.
        </p>
      </header>

      <ProgressClient entries={entries} activePlan={activePlan} />
    </div>
  );
}