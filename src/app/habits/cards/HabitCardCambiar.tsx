'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface CambiarHabit {
  id: string;
  name: string;
  newRoutine?: string | null;
  oldRoutine?: string | null;
  victoryCount?: number;
  currentStrength?: number;
}

const VICTORY_TARGET = 30;

export function HabitCardCambiar({ habit }: { habit: CambiarHabit }) {
  const [expanded, setExpanded] = useState(false);
  const victories = habit.victoryCount ?? 0;
  const pct = Math.min(Math.round((victories / VICTORY_TARGET) * 100), 100);

  return (
    <div className="border-l-4 border-l-amber-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🔄 Nueva Ruta Neuronal
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            🏆 {victories}/{VICTORY_TARGET} victorias
          </span>
        </div>
        <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          <p>🧠 Nuevo camino: <span className="text-stone-700 dark:text-stone-300 font-medium">{habit.newRoutine}</span></p>
          <p>→ Has elegido tu nueva identidad {victories} veces</p>
          {victories >= VICTORY_TARGET && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">¡Has construido una nueva ruta neuronal! 🧠✨</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>
    </div>
  );
}
