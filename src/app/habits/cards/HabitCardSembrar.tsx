'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';
import type { ISembrarHabit } from '@/types/habits';
import { logger } from '@/lib/logger';

const CYCLE_TARGET = 15;

export function HabitCardSembrar({ habit }: { habit: ISembrarHabit }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [newOptimal, setNewOptimal] = useState(habit.evolutionOptimal || habit.activeAction || '');
  const [newMinimum, setNewMinimum] = useState(habit.evolutionMinimum || habit.rescueAction || '');
  const [upgrading, setUpgrading] = useState(false);

  const cycle = habit.evolutionCycle ?? 0;
  const days = habit.daysInCurrentCycle ?? 0;
  const isComplete = days >= CYCLE_TARGET;
  const pct = Math.min(Math.round((days / CYCLE_TARGET) * 100), 100);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/habits/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId: habit.id,
          evolutionOptimal: newOptimal,
          evolutionMinimum: newMinimum,
        }),
      });
      if (res.ok) {
        setShowUpgrade(false);
        router.refresh();
      }
    } catch (e) {
      logger.error('habit_upgrade_failed', {}, e);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="border-l-4 border-l-emerald-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => !showUpgrade && setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🌱 Sembrar · Nivel {cycle + 1}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      {!isComplete ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Camino a la Evolución</span>
            <span>{days}/{CYCLE_TARGET} días</span>
          </div>
          <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}
          className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          ¡Has dominado este nivel! Mejorar hábito
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          <p>⚡ Óptimo: <span className="text-stone-700 dark:text-stone-300">{habit.evolutionOptimal || habit.activeAction}</span></p>
          <p>🌱 Mínimo: <span className="text-stone-700 dark:text-stone-300">{habit.evolutionMinimum || habit.rescueAction}</span></p>
          {habit.anchor && <p>🔗 Ancla: {habit.anchor}</p>}
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>

      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpgrade(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <Sparkles className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold">¡Has dominado este nivel! 🌱✨</h3>
              <p className="text-sm text-stone-500 mt-1">Llevas 15 días demostrando quién eres. ¿Quieres subir un escalón?</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nueva versión óptima</label>
                <input type="text" value={newOptimal} onChange={e => setNewOptimal(e.target.value)}
                  className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nueva versión mínima</label>
                <input type="text" value={newMinimum} onChange={e => setNewMinimum(e.target.value)}
                  className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent mt-1 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowUpgrade(false)} className="px-4 py-2 text-stone-500 text-sm">Mantener ritmo</button>
              <button onClick={handleUpgrade} disabled={upgrading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm disabled:opacity-50">
                {upgrading ? 'Mejorando...' : 'Mejorar hábito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
