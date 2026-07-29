'use client';

import React from 'react';

interface DayCell {
  date: string;
  label: string;
  mitCompleted: boolean;
  cashCollected: number;
}

interface WeeklyCorrelationProps {
  data: DayCell[];
}

function formatDay(dateStr: string): string {
  const days = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  const date = new Date(dateStr + 'T00:00:00');
  return days[date.getDay()];
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export function WeeklyCorrelation({ data }: WeeklyCorrelationProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          Correlación 1-1-1 · Últimos 7 días
        </span>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4 text-center">Sin datos aún</p>
      </div>
    );
  }

  const maxCash = Math.max(...data.map((d) => d.cashCollected), 1);

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          Correlación 1-1-1 · Últimos 7 días
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
             <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">MITs ok</span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="h-2 w-2 rounded-full bg-zinc-500" />
             <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">No</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1 h-28 px-1">
        {data.map((day) => {
          const barHeight = Math.max(Math.round((day.cashCollected / maxCash) * 100), 4);

          return (
            <div key={day.date} className="flex-1 h-full flex flex-col items-center gap-1.5 min-w-0">
              <div className="flex-1 w-full flex flex-col items-center justify-end">
                <div
                  className="w-full max-w-[28px] bg-zinc-400/60 dark:bg-zinc-400/50 rounded-t-sm transition-all duration-700"
                  style={{ height: `${barHeight}%` }}
                  title={formatCurrency(day.cashCollected)}
                />
              </div>
              <div
                className={`h-3 w-3 rounded-full shrink-0 transition-colors ${
                  day.mitCompleted
                    ? 'bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-300/50 dark:bg-zinc-600/50'
                }`}
              />
              <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {formatDay(day.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
