'use client';

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'neutral' | 'positive' | 'negative';
  icon?: React.ReactNode;
}

const accentMap = {
  neutral: 'text-zinc-900 dark:text-zinc-200',
  positive: 'text-emerald-400 dark:text-emerald-300',
  negative: 'text-rose-400 dark:text-rose-300',
};

const subAccentMap = {
  neutral: 'text-zinc-500 dark:text-zinc-500',
  positive: 'text-emerald-600/70 dark:text-emerald-500/70',
  negative: 'text-rose-600/70 dark:text-rose-500/70',
};

export function MetricCard({ label, value, sub, accent = 'neutral', icon }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2">
        {icon && <span className="text-zinc-500">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold tracking-tight ${accentMap[accent]}`}>
          {value}
        </span>
      </div>
      {sub && (
        <span className={`text-[10px] font-mono ${subAccentMap[accent]}`}>
          {sub}
        </span>
      )}
    </div>
  );
}
