import React from 'react';

interface StrengthBarProps {
  strength: number;
  className?: string;
}

function getBarStyle(strength: number): string {
  const clamped = Math.min(Math.max(strength, 0), 10);
  const pct = Math.round((clamped / 10) * 100);

  if (pct <= 20) {
    return 'bg-zinc-400/30 dark:bg-zinc-600/30';
  }
  if (pct <= 50) {
    return 'bg-zinc-400 dark:bg-zinc-500';
  }
  if (pct <= 80) {
    return 'bg-zinc-500 dark:bg-zinc-400';
  }
  return 'bg-zinc-300 dark:bg-zinc-300 shadow-[0_0_4px_rgba(212,212,216,0.5)] dark:shadow-[0_0_4px_rgba(161,161,170,0.4)]';
}

export function StrengthBar({ strength, className = '' }: StrengthBarProps) {
  const clamped = Math.min(Math.max(strength, 0), 10);
  const pct = Math.round((clamped / 10) * 100);

  return (
    <div className={`h-[2px] w-full bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-premium ${getBarStyle(clamped)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
