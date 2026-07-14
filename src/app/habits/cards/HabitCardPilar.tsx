'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, CheckCircle } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface PilarHabit {
  id: string;
  name: string;
  domain?: string | null;
  currentStrength?: number;
  pilarCompleted?: number;
}

const domainLabels: Record<string, string> = {
  cuerpo: 'Cuerpo', mente: 'Mente', trabajo: 'Trabajo',
  relaciones: 'Relaciones', hogar: 'Hogar', espiritual: 'Espiritual', finanzas: 'Finanzas',
};

export function HabitCardPilar({ habit }: { habit: PilarHabit }) {
  const [expanded, setExpanded] = useState(false);
  const completed = habit.pilarCompleted === 1;

  return (
    <div className={`border-l-4 border-l-violet-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md ${
      completed ? 'shadow-emerald-500/20 shadow-lg border-emerald-500/30' : ''
    }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🏛️ Pilar · Hábito Clave
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-block text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
          🏛️ Clave
        </span>
        {completed && (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            <CheckCircle className="h-3 w-3" />
            Día completo
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          <p>⚡ Al completarlo hoy, fortalece todos los hábitos de <strong>{domainLabels[habit.domain || ''] || 'su dominio'}</strong></p>
          <p>🏛️ Este hábito se completa automáticamente cuando cumples todos tus otros hábitos del día.</p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Zap className="h-3 w-3" />
            <span>Efecto dominó activo</span>
          </div>
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>
    </div>
  );
}
