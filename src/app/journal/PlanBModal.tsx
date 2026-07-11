'use client';

import React from 'react';
import { Zap, Clock } from 'lucide-react';

interface PlanBModalProps {
  onSelectMode: (isPlanB: boolean) => void;
}

export function PlanBModal({ onSelectMode }: PlanBModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="surface-float max-w-md w-full p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-amber-500/10 items-center justify-center mb-2">
            <Zap className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
            ¿Día difícil?
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Elige cómo quieres registrar tu día
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onSelectMode(false)}
            className="surface-card p-5 flex flex-col items-center gap-3 hover:ring-2 hover:ring-emerald-500/30 transition-all group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Modo Normal
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                6 pasos · ~15 min
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode(true)}
            className="surface-card p-5 flex flex-col items-center gap-3 hover:ring-2 hover:ring-amber-500/30 transition-all group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Modo Rápido
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                3 campos · ~2 min
              </p>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 font-mono">
          El Modo Rápido sostiene tu racha con lo esencial
        </p>
      </div>
    </div>
  );
}
