'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StrengthBar } from '@/components/StrengthBar';
import { archiveHabit } from '../actions/habits';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HabitCardSembrar } from './cards/HabitCardSembrar';
import { HabitCardCadena } from './cards/HabitCardCadena';
import { HabitCardCrecer } from './cards/HabitCardCrecer';
import { HabitCardCambiar } from './cards/HabitCardCambiar';
import { HabitCardPreciso } from './cards/HabitCardPreciso';

interface ChainStep {
  id: string;
  name: string;
  order: number;
}

interface HabitCardHabit {
  id: string;
  name: string;
  habitType?: string;
  domain?: string | null;
  activeAction?: string | null;
  rescueAction?: string | null;
  celebration?: string | null;
  anchor?: string | null;
  ifTrigger?: string | null;
  ifAction?: string | null;
  cue?: string | null;
  newRoutine?: string | null;
  identityLabel?: string | null;
  currentStrength?: number;
  chainId?: string;
  chainSteps?: ChainStep[];
}

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  crecer: { icon: '⚡', label: 'Crecer', color: 'border-l-stone-600' },
  sembrar: { icon: '🌱', label: 'Sembrar', color: 'border-l-emerald-500' },
  cambiar: { icon: '🔄', label: 'Cambiar', color: 'border-l-amber-500' },
  preciso: { icon: '🎯', label: 'Preciso', color: 'border-l-sky-500' },
  pilar: { icon: '🏛️', label: 'Pilar', color: 'border-l-violet-500' },
  cadena: { icon: '⛓️', label: 'Cadena', color: 'border-l-stone-400' },
};

const domainLabels: Record<string, string> = {
  cuerpo: 'Cuerpo', mente: 'Mente', trabajo: 'Trabajo',
  relaciones: 'Relaciones', hogar: 'Hogar', espiritual: 'Espiritual', finanzas: 'Finanzas',
};

export function HabitCard({ habit }: { habit: HabitCardHabit }) {
  if (habit.habitType === 'crecer') {
    return <HabitCardCrecer habit={habit} />;
  }

  if (habit.habitType === 'cadena') {
    return <HabitCardCadena habit={habit} />;
  }

  if (habit.habitType === 'sembrar') {
    return <HabitCardSembrar habit={habit} />;
  }

  if (habit.habitType === 'cambiar') {
    return <HabitCardCambiar habit={habit} />;
  }

  if (habit.habitType === 'preciso') {
    return <HabitCardPreciso habit={habit} />;
  }

  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const config = typeConfig[habit.habitType || ''] || typeConfig.crecer;

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Deseas archivar este hábito del catálogo activo?')) return;
    await archiveHabit(habit.id);
    router.refresh();
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`border-l-4 ${config.color} bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md ${isExpanded ? 'pb-5' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            {config.icon} {config.label}
            {habit.domain && <span className="ml-2 text-stone-300">· {domainLabels[habit.domain]}</span>}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleArchive} className="text-stone-400 hover:text-red-500 transition-colors shrink-0 p-1" title="Archivar">
            ✕
          </button>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-12'}`}>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-2 line-clamp-2">
          {habit.activeAction || habit.rescueAction}
        </p>
      </div>

      {/* Always visible details (compact) */}
      <div className={isExpanded ? '' : 'hidden'}>
        {habit.habitType === 'crecer' && habit.anchor && (
          <p className="text-xs text-stone-400">Después de: {habit.anchor}</p>
        )}
        {habit.habitType === 'sembrar' && habit.anchor && (
          <div className="text-xs text-stone-400 space-y-1">
            <p>Ancla: {habit.anchor}</p>
            {habit.celebration && <p>Celebración: {habit.celebration}</p>}
          </div>
        )}
        {habit.habitType === 'cambiar' && (
          <div className="text-xs text-stone-400 space-y-1">
            {habit.cue && <p>Disparador: {habit.cue}</p>}
            {habit.newRoutine && <p>Nueva rutina: {habit.newRoutine}</p>}
          </div>
        )}
        {habit.habitType === 'preciso' && habit.ifTrigger && (
          <p className="text-xs text-stone-400">Cuando {habit.ifTrigger} → {habit.ifAction}</p>
        )}
        {habit.habitType === 'pilar' && (
          <span className="inline-block text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
            Hábito clave
          </span>
        )}

        {habit.identityLabel && (
          <p className="text-xs text-stone-400 mt-1 italic">
            Te estás convirtiendo en una persona {habit.identityLabel}
          </p>
        )}

        {habit.rescueAction && (
          <div className="mt-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Versión mínima (día difícil)</p>
            <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">{habit.rescueAction}</p>
          </div>
        )}
      </div>

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
        {habit.celebration && (
          <p className="text-xs text-stone-400 mt-1 text-right">{habit.celebration}</p>
        )}
      </div>
    </div>
  );
}
