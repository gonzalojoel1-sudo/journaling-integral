'use client';

import React, { useState } from 'react';
import { createHabit, archiveHabit } from '../actions/habits';
import { 
  Plus, 
  Trash2, 
  ToggleLeft, 
  Zap, 
  RefreshCw, 
  CheckCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Smile
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  type: string;
  strategyDetails: string | null;
  isActive: number;
}

interface HabitsClientProps {
  initialHabits: Habit[];
}

export function HabitsClient({ initialHabits }: HabitsClientProps) {
  const [habitsList, setHabitsList] = useState<Habit[]>(initialHabits);
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'stacking'>('catalogo');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ESTADOS: NUEVO HÁBITO ORDINARIO ---
  const [name, setName] = useState('');
  const [type, setType] = useState<'ESTANDARIZAR' | 'OPTIMIZAR' | 'REEMPLAZAR'>('ESTANDARIZAR');
  const [strategyDetails, setStrategyDetails] = useState('');

  // --- ESTADOS: CONSTRUCTOR ATÓMICO (HABIT STACKING) ---
  const [stackAnchor, setStackAnchor] = useState('');      // Desencadenante (Ancla)
  const [stackAction, setStackAction] = useState('');      // Acción 1%
  const [stackReward, setStackReward] = useState('');      // Celebración (Dopamina)

  // --- GUARDAR HÁBITO ORDINARIO ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const res = await createHabit(name, type, strategyDetails);
    setLoading(false);

    if (res.success) {
      const newHabitLocal: Habit = {
        id: Math.random().toString(),
        name,
        type,
        strategyDetails: strategyDetails || null,
        isActive: 1
      };
      setHabitsList([newHabitLocal, ...habitsList]);
      setName('');
      setStrategyDetails('');
      setShowAddForm(false);
    } else {
      setError(res.error || 'Error al guardar el hábito.');
    }
  };

  // --- GUARDAR HABIT STACK CIENTÍFICO (EOR) ---
  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stackAnchor.trim() || !stackAction.trim() || !stackReward.trim()) {
      setError('Todos los campos del Habit Stack son requeridos.');
      return;
    }

    setLoading(true);
    setError(null);

    // Guardamos la estructura JSON en 'strategyDetails' bajo el tipo especial 'STACK'
    const habitName = `Cuando ${stackAnchor} ➔ Haré ${stackAction}`;
    const serializedStack = JSON.stringify({
      isStack: true,
      anchor: stackAnchor,
      action: stackAction,
      reward: stackReward
    });

    const res = await createHabit(habitName, 'OPTIMIZAR', serializedStack);
    setLoading(false);

    if (res.success) {
      const newHabitLocal: Habit = {
        id: Math.random().toString(),
        name: habitName,
        type: 'STACK',
        strategyDetails: serializedStack,
        isActive: 1
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

  // Filtrar hábitos para el catálogo
  const estandarizarList = habitsList.filter(h => h.type === 'ESTANDARIZAR');
  const optimizarList = habitsList.filter(h => h.type === 'OPTIMIZAR' && !h.strategyDetails?.includes('"isStack":true'));
  const reemplazarList = habitsList.filter(h => h.type === 'REEMPLAZAR');
  const stacksList = habitsList.filter(h => h.type === 'STACK' || h.strategyDetails?.includes('"isStack":true'));

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
          <ToggleLeft className="h-4 w-4" /> Catálogo EOR Ordinario
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
      {/* VISTA 1: CATÁLOGO DE HÁBITOS ORDINARIOS                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-8">
          {/* Formulario Ordinario */}
          <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200">Hábitos EOR Estándar</h3>
                <p className="text-xs text-stone-500 mt-1">Crea pautas para estandarizar, optimizar o reemplazar conductas de forma sencilla.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {showAddForm ? 'Cerrar' : 'Crear'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleCreate} className="mt-6 border-t border-stone-200 dark:border-stone-800 pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 font-mono">Conducta:</label>
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="E.g., No mirar redes antes de las 8am"
                      className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 font-mono">Tipo EOR:</label>
                    <select
                      value={type} onChange={(e: any) => setType(e.target.value)}
                      className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                    >
                      <option value="ESTANDARIZAR">ESTANDARIZAR</option>
                      <option value="OPTIMIZAR">OPTIMIZAR</option>
                      <option value="REEMPLAZAR">REEMPLAZAR</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 font-mono">Estrategia / Rediseño de Entorno:</label>
                    <input
                      type="text" value={strategyDetails} onChange={(e) => setStrategyDetails(e.target.value)}
                      placeholder="E.g., Dejar el libro sobre la almohada"
                      className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow">
                    Guardar Hábito
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Columnas EOR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estandarizar */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft flex flex-col h-full">
              <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-stone-500 border-b border-stone-200 dark:border-stone-850 pb-2">Estandarizar</h4>
              <div className="flex-1 py-4 space-y-3">
                {estandarizarList.map(h => (
                  <div key={h.id} className="bg-stone-100/60 dark:bg-stone-950/40 p-3.5 border border-stone-200/50 dark:border-stone-850/60 rounded-xl flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-snug">{h.name}</h5>
                      {h.strategyDetails && <p className="text-[10px] text-stone-400 mt-1">Estrategia: {h.strategyDetails}</p>}
                    </div>
                    <button onClick={() => handleArchive(h.id)} className="text-stone-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimizar */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft flex flex-col h-full">
              <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-stone-500 border-b border-stone-200 dark:border-stone-850 pb-2">Optimizar</h4>
              <div className="flex-1 py-4 space-y-3">
                {optimizarList.map(h => (
                  <div key={h.id} className="bg-stone-100/60 dark:bg-stone-950/40 p-3.5 border border-stone-200/50 dark:border-stone-850/60 rounded-xl flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-snug">{h.name}</h5>
                      {h.strategyDetails && <p className="text-[10px] text-stone-400 mt-1">Estrategia: {h.strategyDetails}</p>}
                    </div>
                    <button onClick={() => handleArchive(h.id)} className="text-stone-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reemplazar */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft flex flex-col h-full">
              <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-stone-500 border-b border-stone-200 dark:border-stone-850 pb-2">Reemplazar</h4>
              <div className="flex-1 py-4 space-y-3">
                {reemplazarList.map(h => (
                  <div key={h.id} className="bg-stone-100/60 dark:bg-stone-950/40 p-3.5 border border-stone-200/50 dark:border-stone-850/60 rounded-xl flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-snug">{h.name}</h5>
                      {h.strategyDetails && <p className="text-[10px] text-stone-400 mt-1">Estrategia: {h.strategyDetails}</p>}
                    </div>
                    <button onClick={() => handleArchive(h.id)} className="text-stone-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
                  const stackData = h.strategyDetails ? JSON.parse(h.strategyDetails) : null;
                  return (
                    <div key={h.id} className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-950 flex flex-col justify-between gap-4 shadow-sm hover:shadow transition-all-fresco">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-400">Circuito Enlazado</span>
                        </div>
                        {stackData ? (
                          <div className="text-xs space-y-1.5 text-stone-700 dark:text-stone-300">
                            <p>Cuando <strong className="text-stone-900 dark:text-stone-100">{stackData.anchor}</strong></p>
                            <p className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-stone-400" /> entonces <strong className="text-stone-900 dark:text-stone-100">{stackData.action}</strong></p>
                            <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><Smile className="h-3.5 w-3.5" /> celebrando: <em>{stackData.reward}</em></p>
                          </div>
                        ) : (
                          <p className="text-xs">{h.name}</p>
                        )}
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

    </div>
  );
}