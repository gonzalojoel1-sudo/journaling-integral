'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface Habit {
  id: string;
  name: string;
  habitType: string;
  completed?: boolean;
  currentStrength?: number;
  lastStrengthDate?: string | null;
  activeAction?: string | null;
  rescueAction?: string | null;
  celebration?: string | null;
}

interface HabitProgressProps {
  habits: Habit[];
  initialCompletedIds?: string[];
}

const typeIcon: Record<string, string> = {
  crecer: '⚡',
  sembrar: '🌱',
  cambiar: '🔄',
  preciso: '🎯',
  pilar: '🏛️',
};

export function HabitProgress({ habits, initialCompletedIds = [] }: HabitProgressProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initialCompletedIds));

  const toggleHabit = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const completedCount = completedIds.size;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (habits.length === 0) {
    return (
      <div className="surface-card p-5 h-full flex flex-col items-center justify-center text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
          No tienes hábitos registrados
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
          Agrégalos en /habits
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Hábitos EOR
        </h3>
        <span className="text-[10px] font-bold font-mono text-zinc-500 dark:text-zinc-400">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="mb-4">
        <div className="h-1.5 w-full bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-premium"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px]">
        {habits.map((habit) => {
          const isCompleted = completedIds.has(habit.id);
          const strength = habit.currentStrength ?? 0;
          return (
            <button
              key={habit.id}
              type="button"
              onClick={() => toggleHabit(habit.id)}
              className={`w-full flex flex-col gap-1.5 p-2.5 rounded-lg transition-all duration-200 text-left group ${
                isCompleted
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                  : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                      : 'border border-zinc-300 dark:border-zinc-600 group-hover:border-emerald-400'
                  }`}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs shrink-0">{typeIcon[habit.habitType] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs font-medium truncate ${
                      isCompleted
                        ? 'text-zinc-500 dark:text-zinc-400 line-through'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-zinc-400 truncate">
                      {habit.activeAction || habit.rescueAction}
                    </p>
                    {habit.rescueAction && habit.activeAction === habit.rescueAction && (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded shrink-0">
                        Modo rescate
                      </span>
                    )}
                  </div>
                </div>
                {isCompleted && habit.celebration && (
                  <span className="text-[10px] text-zinc-400 shrink-0">{habit.celebration}</span>
                )}
              </div>
              <StrengthBar strength={strength} className="ml-8" />
            </button>
          );
        })}
      </div>

      {progressPercent === 100 && (
        <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 text-center font-mono uppercase tracking-wider">
            Día Perfecto
          </p>
        </div>
      )}
    </div>
  );
}
