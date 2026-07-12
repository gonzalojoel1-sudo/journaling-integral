'use client';

import React, { useState } from 'react';
import { createHabit, archiveHabit } from '../actions/habits';
import { HabitWizard } from './HabitWizard';
import { HabitCard } from './habitCards';
import { 
  Trash2, 
  ToggleLeft, 
  CheckCircle,
  Sparkles,
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
  const [habitsList, setHabitsList] = useState<Habit[]>(initialHabits);
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'stacking'>('catalogo');
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ESTADOS: CONSTRUCTOR ATÓMICO (HABIT STACKING) ---
  const [stackAnchor, setStackAnchor] = useState('');      // Desencadenante (Ancla)
  const [stackAction, setStackAction] = useState('');      // Acción 1%
  const [stackReward, setStackReward] = useState('');      // Celebración (Dopamina)

  // --- GUARDAR HABIT STACK CIENTÍFICO ---
  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stackAnchor.trim() || !stackAction.trim() || !stackReward.trim()) {
      setError('Todos los campos del Habit Stack son requeridos.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createHabit({
      name: stackAction,
      habitType: 'crecer',
      rescueAction: stackAction,
      anchor: stackAnchor,
      celebration: stackReward,
    });
    setLoading(false);

    if (res.success) {
      const newHabitLocal: Habit = {
        id: Math.random().toString(),
        name: stackAction,
        habitType: 'crecer',
        rescueAction: stackAction,
        anchor: stackAnchor,
        celebration: stackReward,
        isActive: 1,
        currentStrength: 0.0,
        lastStrengthDate: null,
      };
      setHabitsList([newHabitLocal, ...habitsList]);
      
      // Limpiar estados
      setStackAnchor('');
      setStackAction('');
      setStackReward('');
    } else {
      setError(res.error || 'Error al guardar el Habit Stack.');
    }
  };

  // --- ARCHIVAR HÁBITO ---
  const handleArchive = async (habitId: string) => {
    if (!confirm('¿Deseas archivar este hábito del catálogo activo?')) return;
    setHabitsList(habitsList.filter(h => h.id !== habitId));
    await archiveHabit(habitId);
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
          <Layers className="h-4 w-4" /> Constructor Atómico (Habit Stacking)
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
      {/* VISTA 2: CONSTRUCTOR ATÓMICO (HABIT STACKING)                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'stacking' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Panel de Creación */}
            <form onSubmit={handleCreateStack} className="lg:col-span-3 p-6 rounded-2xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft space-y-5">
              <div>
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Constructor de Circuitos Neuronales (BJ Fogg Protocol)
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Enlaza un hábito automático existente (Ancla) con una nueva micro-conducta que requiera cero fuerza de voluntad (1%) y una celebración inmediata que inyecte dopamina.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. ANCLA */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono mb-2">1. Desencadenante / Hábito Ancla (Ya automático):</label>
                  <input
                    type="text" value={stackAnchor} onChange={(e) => setStackAnchor(e.target.value)}
                    placeholder="E.g., Termine de tomar mi café matutino"
                    className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>

                {/* 2. ACCIÓN 1% */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono mb-2">2. Nuevo Micro-Hábito (1% de esfuerzo):</label>
                  <input
                    type="text" value={stackAction} onChange={(e) => setStackAction(e.target.value)}
                    placeholder="E.g., Leeré 1 página de mi libro de negocios"
                    className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>

                {/* 3. RECOMPENSA (CELEBRACIÓN) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono mb-2">3. Celebración Inmediata (Inyección de Dopamina):</label>
                  <input
                    type="text" value={stackReward} onChange={(e) => setStackReward(e.target.value)}
                    placeholder="E.g., Sonreír y decir en voz alta: ¡Victoria!"
                    className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" /> Enlazar Stack Atómico
                </button>
              </div>
            </form>

            {/* Previsualizador de Flujograma de Ruta Neuronal */}
            <div className="lg:col-span-2 flex flex-col justify-between p-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-soft">
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  Ruta Neuronal Diseñada
                </span>
                
                <div className="space-y-6 pt-4 relative">
                  {/* Flujo Visual */}
                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">1</div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Desencadenante (Ancla)</span>
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-300 mt-0.5 leading-snug">
                        {stackAnchor || '[Escribe tu hábito ancla...]'}
                      </p>
                    </div>
                  </div>

                  <div className="h-4 w-0.5 bg-emerald-500/50 absolute left-[11px] top-6"></div>

                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">2</div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">Nueva Acción 1%</span>
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-300 mt-0.5 leading-snug">
                        {stackAction || '[Define la micro-conducta...]'}
                      </p>
                    </div>
                  </div>

                  <div className="h-4 w-0.5 bg-emerald-500/50 absolute left-[11px] top-20"></div>

                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">3</div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">Inyección de Dopamina</span>
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-300 mt-0.5 leading-snug">
                        {stackReward || '[¿Cómo celebrarás el éxito?]'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-850 pt-4 mt-6 text-[10px] text-stone-500 leading-relaxed italic">
                "La dopamina inmediata bloquea la ruta neuronal y la asienta en tu subconsciente." — James Clear.
              </div>
            </div>

          </div>

          {/* Catálogo de Stacks Creados */}
          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6">
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
                <p className="text-xs text-stone-500 col-span-2 text-center py-8 italic">No has enlazado ningún circuito neuronal atómico de habit stacking.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {showWizard && <HabitWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}