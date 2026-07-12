'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createHabit, archiveHabit } from '../actions/habits';
import { HabitWizard } from './HabitWizard';
import { HabitCard } from './habitCards';
import { 
  Trash2, 
  ToggleLeft, 
  Layers,
  ArrowRight,
  Smile
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  type?: string | null;
  strategyDetails?: string | null;
  isActive: number;
  currentStrength?: number;
  lastStrengthDate?: string | null;
  habitType?: string;
  domain?: string | null;
  activeAction?: string | null;
  rescueAction?: string | null;
  celebration?: string | null;
  anchor?: string | null;
  ifTrigger?: string | null;
  ifAction?: string | null;
  cue?: string | null;
  newRoutine?: string | null;
  identityLabel?: string | null;
  belongsToChainId?: string | null;
  nextHabitId?: string | null;
}

interface HabitsClientProps {
  initialHabits: Habit[];
}

export function HabitsClient({ initialHabits }: HabitsClientProps) {
  const router = useRouter();
  const [habitsList, setHabitsList] = useState<Habit[]>(initialHabits);
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'stacking'>('catalogo');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    setHabitsList(initialHabits);
  }, [initialHabits]);

  const handleWizardClose = () => {
    setShowWizard(false);
    router.refresh();
  };

  // --- ARCHIVAR HÁBITO ---
  const handleArchive = async (habitId: string) => {
    if (!confirm('¿Deseas archivar este hábito del catálogo activo?')) return;
    setHabitsList(habitsList.filter(h => h.id !== habitId));
    await archiveHabit(habitId);
    router.refresh();
  };

  // Filtrar stacks atómicos (hábitos con anchor definido)
  const stacksList = habitsList.filter(h => h.anchor && h.anchor.trim().length > 0);

  return (
    <div className="space-y-6">
      
      {/* Botones de navegación interna */}
      <div className="flex border-b border-stone-200 dark:border-stone-850 gap-4">
        <button
          onClick={() => setActiveSubTab('catalogo')}
          className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'catalogo' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
          }`}
        >
          <ToggleLeft className="h-4 w-4" /> Catálogo de Hábitos
        </button>
        <button
          onClick={() => setActiveSubTab('stacking')}
          className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'stacking' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
          }`}
        >
          <Layers className="h-4 w-4" /> Tus Circuitos Neuronales Activos (Habit Stacks)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: CATÁLOGO DE HÁBITOS                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              + Nuevo hábito
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habitsList.map(habit => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: CIRCUITOS NEURONALES (HABIT STACKS)                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'stacking' && (
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 animate-fade-in">
          <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 border-b border-stone-200 dark:border-stone-850 pb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Tus Circuitos Neuronales Activos (Habit Stacks)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {stacksList.length > 0 ? (
              stacksList.map((h) => {
                return (
                  <div key={h.id} className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-950 flex flex-col justify-between gap-4 shadow-sm hover:shadow transition-all-fresco">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-400">Circuito Enlazado</span>
                      </div>
                      <div className="text-xs space-y-1.5 text-stone-700 dark:text-stone-300">
                        <p>Cuando <strong className="text-stone-900 dark:text-stone-100">{h.anchor}</strong></p>
                        <p className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-stone-400" /> entonces <strong className="text-stone-900 dark:text-stone-100">{h.rescueAction || h.name}</strong></p>
                        <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><Smile className="h-3.5 w-3.5" /> celebrando: <em>{h.celebration}</em></p>
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-stone-100 dark:border-stone-850 pt-2">
                      <button onClick={() => handleArchive(h.id)} className="text-stone-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-stone-500 col-span-2 text-center py-8 italic">Aún no tienes circuitos neuronales. Crea un hábito ancla desde el catálogo para verlo aquí.</p>
            )}
          </div>
        </div>
      )}

      {showWizard && <HabitWizard onClose={handleWizardClose} />}
    </div>
  );
}