'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle2, Circle, Target, Sparkles } from 'lucide-react';
import { toggleHabitCompleted } from '@/app/actions/toggle-habit';
import { logger } from '@/lib/logger';

interface PriorityChecklistProps {
  mitSer: string | null;
  mitSerCompleted: boolean;
  mitNegocio: string | null;
  mitNegocioCompleted: boolean;
  mitRelaciones: string | null;
  mitRelacionesCompleted: boolean;
  weeklyDestrabeAction: string;
  weeklyFocus: string;
  prepTomorrowTasks: string[];
  hasEntryToday: boolean;
}

export function PriorityChecklist({
  mitSer,
  mitSerCompleted,
  mitNegocio,
  mitNegocioCompleted,
  mitRelaciones,
  mitRelacionesCompleted,
  weeklyDestrabeAction,
  prepTomorrowTasks,
  hasEntryToday,
}: PriorityChecklistProps) {
  const [checks, setChecks] = useState({
    ser: mitSerCompleted,
    negocio: mitNegocioCompleted,
    relaciones: mitRelacionesCompleted,
  });
  const [, startTransition] = useTransition();

  const toggleCheck = (key: 'ser' | 'negocio' | 'relaciones') => {
    setChecks((prev) => {
      const next = !prev[key];
      const kindMap = {
        ser: 'mitSer',
        negocio: 'mitNegocio',
        relaciones: 'mitRelaciones',
      } as const;
      startTransition(async () => {
        try {
          await toggleHabitCompleted({ kind: kindMap[key], completed: next });
        } catch (err) {
          logger.error('mit_toggle_persist_failed', { key }, err);
        }
      });
      return { ...prev, [key]: next };
    });
  };

  const completedCount = Object.values(checks).filter(Boolean).length;
  const totalCount = 3;

  return (
    <div className="surface-elevated p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Prioridades de Hoy
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
            {completedCount}/{totalCount} MITs completados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PriorityItem
          label="Ser"
          text={mitSer || 'Define tu MIT más importante para tu bienestar hoy'}
          checked={checks.ser}
          onToggle={() => toggleCheck('ser')}
          accentColor="sky"
          disabled={!hasEntryToday && !mitSer}
        />
        <PriorityItem
          label="Negocio"
          text={mitNegocio || '¿Cuál es la acción clave que moverá tu negocio hoy?'}
          checked={checks.negocio}
          onToggle={() => toggleCheck('negocio')}
          accentColor="emerald"
          disabled={!hasEntryToday && !mitNegocio}
        />
        <PriorityItem
          label="Relaciones"
          text={mitRelaciones || '¿A quién vas a nutrir con tiempo de calidad hoy?'}
          checked={checks.relaciones}
          onToggle={() => toggleCheck('relaciones')}
          accentColor="rose"
          disabled={!hasEntryToday && !mitRelaciones}
        />
      </div>

      {(weeklyDestrabeAction || prepTomorrowTasks.length > 0) && (
        <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-4">
          {weeklyDestrabeAction && (
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  Acción de Destrabe Semanal
                </p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium mt-0.5 truncate">
                  {weeklyDestrabeAction}
                </p>
              </div>
            </div>
          )}

          {prepTomorrowTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                Diseñado por ti anoche:
              </p>
              <div className="space-y-1.5">
                {prepTomorrowTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="h-4 w-4 rounded bg-zinc-200/60 dark:bg-zinc-800/60 flex items-center justify-center text-[9px] font-bold text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasEntryToday && !mitSer && (
        <div className="pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center italic">
            Completa tu diario para definir tus prioridades del día
          </p>
        </div>
      )}
    </div>
  );
}

interface PriorityItemProps {
  label: string;
  text: string;
  checked: boolean;
  onToggle: () => void;
  accentColor: 'sky' | 'emerald' | 'rose';
  disabled?: boolean;
}

function PriorityItem({ label, text, checked, onToggle, accentColor, disabled }: PriorityItemProps) {
  const accentClasses = {
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left group ${
        checked
          ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
          : 'bg-zinc-100/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="relative shrink-0">
        {checked ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-check-mark" />
        ) : (
          <Circle className="h-6 w-6 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${accentClasses[accentColor]}`}>
            {label}
          </span>
        </div>
        <p className={`text-sm font-medium truncate ${
          checked
            ? 'text-zinc-500 dark:text-zinc-400 line-through'
            : 'text-zinc-800 dark:text-zinc-200'
        }`}>
          {text}
        </p>
      </div>
    </button>
  );
}
