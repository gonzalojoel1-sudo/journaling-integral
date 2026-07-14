'use client';

import React, { useCallback, useRef } from 'react';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';
import { getDevotionalForDay } from '@/lib/devotionalGuide';
import { saveHabitsDraft } from '@/app/actions/save-habits-draft';

interface DailyHabit {
  habitId: string;
  name: string;
  habitType: string;
  completed: boolean;
}

interface StepDevocionalProps {
  devotionalNotes: string;
  setDevotionalNotes: (v: string) => void;
  dailyHabits: DailyHabit[];
  setDailyHabits: (v: DailyHabit[]) => void;
}

const areaColorMap: Record<string, { bg: string; text: string; border: string }> = {
  Espiritual: {
    bg: 'bg-violet-500/8 dark:bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/30 dark:border-violet-800/20',
  },
  Mente: {
    bg: 'bg-cyan-500/8 dark:bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/30 dark:border-cyan-800/20',
  },
  Negocio: {
    bg: 'bg-emerald-500/8 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/30 dark:border-emerald-800/20',
  },
  Relaciones: {
    bg: 'bg-rose-500/8 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/30 dark:border-rose-800/20',
  },
};

export function StepDevocional({
  devotionalNotes,
  setDevotionalNotes,
  dailyHabits,
  setDailyHabits,
}: StepDevocionalProps) {
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const persistHabits = useCallback((habits: DailyHabit[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveHabitsDraft(habits);
    }, 500);
  }, []);

  const toggleHabit = (habitId: string) => {
    const next = dailyHabits.map((h) =>
      h.habitId === habitId ? { ...h, completed: !h.completed } : h
    );
    setDailyHabits(next);
    persistHabits(next);
  };

  const completedCount = dailyHabits.filter((h) => h.completed).length;
  const todayDevotional = getDevotionalForDay(new Date().getDate());
  const areaColors = todayDevotional
    ? areaColorMap[todayDevotional.area] || areaColorMap.Espiritual
    : areaColorMap.Espiritual;

  return (
    <div className="space-y-6">
      {todayDevotional && (
        <div className={`p-5 rounded-2xl ${areaColors.bg} ${areaColors.border} border transition-all`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className={`h-4 w-4 ${areaColors.text}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${areaColors.text}`}>
                Día {todayDevotional.day} · {todayDevotional.area}
              </span>
            </div>
          </div>

          <blockquote className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed font-serif mb-2">
            &ldquo;{todayDevotional.verse}&rdquo;
          </blockquote>
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 text-right font-mono mb-4">
            — {todayDevotional.reference}
          </p>

          <div className="pt-3 border-t border-zinc-200/30 dark:border-zinc-700/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono mb-1.5">
              Enfoque de hoy:
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {todayDevotional.focus}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
          Notas devocionales / Reflexión bíblica:
        </label>
        <textarea
          value={devotionalNotes}
          onChange={(e) => setDevotionalNotes(e.target.value)}
          placeholder="Escribe lo que Dios te habló hoy, un versículo clave, o una reflexión espiritual..."
          rows={4}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
        />
      </div>

      <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
            Hábitos del día:
          </label>
          {dailyHabits.length > 0 && (
            <span className="text-xs font-mono font-bold text-zinc-400">
              {completedCount}/{dailyHabits.length}
            </span>
          )}
        </div>

        {dailyHabits.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
            No tienes hábitos activos. Créa uno en la sección de Hábitos.
          </p>
        ) : (
          <div className="space-y-2">
            {dailyHabits.map((habit) => (
              <button
                key={habit.habitId}
                type="button"
                onClick={() => toggleHabit(habit.habitId)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all cursor-pointer ${
                  habit.completed
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30'
                    : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {habit.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                )}
                <span
                  className={
                    habit.completed
                      ? 'text-zinc-500 dark:text-zinc-400 line-through'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }
                >
                  {habit.name}
                </span>
                <span className="ml-auto text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {habit.habitType}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function getDevocionalSummary(
  devotionalNotes: string,
  dailyHabits: DailyHabit[]
): string {
  const completed = dailyHabits.filter((h) => h.completed).length;
  const parts: string[] = [];
  if (devotionalNotes) parts.push(`📖 ${devotionalNotes.substring(0, 25)}...`);
  if (dailyHabits.length > 0) parts.push(`✅ ${completed}/${dailyHabits.length} hábitos`);
  return parts.length > 0 ? parts.join(' · ') : 'Sin registrar';
}
