import React from 'react';
import { getAnalyticsData } from '../actions/daily-journal';
import { getActiveQuarterlyPlan } from '../actions/quarterly-planning';
import { getBadges } from '../actions/challenges';
import { ProgressClient } from './ProgressClient';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const analyticsRes = await getAnalyticsData();
  const entries = analyticsRes.entries || [];

  const planRes = await getActiveQuarterlyPlan();
  const activePlan = planRes.plan;

  const badgesRes = await getBadges();
  const badges = badgesRes.badges || [];

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Progreso y Analisis
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Visualiza tus metricas de bienestar, insignias desbloqueadas y tu planeamiento estrategico.
        </p>
      </header>

      <ProgressClient entries={entries} activePlan={activePlan} badges={badges} />
    </div>
  );
}