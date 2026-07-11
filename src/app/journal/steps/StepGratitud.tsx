'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface StepGratitudProps {
  gratitude1: string;
  setGratitude1: (v: string) => void;
  gratitude2: string;
  setGratitude2: (v: string) => void;
  gratitude3: string;
  setGratitude3: (v: string) => void;
  wisdomRequest: string;
  setWisdomRequest: (v: string) => void;
}

export function StepGratitud({
  gratitude1,
  setGratitude1,
  gratitude2,
  setGratitude2,
  gratitude3,
  setGratitude3,
  wisdomRequest,
  setWisdomRequest,
}: StepGratitudProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
          Hoy agradezco a Dios por:
        </label>
        <input
          type="text"
          value={gratitude1}
          onChange={(e) => setGratitude1(e.target.value)}
          placeholder="1. Primer agradecimiento sincero"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        <input
          type="text"
          value={gratitude2}
          onChange={(e) => setGratitude2(e.target.value)}
          placeholder="2. Segundo agradecimiento"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        <input
          type="text"
          value={gratitude3}
          onChange={(e) => setGratitude3(e.target.value)}
          placeholder="3. Tercer agradecimiento"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
          Pido sabiduría para:
        </label>
        <input
          type="text"
          value={wisdomRequest}
          onChange={(e) => setWisdomRequest(e.target.value)}
          placeholder="Ej. Tomar decisiones difíciles en la reunión"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>
    </div>
  );
}

export function getGratitudSummary(g1: string, g2: string, g3: string): string {
  const items = [g1, g2, g3].filter(Boolean);
  if (items.length === 0) return 'Sin agradecimientos';
  if (items.length === 1) return `"${items[0].substring(0, 30)}${items[0].length > 30 ? '...' : ''}"`;
  return `${items.length} agradecimientos registrados`;
}
