'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface PrecisoHabit {
  id: string;
  name: string;
  ifTrigger?: string | null;
  ifAction?: string | null;
  triggerHitCount?: number;
  actionExecutedCount?: number;
  currentStrength?: number;
}

export function HabitCardPreciso({ habit }: { habit: PrecisoHabit }) {
  const [expanded, setExpanded] = useState(false);
  const hits = habit.triggerHitCount ?? 0;
  const executed = habit.actionExecutedCount ?? 0;
  const rate = hits > 0 ? Math.round((executed / hits) * 100) : 0;

  return (
    <div className="border-l-4 border-l-sky-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🎯 Preciso
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
        Cuando <strong>{habit.ifTrigger}</strong> → <strong>{habit.ifAction}</strong>
      </p>

      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Target className="h-3 w-3" />
        <span>Ejecución: <strong className="text-stone-700 dark:text-stone-300">{rate}%</strong></span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1 text-xs text-stone-500">
          <p>📊 Se presentó: {hits} veces</p>
          <p>✅ Ejecutado: {executed} veces</p>
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>
    </div>
  );
}
