import React from 'react';
import { getAnalyticsData } from '../actions/daily-journal';
import { HistoryClient } from './HistoryClient';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  // Cargar las entradas históricas de los últimos 30 días
  const res = await getAnalyticsData();
  const entries = res.entries || [];

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Bitácora de Legado
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Consulta tus devocionales de días anteriores y descárgalos individualmente en PDF estructurados para impresión.
        </p>
      </header>

      <HistoryClient initialEntries={entries} />
    </div>
  );
}