'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { ICrecerHabit } from '@/types/habits';

const STREAK_TIERS = [
  { min: 0, icon: '🔥', label: 'Empezando' },
  { min: 7, icon: '🔥', label: 'Consistente' },
  { min: 14, icon: '🔥🔥', label: 'Disciplinado' },
  { min: 21, icon: '🔥🔥🔥', label: 'Imparable' },
  { min: 30, icon: '👑', label: 'Maestro' },
];

function getTier(streak: number) {
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_TIERS[i].min) return STREAK_TIERS[i];
  }
  return STREAK_TIERS[0];
}

export function HabitCardCrecer({ habit }: { habit: ICrecerHabit }) {
  const [expanded, setExpanded] = useState(false);
  const streak = habit.currentStreak ?? 0;
  const shields = habit.streakShields ?? 0;
  const tier = getTier(streak);

  return (
    <div className="border-l-4 border-l-stone-600 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            ⚡ Crecer · {tier.icon} {tier.label}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: shields }).map((_, i) => (
            <Shield key={i} className="h-4 w-4 text-amber-500" />
          ))}
          {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-2xl">{tier.icon}</span>
        <span className="font-bold text-stone-800 dark:text-stone-200">{streak} días seguidos</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          {habit.anchor && <p>🔗 Anclado a: <span className="text-stone-700 dark:text-stone-300">{habit.anchor}</span></p>}
          <p>🛡️ Escudos: {shields}/2 (1 cada 7 días)</p>
        </div>
      )}
    </div>
  );
}
