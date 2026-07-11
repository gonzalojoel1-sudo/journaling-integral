'use client';

import React from 'react';
import { Brain } from 'lucide-react';

interface StepIdentidadProps {
  chooseToBeIdentity: string;
  setChooseToBeIdentity: (v: string) => void;
  identityAction: string;
  setIdentityAction: (v: string) => void;
  dailyMicroAchievement: string;
  setDailyMicroAchievement: (v: string) => void;
}

export function StepIdentidad({
  chooseToBeIdentity,
  setChooseToBeIdentity,
  identityAction,
  setIdentityAction,
  dailyMicroAchievement,
  setDailyMicroAchievement,
}: StepIdentidadProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
            Hoy elijo SER:
          </label>
          <input
            type="text"
            value={chooseToBeIdentity}
            onChange={(e) => setChooseToBeIdentity(e.target.value)}
            placeholder="Ej. PACIENTE, GENEROSO, ENFOCADO"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
            Acción específica de identidad:
          </label>
          <input
            type="text"
            value={identityAction}
            onChange={(e) => setIdentityAction(e.target.value)}
            placeholder="Acción concreta que sustenta la elección"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
          Logro del día de hoy (aunque sea pequeño):
        </label>
        <input
          type="text"
          value={dailyMicroAchievement}
          onChange={(e) => setDailyMicroAchievement(e.target.value)}
          placeholder="Micro-victoria celebrada"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>
    </div>
  );
}

export function getIdentidadSummary(identity: string): string {
  if (!identity) return 'Sin identidad definida';
  return `SER: ${identity}`;
}
