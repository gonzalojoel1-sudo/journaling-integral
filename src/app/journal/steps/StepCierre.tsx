'use client';

import React from 'react';

interface StepCierreProps {
  whatWorked: string;
  setWhatWorked: (v: string) => void;
  whatDidNotWork: string;
  setWhatDidNotWork: (v: string) => void;
  improvementIdea: string;
  setImprovementIdea: (v: string) => void;
  prep1: string;
  setPrep1: (v: string) => void;
  prep2: string;
  setPrep2: (v: string) => void;
  prep3: string;
  setPrep3: (v: string) => void;
}

export function StepCierre({
  whatWorked,
  setWhatWorked,
  whatDidNotWork,
  setWhatDidNotWork,
  improvementIdea,
  setImprovementIdea,
  prep1,
  setPrep1,
  prep2,
  setPrep2,
  prep3,
  setPrep3,
}: StepCierreProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
            ¿Qué funcionó bien hoy?
          </label>
          <input
            type="text"
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            placeholder="Lo que sí funcionó y quieres repetir"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
            ¿Qué no funcionó?
          </label>
          <input
            type="text"
            value={whatDidNotWork}
            onChange={(e) => setWhatDidNotWork(e.target.value)}
            placeholder="Lo que no funcionó y debes ajustar"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
            Idea de mejora para mañana:
          </label>
          <input
            type="text"
            value={improvementIdea}
            onChange={(e) => setImprovementIdea(e.target.value)}
            placeholder="Un ajuste concreto para ser 1% mejor"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 font-mono">
          3 cosas para preparar mañana:
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={prep1}
            onChange={(e) => setPrep1(e.target.value)}
            placeholder="1. Prioridad principal de mañana"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <input
            type="text"
            value={prep2}
            onChange={(e) => setPrep2(e.target.value)}
            placeholder="2. Segunda prioridad"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <input
            type="text"
            value={prep3}
            onChange={(e) => setPrep3(e.target.value)}
            placeholder="3. Tercera prioridad"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export function getCierreSummary(
  whatWorked: string,
  prep1: string
): string {
  const parts: string[] = [];
  if (whatWorked) parts.push(`✓ ${whatWorked.substring(0, 25)}${whatWorked.length > 25 ? '...' : ''}`);
  if (prep1) parts.push(`Mañana: ${prep1.substring(0, 20)}${prep1.length > 20 ? '...' : ''}`);
  return parts.length > 0 ? parts.join(' · ') : 'Sin registrar';
}
