'use client';

import React from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';

interface FlowStepProps {
  stepNumber: number;
  title: string;
  icon: React.ReactNode;
  state: 'completed' | 'active' | 'pending';
  summary?: string;
  children: React.ReactNode;
  onToggle: () => void;
  accentColor?: string;
}

export function FlowStep({
  title,
  icon,
  state,
  summary,
  children,
  onToggle,
  accentColor = 'emerald',
}: FlowStepProps) {
  const isExpanded = state === 'active';
  const isCompleted = state === 'completed';
  const isPending = state === 'pending';

  const accentClasses: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    sky: 'text-sky-600 dark:text-sky-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className={`surface-card overflow-hidden transition-all duration-300 ${
      isExpanded ? 'ring-2 ring-emerald-500/20' : ''
    }`}>
      {/* Header clickeable */}
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
          isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Ícono/Número del paso */}
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
            isCompleted
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
              : isExpanded
              ? `bg-${accentColor}-500/10`
              : 'bg-zinc-200/50 dark:bg-zinc-800/50'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-white" />
            ) : (
              <span className={isExpanded ? accentClasses[accentColor] : 'text-zinc-500 dark:text-zinc-400'}>
                {icon}
              </span>
            )}
          </div>

          {/* Título y resumen */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${
                isCompleted
                  ? 'text-zinc-500 dark:text-zinc-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}>
                {title}
              </h3>
              {isCompleted && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  Completado
                </span>
              )}
            </div>
            {isCompleted && summary && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate font-mono">
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Chevron */}
        {!isPending && (
          <ChevronDown
            className={`h-5 w-5 text-zinc-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Contenido expandible */}
      <div
        className={`flow-step-content ${
          isExpanded ? 'border-t border-zinc-200/50 dark:border-zinc-800/50' : ''
        }`}
        data-state={isExpanded ? 'expanded' : 'collapsed'}
      >
        <div className="p-5 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
