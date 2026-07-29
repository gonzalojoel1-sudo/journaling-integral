'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveQuarterlyPlan } from '../actions/quarterly-planning';
import { z } from 'zod';
import { parseJsonColumn } from '@/lib/json';
import {
  Save,
  Compass,
  Target,
  Activity,
  Plus,
  Trash2
} from 'lucide-react';

const SMARTObjectiveSchema = z.object({
  id: z.string(),
  objective: z.string(),
  targetDate: z.string(),
  isCompleted: z.boolean(),
});

const SMARTObjectivesSchema = z.array(SMARTObjectiveSchema);

const ActionRowSchema = z.object({
  action: z.string(),
  frequency: z.string(),
  indicator: z.string(),
});

const MetaPlanSchema = z.object({
  metaIndex: z.number(),
  metaTitle: z.string(),
  actions: z.array(ActionRowSchema),
});

const MetaPlansSchema = z.array(MetaPlanSchema);

interface SMARTObjective {
  id: string;
  objective: string;
  targetDate: string;
  isCompleted: boolean;
}

interface ActionRow {
  action: string;
  frequency: string;
  indicator: string;
}

interface MetaPlan {
  metaIndex: number;
  metaTitle: string;
  actions: ActionRow[];
}

interface QuarterlyPlanFormProps {
  initialPlan: any | null;
  userLevel: number;
}

export function QuarterlyPlanForm({ initialPlan, userLevel }: QuarterlyPlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar pestaña por defecto según el nivel para evitar renderizar tabs ocultas
  const [activeTab, setActiveTab] = useState<'smart' | 'vision' | 'acciones'>('smart');

  useEffect(() => {
    if (userLevel === 1) {
      setActiveTab('smart'); // Forzar pestaña SMART si es Nivel 1
    }
  }, [userLevel]);

  // --- ESTADOS LOCALES ---
  const [quarterLabel, setQuarterLabel] = useState<string>(initialPlan?.quarterLabel ?? 'Q1/2026');
  const [year, setYear] = useState<number>(initialPlan?.year ?? new Date().getFullYear());

  const [fiveYearSpiritual, setFiveYearSpiritual] = useState<string>(initialPlan?.fiveYearSpiritual ?? '');
  const [fiveYearBeing, setFiveYearBeing] = useState<string>(initialPlan?.fiveYearBeing ?? '');
  const [fiveYearBusiness, setFiveYearBusiness] = useState<string>(initialPlan?.fiveYearBusiness ?? '');
  const [fiveYearRelations, setFiveYearRelations] = useState<string>(initialPlan?.fiveYearRelations ?? '');

  const [quarterlySpiritual, setQuarterlySpiritual] = useState<string>(initialPlan?.quarterlySpiritual ?? '');
  const [quarterlyBeing, setQuarterlyBeing] = useState<string>(initialPlan?.quarterlyBeing ?? '');
  const [quarterlyBusiness, setQuarterlyBusiness] = useState<string>(initialPlan?.quarterlyBusiness ?? '');
  const [quarterlyRelations, setQuarterlyRelations] = useState<string>(initialPlan?.quarterlyRelations ?? '');

  const defaultSmartObjectives: SMARTObjective[] = [
    { id: '1', objective: '', targetDate: '', isCompleted: false },
    { id: '2', objective: '', targetDate: '', isCompleted: false },
    { id: '3', objective: '', targetDate: '', isCompleted: false },
    { id: '4', objective: '', targetDate: '', isCompleted: false },
    { id: '5', objective: '', targetDate: '', isCompleted: false },
  ];
  
  const [smartObjectives, setSmartObjectives] = useState<SMARTObjective[]>(
    parseJsonColumn<SMARTObjective[]>(initialPlan?.smartObjectivesJson, SMARTObjectivesSchema, defaultSmartObjectives)
  );

  const createDefaultMetaPlan = (index: number, title: string): MetaPlan => ({
    metaIndex: index,
    metaTitle: title,
    actions: [
      { action: '', frequency: 'Diaria', indicator: '' },
      { action: '', frequency: 'Semanal', indicator: '' },
      { action: '', frequency: 'Semanal', indicator: '' },
    ]
  });

  const defaultMetaPlans: MetaPlan[] = [
    createDefaultMetaPlan(1, 'Meta 1'),
    createDefaultMetaPlan(2, 'Meta 2'),
    createDefaultMetaPlan(3, 'Meta 3'),
    createDefaultMetaPlan(4, 'Meta 4'),
    createDefaultMetaPlan(5, 'Meta 5'),
  ];

  const [metaPlans, setMetaPlans] = useState<MetaPlan[]>(
    parseJsonColumn<MetaPlan[]>(initialPlan?.actionsPlanJson, MetaPlansSchema, defaultMetaPlans)
  );

  const handleSmartChange = (index: number, field: keyof SMARTObjective, value: any) => {
    const updated = [...smartObjectives];
    updated[index] = { ...updated[index], [field]: value };
    setSmartObjectives(updated);
  };

  const handleActionChange = (metaIdx: number, actionRowIdx: number, field: keyof ActionRow, value: string) => {
    const updatedPlans = [...metaPlans];
    updatedPlans[metaIdx].actions[actionRowIdx] = {
      ...updatedPlans[metaIdx].actions[actionRowIdx],
      [field]: value
    };
    setMetaPlans(updatedPlans);
  };

  const handleMetaTitleChange = (metaIdx: number, newTitle: string) => {
    const updatedPlans = [...metaPlans];
    updatedPlans[metaIdx].metaTitle = newTitle;
    setMetaPlans(updatedPlans);
  };

  const addActionRow = (metaIdx: number) => {
    const updatedPlans = [...metaPlans];
    updatedPlans[metaIdx].actions.push({ action: '', frequency: 'Semanal', indicator: '' });
    setMetaPlans(updatedPlans);
  };

  const removeActionRow = (metaIdx: number, actionRowIdx: number) => {
    const updatedPlans = [...metaPlans];
    updatedPlans[metaIdx].actions.splice(actionRowIdx, 1);
    setMetaPlans(updatedPlans);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      quarterLabel,
      year,
      fiveYearSpiritual: userLevel >= 2 ? fiveYearSpiritual : null,
      fiveYearBeing: userLevel >= 2 ? fiveYearBeing : null,
      fiveYearBusiness: userLevel >= 2 ? fiveYearBusiness : null,
      fiveYearRelations: userLevel >= 2 ? fiveYearRelations : null,
      quarterlySpiritual: userLevel >= 2 ? quarterlySpiritual : null,
      quarterlyBeing: userLevel >= 2 ? quarterlyBeing : null,
      quarterlyBusiness: userLevel >= 2 ? quarterlyBusiness : null,
      quarterlyRelations: userLevel >= 2 ? quarterlyRelations : null,
      smartObjectives: smartObjectives.filter(obj => obj.objective.trim() !== ''),
      actionsPlan: userLevel >= 2 ? metaPlans : []
    };

    const res = await saveQuarterlyPlan(payload);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || 'Ocurrió un error al guardar tu plan trimestral.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Trimestre */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-100/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-850 p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">Trimestre Activo</label>
            <input
              type="text" value={quarterLabel} onChange={(e) => setQuarterLabel(e.target.value)}
              placeholder="Ej. Q1/2026"
              className="bg-transparent text-lg font-bold text-stone-800 dark:text-stone-200 border-b border-stone-300 dark:border-stone-700 focus:border-emerald-500 outline-none w-28"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">Año</label>
            <input
              type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-lg font-bold text-stone-800 dark:text-stone-200 border-b border-stone-300 dark:border-stone-700 focus:border-emerald-500 outline-none w-20"
            />
          </div>
        </div>
        
        <button
          type="button" onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-400 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-colors shadow cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar Plan'}
        </button>
      </div>

      {/* --- BOTONES DE PESTAÑAS (OCULTACIÓN DINÁMICA DE TABS) --- */}
      <div className="flex border-b border-stone-200 dark:border-stone-850 overflow-x-auto gap-2">
        <button
          type="button" onClick={() => setActiveTab('smart')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'smart' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
          }`}
        >
          <Target className="h-4 w-4" /> 1. Objetivos del Trimestre (SMART)
        </button>

        {/* Solo mostrar visiones complejas si el usuario es Nivel 2 o Superior */}
        {userLevel >= 2 && (
          <>
            <button
              type="button" onClick={() => setActiveTab('vision')}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'vision' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
              }`}
            >
              <Compass className="h-4 w-4" /> 2. Visión a 5 Años y Trimestre
            </button>
            <button
              type="button" onClick={() => setActiveTab('acciones')}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'acciones' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
              }`}
            >
              <Activity className="h-4 w-4" /> 3. Planes de Acción (Meta 1-5)
            </button>
          </>
        )}
      </div>

      {/* --- PESTAÑA: OBJETIVOS SMART (Única visible para Nivel 1) --- */}
      {activeTab === 'smart' && (
        <div className="bg-white/80 dark:bg-stone-900/70 backdrop-blur-md border border-stone-200 dark:border-stone-850 rounded-2xl p-6 space-y-6">
          <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
            Objetivos del Trimestre — SMART
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Diseña objetivos que sean: <strong>E</strong>specíficos, <strong>M</strong>edibles, <strong>A</strong>lcanzables, <strong>R</strong>elevantes, y acotados en el <strong>T</strong>iempo.
          </p>

          <div className="space-y-4">
            {smartObjectives.map((obj, idx) => (
              <div key={obj.id || idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-stone-50/50 dark:bg-stone-950 p-4 border border-stone-200 dark:border-stone-850 rounded-xl">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Objetivo {idx + 1}</label>
                  <input
                    type="text" value={obj.objective} onChange={(e) => handleSmartChange(idx, 'objective', e.target.value)}
                    placeholder="Ej. Completar 20 días de journaling de nivel 1 con constancia."
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Fecha Vencimiento</label>
                  <input
                    type="date" value={obj.targetDate} onChange={(e) => handleSmartChange(idx, 'targetDate', e.target.value)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PESTAÑA: VISIÓN A 5 AÑOS (Oculta para Nivel 1) --- */}
      {userLevel >= 2 && activeTab === 'vision' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-white/80 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
              Visión a 5 Años (Brújula de Legado)
            </h3>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Espiritual:</label>
              <textarea
                value={fiveYearSpiritual} onChange={(e) => setFiveYearSpiritual(e.target.value)}
                placeholder="Ej. ¿Quién quiero ser en mi intimidad con Dios en 5 años?" rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Ser (Identidad/Estilo de Vida):</label>
              <textarea
                value={fiveYearBeing} onChange={(e) => setFiveYearBeing(e.target.value)}
                placeholder="Ej. Hábitos de descanso, salud integral y carácter." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Negocio (Contribución/Liderazgo):</label>
              <textarea
                value={fiveYearBusiness} onChange={(e) => setFiveYearBusiness(e.target.value)}
                placeholder="Ej. Metas financieras, impacto comercial y ministerial." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Relaciones (Familia/Mentoría):</label>
              <textarea
                value={fiveYearRelations} onChange={(e) => setFiveYearRelations(e.target.value)}
                placeholder="Ej. Calidad de relaciones familiares y círculos de multiplicación." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
              Visión del Trimestre (Logros Concretos)
            </h3>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Espiritual:</label>
              <textarea
                value={quarterlySpiritual} onChange={(e) => setQuarterlySpiritual(e.target.value)}
                placeholder="Ej. Consolidar devocional diario de 15 minutos en paz." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Ser (Identidad/Estilo de Vida):</label>
              <textarea
                value={quarterlyBeing} onChange={(e) => setQuarterlyBeing(e.target.value)}
                placeholder="Ej. Retomar rutina de sueño consistente durmiendo a las 10 PM." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Negocio (Contribución/Liderazgo):</label>
              <textarea
                value={quarterlyBusiness} onChange={(e) => setQuarterlyBusiness(e.target.value)}
                placeholder="Ej. Validar propuesta de consultoría con 3 llamadas de diagnóstico." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase font-mono">Relaciones (Familia/Mentoría):</label>
              <textarea
                value={quarterlyRelations} onChange={(e) => setQuarterlyRelations(e.target.value)}
                placeholder="Ej. Asegurar salida quincenal exclusiva con mi cónyuge sin celulares." rows={2}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA: PLAN DE ACCIÓN (Oculta para Nivel 1) --- */}
      {userLevel >= 2 && activeTab === 'acciones' && (
        <div className="space-y-8 animate-fade-in">
          {metaPlans.map((meta: any, metaIdx: number) => (
            <div key={meta.metaIndex} className="bg-white/80 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 space-y-4">
              <div className="border-b border-stone-200 dark:border-stone-850 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 max-w-sm">
                  <span className="block text-[10px] font-bold text-stone-500 uppercase font-mono">Título de la Meta</span>
                  <input
                    type="text" value={meta.metaTitle} onChange={(e) => handleMetaTitleChange(metaIdx, e.target.value)}
                    placeholder={`Ej. Meta ${meta.metaIndex}`}
                    className="w-full bg-transparent text-lg font-extrabold text-stone-800 dark:text-stone-200 border-b border-transparent focus:border-emerald-500 outline-none pb-0.5"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800">
                      <th className="py-2 text-xs font-bold uppercase tracking-wider text-stone-500 font-mono w-[55%]">Acción Clave</th>
                      <th className="py-2 text-xs font-bold uppercase tracking-wider text-stone-500 font-mono w-[20%]">Frecuencia</th>
                      <th className="py-2 text-xs font-bold uppercase tracking-wider text-stone-500 font-mono w-[20%]">Indicador</th>
                      <th className="py-2 text-center w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {meta.actions.map((row: any, rowIdx: number) => (
                      <tr key={rowIdx}>
                        <td className="py-2.5 pr-4">
                          <input
                            type="text" value={row.action} onChange={(e) => handleActionChange(metaIdx, rowIdx, 'action', e.target.value)}
                            placeholder="¿Qué acción concreta sostendrá esta meta?"
                            className="w-full bg-white dark:bg-stone-950 border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-4">
                          <select
                            value={row.frequency} onChange={(e) => handleActionChange(metaIdx, rowIdx, 'frequency', e.target.value)}
                            className="w-full bg-white dark:bg-stone-950 border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                          >
                            <option value="Diaria">Diaria</option>
                            <option value="Semanal">Semanal</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Mensual">Mensual</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="text" value={row.indicator} onChange={(e) => handleActionChange(metaIdx, rowIdx, 'indicator', e.target.value)}
                            placeholder="Ej. Check en App"
                            className="w-full bg-white dark:bg-stone-950 border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                          />
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            type="button" onClick={() => removeActionRow(metaIdx, rowIdx)}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <button
                  type="button" onClick={() => addActionRow(metaIdx)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Añadir acción clave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PANEL DE FEEDBACK DE ACCIONES --- */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold animate-shake">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold animate-pulse">
          ¡Plan trimestral guardado con éxito!
        </div>
      )}

    </div>
  );
}