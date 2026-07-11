'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface StepNegocioProps {
  mitSer: string;
  setMitSer: (v: string) => void;
  mitSerCompleted: boolean;
  setMitSerCompleted: (v: boolean) => void;
  mitNegocio: string;
  setMitNegocio: (v: string) => void;
  mitNegocioCompleted: boolean;
  setMitNegocioCompleted: (v: boolean) => void;
  mitRelaciones: string;
  setMitRelaciones: (v: string) => void;
  mitRelacionesCompleted: boolean;
  setMitRelacionesCompleted: (v: boolean) => void;
}

export function StepNegocio({
  mitSer,
  setMitSer,
  mitSerCompleted,
  setMitSerCompleted,
  mitNegocio,
  setMitNegocio,
  mitNegocioCompleted,
  setMitNegocioCompleted,
  mitRelaciones,
  setMitRelaciones,
  mitRelacionesCompleted,
  setMitRelacionesCompleted,
}: StepNegocioProps) {
  return (
    <div className="space-y-5">
      <MitField
        label="MIT SER"
        description="Lo más importante para tu crecimiento personal hoy"
        value={mitSer}
        onChange={setMitSer}
        completed={mitSerCompleted}
        onToggle={() => setMitSerCompleted(!mitSerCompleted)}
        accentColor="sky"
      />

      <MitField
        label="MIT NEGOCIO"
        description="La acción #1 que mueve la aguja de tu negocio"
        value={mitNegocio}
        onChange={setMitNegocio}
        completed={mitNegocioCompleted}
        onToggle={() => setMitNegocioCompleted(!mitNegocioCompleted)}
        accentColor="emerald"
      />

      <MitField
        label="MIT RELACIONES"
        description="La conexión o conversación más importante del día"
        value={mitRelaciones}
        onChange={setMitRelaciones}
        completed={mitRelacionesCompleted}
        onToggle={() => setMitRelacionesCompleted(!mitRelacionesCompleted)}
        accentColor="rose"
      />
    </div>
  );
}

export function getNegocioSummary(
  mitSer: string,
  mitNegocio: string,
  mitRelaciones: string,
  completedCount: number
): string {
  const total = [mitSer, mitNegocio, mitRelaciones].filter(Boolean).length;
  if (total === 0) return 'Sin MITs definidos';
  return `${completedCount}/3 completados`;
}

interface MitFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  completed: boolean;
  onToggle: () => void;
  accentColor: string;
}

function MitField({
  label,
  description,
  value,
  onChange,
  completed,
  onToggle,
  accentColor,
}: MitFieldProps) {
  const accentMap: Record<string, string> = {
    sky: 'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          className={`text-xs font-bold uppercase tracking-wider font-mono ${
            accentMap[accentColor] || 'text-zinc-500'
          }`}
        >
          {label}
        </label>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-colors"
        >
          {completed ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Hecho</span>
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              <span className="text-zinc-400">Pendiente</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`¿Cuál es tu ${label} de hoy?`}
        className={`w-full bg-zinc-50 dark:bg-zinc-950 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
          completed
            ? 'border-emerald-200/50 dark:border-emerald-800/30 text-zinc-500 line-through'
            : 'border-zinc-200/50 dark:border-zinc-800/50'
        }`}
      />
    </div>
  );
}
