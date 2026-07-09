import React from 'react';
import { serverFetch } from '@/lib/server-fetch';
import { ReviewClient } from './ReviewClient';

export default async function ReviewPage() {
  const analyticsRes = await serverFetch('/api/journal/analytics');
  
  // Filtrar los registros de los últimos 7 días
  const entries = analyticsRes.data || [];
  const weeklyEntries = entries.slice(0, 7);

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Planificación y Reset Dominical
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          "No hago todo, hago lo que corresponde". Evalúa tu última semana y diseña tu próximo enfoque estratégico.
        </p>
      </header>

      <ReviewClient weeklyEntries={weeklyEntries} />
    </div>
  );
}