import React from 'react';
import { getActiveQuarterlyPlan } from '../actions/journal';
import { QuarterlyPlanForm } from './QuarterlyPlanForm';

export default async function QuarterlyPlanPage() {
  // Consultar plan trimestral activo
  const res = await getActiveQuarterlyPlan();
  const activePlan = res.plan;

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Planeamiento Trimestral
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          "Ejecuta más, planea menos. El poder es la acción." Define tus objetivos estratégicos y planes de acción concretos.
        </p>
      </header>

      <QuarterlyPlanForm initialPlan={activePlan} />
    </div>
  );
}