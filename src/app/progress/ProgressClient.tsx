'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { parseJsonColumn } from '@/lib/json';
import {
  Activity,
  Moon,
  Brain,
  AlertTriangle,
  Printer,
  Compass,
  Award,
  Sparkles,
  LineChart,
  Target,
  ShieldCheck,
  Bookmark,
  Trophy,
} from 'lucide-react';

const SMARTObjectiveSchema = z.object({
  id: z.string().optional(),
  objective: z.string().optional(),
  targetDate: z.string().optional(),
  isCompleted: z.boolean().optional(),
});
const SMARTObjectivesArraySchema = z.array(SMARTObjectiveSchema);

const ActionRowSchema = z.object({
  action: z.string().optional(),
  frequency: z.string().optional(),
  indicator: z.string().optional(),
});
const MetaPlanSchema = z.object({
  metaIndex: z.number().optional(),
  metaTitle: z.string().optional(),
  actions: z.array(ActionRowSchema),
});
const MetaPlansArraySchema = z.array(MetaPlanSchema);

interface DailyEntry {
  id: string;
  date: string;
  sleepRating: number | null;
  energyRating: number | null;
  focusRating: number | null;
  stressRating: number | null;
  chooseToBeIdentity: string | null;
  dailyMicroAchievement: string | null;
  mitSerCompleted: number;
  mitNegocioCompleted: number;
  mitRelacionesCompleted: number;
  bizIncome: number;
  bizSalesCount: number;
  mindsetEmotion1: string | null;
  mindsetLimitingBelief: string | null;
  mindsetBiblicalTruth: string | null;
}

interface ProgressClientProps {
  entries: DailyEntry[];
  activePlan: any | null;
  badges: any[];
}

export function ProgressClient({ entries, activePlan, badges }: ProgressClientProps) {
  const [activeTab, setActiveTab] = useState<'fisiologia' | 'habitos' | 'mentalidad'>('fisiologia');

  const validEntries = entries.filter(
    e => e.sleepRating !== null && e.energyRating !== null && e.focusRating !== null
  );

  const totalCount = validEntries.length;

  // --- CÁLCULO DE PROMEDIOS ---
  const avgSleep = totalCount > 0 ? validEntries.reduce((acc, e) => acc + (e.sleepRating || 0), 0) / totalCount : 0;
  const avgEnergy = totalCount > 0 ? (validEntries.reduce((acc, e) => acc + (e.energyRating || 0), 0) / totalCount) : 0;
  const avgFocus = totalCount > 0 ? (validEntries.reduce((acc, e) => acc + (e.focusRating || 0), 0) / totalCount) : 0;
  const avgStress = totalCount > 0 ? (validEntries.reduce((acc, e) => acc + (e.stressRating || 0), 0) / totalCount) : 0;

  // --- ANÁLISIS DE CORRELACIÓN PREDICTIVA (FÓRMULA DEL RENDIMIENTO) ---
  const goodSleepEntries = validEntries.filter(e => (e.sleepRating || 0) >= 7);
  const avgFocusWithGoodSleep = goodSleepEntries.length > 0 
    ? (goodSleepEntries.reduce((acc, e) => acc + (e.focusRating || 0), 0) / goodSleepEntries.length)
    : 0;

  const lowStressEntries = validEntries.filter(e => (e.stressRating || 0) <= 5);
  const avgEnergyWithLowStress = lowStressEntries.length > 0
    ? (lowStressEntries.reduce((acc, e) => acc + (e.energyRating || 0), 0) / lowStressEntries.length)
    : 0;

  // --- HISTORIAL DE TRANSFORMACIÓN DE MENTALIDAD ---
  const mindsetHistory = validEntries.filter(e => e.mindsetLimitingBelief && e.mindsetBiblicalTruth);

  // --- TASAS DE CONSECUCIÓN DE MITs ---
  const totalSerMITs = validEntries.reduce((acc, e) => acc + e.mitSerCompleted, 0);
  const totalBizMITs = validEntries.reduce((acc, e) => acc + e.mitNegocioCompleted, 0);
  const totalRelMITs = validEntries.reduce((acc, e) => acc + e.mitRelacionesCompleted, 0);

  const handlePrint = () => {
    window.print();
  };

  const chartEntries = [...validEntries].reverse().slice(-10);
  const smartObjectives = parseJsonColumn<unknown[]>(activePlan?.smartObjectivesJson, SMARTObjectivesArraySchema, []);
  const metaPlans = parseJsonColumn<unknown[]>(activePlan?.actionsPlanJson, MetaPlansArraySchema, []);

  return (
    <div className="space-y-6">
      
      {/* Insignias desbloqueadas */}
      {badges.length > 0 && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-200">Insignias Desbloqueadas</h2>
            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 px-2 py-0.5 rounded-full">{badges.length} / 50</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {badges.map((b: any) => (
              <div key={b.id} className="text-center p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850">
                <div className="h-8 w-8 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-1">
                  <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[10px] font-bold text-stone-600 dark:text-stone-400 leading-tight truncate">{b.area} · {b.mineral}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de navegación interna */}
      <div className="flex border-b border-stone-200 dark:border-stone-850 overflow-x-auto gap-4 print:hidden">
        <button
          onClick={() => setActiveTab('fisiologia')}
          className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'fisiologia' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
          }`}
        >
          <LineChart className="h-4 w-4" /> 1. Fisiología y Correlaciones
        </button>
        <button
          onClick={() => setActiveTab('habitos')}
          className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'habitos' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
          }`}
        >
          <Target className="h-4 w-4" /> 2. Consistencia de Metas (MITs)
        </button>
        <button
          onClick={() => setActiveTab('mentalidad')}
          className={`py-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'mentalidad' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> 3. Espejo de Identidad y Creencias
        </button>
      </div>

      {/* --- EXPORTAR PLAN TRIMESTRAL --- */}
      {activePlan && (
        <section className="bg-stone-900 text-stone-100 rounded-3xl p-6 border border-stone-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden shadow-lg">
          <div>
            <h3 className="text-md font-bold flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-400" />
              ¿Quieres exportar tu Planeamiento Trimestral activo?
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Genera tu hoja física de ruta con tus visiones, objetivos SMART y planes de acción en formato PDF.
            </p>
          </div>
          <button
            type="button" onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition-colors shadow shrink-0 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Exportar Plan a PDF
          </button>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: FISIOLOGÍA Y CORRELACIONES PREDICTIVAS                        */}
      {/* ========================================================================= */}
      {activeTab === 'fisiologia' && (
        <div className="space-y-6 print:hidden">
          {/* Tarjetas de Promedios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono text-stone-500 font-bold block">Promedio Sueño</span>
                <p className="text-md font-bold text-stone-800 dark:text-stone-100">{avgSleep.toFixed(1)}/10</p>
              </div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono text-stone-500 font-bold block">Promedio Energía</span>
                <p className="text-md font-bold text-stone-800 dark:text-stone-100">{avgEnergy.toFixed(1)}/10</p>
              </div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono text-stone-500 font-bold block">Promedio Enfoque</span>
                <p className="text-md font-bold text-stone-800 dark:text-stone-100">{avgFocus.toFixed(1)}/10</p>
              </div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono text-stone-500 font-bold block">Promedio Estrés</span>
                <p className="text-md font-bold text-stone-800 dark:text-stone-100">{avgStress.toFixed(1)}/10</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de barras */}
            <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-3 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-emerald-500" /> Tendencia de Bienestar (Últimos 10 registros)
              </h4>
              <div className="h-64 flex items-end gap-4 pt-6 select-none">
                {chartEntries.map((e, idx) => (
                  <div key={e.id || idx} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div className="w-full flex justify-center gap-1.5 h-full items-end">
                      <div className="w-3 bg-blue-500 rounded-t-sm" style={{ height: `${(e.sleepRating || 0) * 10}%` }}></div>
                      <div className="w-3 bg-emerald-500 rounded-t-sm" style={{ height: `${(e.energyRating || 0) * 10}%` }}></div>
                    </div>
                    <span className="text-[9px] text-stone-400 font-mono mt-2">{e.date.substring(5)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-center text-[10px] font-bold font-mono mt-4 pt-3 border-t border-stone-150 dark:border-stone-850">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-blue-500 rounded-sm"></span> Sueño</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-emerald-500 rounded-sm"></span> Energía</div>
              </div>
            </div>

            {/* Fórmulas de Rendimiento */}
            <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-500" /> Fórmulas del Rendimiento
              </h4>
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">Enfoque Máximo</span>
                  <p className="text-xs text-stone-700 dark:text-stone-300">
                    Tu enfoque mental promedio es de <strong className="text-blue-700 dark:text-blue-400">{avgFocusWithGoodSleep.toFixed(1)}/10</strong> cuando duermes más de 7 puntos.
                  </p>
                </div>
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">Energía Estable</span>
                  <p className="text-xs text-stone-700 dark:text-stone-300">
                    Tu energía física promedio se sitúa en <strong className="text-amber-700 dark:text-amber-400">{avgEnergyWithLowStress.toFixed(1)}/10</strong> cuando logras regular tu nivel de estrés por debajo de 5.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: CONSISTENCIA DE METAS (MITs)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'habitos' && (
        <div className="space-y-6 print:hidden animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* SER MITs */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase font-mono block">Mayordomía del SER</span>
              <p className="text-3xl font-extrabold text-emerald-600">{totalSerMITs} <span className="text-xs font-normal text-stone-500">completados</span></p>
              <p className="text-xs text-stone-500 leading-relaxed">Tareas prioritarias completadas para nutrir tu salud física, mental e intimidad espiritual.</p>
            </div>

            {/* NEGOCIO MITs */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase font-mono block">Mayordomía de Negocio</span>
              <p className="text-3xl font-extrabold text-blue-600">{totalBizMITs} <span className="text-xs font-normal text-stone-500">completados</span></p>
              <p className="text-xs text-stone-500 leading-relaxed">Acciones claves e iniciativas completadas para expandir e impactar con tu emprendimiento/ministerio.</p>
            </div>

            {/* RELACIONES MITs */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase font-mono block">Mayordomía Relacional</span>
              <p className="text-3xl font-extrabold text-rose-500">{totalRelMITs} <span className="text-xs font-normal text-stone-500">completados</span></p>
              <p className="text-xs text-stone-500 leading-relaxed">Tiempo de calidad dedicado intencionalmente a blindar y nutrir tu círculo íntimo familiar y oikos.</p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: ESPEJO DE IDENTIDAD Y CREENCIAS (ESPEJO DE CRECIMIENTO)       */}
      {/* ========================================================================= */}
      {activeTab === 'mentalidad' && (
        <div className="space-y-6 print:hidden animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-3 flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-emerald-500" /> Espejo de Identidad: Confrontación de Mentiras
            </h4>
            <p className="text-xs text-stone-500">
              Esta sección actúa como un espejo histórico de tu renovación mental. Compara las creencias limitantes que surgieron en tus días de crisis con la verdad bíblica con la que decidiste confrontarlas.
            </p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {mindsetHistory.length > 0 ? (
                mindsetHistory.map((e, idx) => (
                  <div key={e.id || idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-200/60 dark:border-stone-850/60 rounded-xl text-xs leading-relaxed">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-amber-600 uppercase font-mono">Creencia limitante detectada ({e.date}):</span>
                      <p className="text-stone-700 dark:text-stone-300 italic font-medium">"{e.mindsetLimitingBelief}"</p>
                    </div>
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 pt-3 md:pt-0 md:pl-4">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">Confrontado con la Verdad Bíblica:</span>
                      <p className="text-stone-800 dark:text-stone-200 font-serif">"{e.mindsetBiblicalTruth}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 text-center py-10 italic">Aún no registras confrontaciones de mentalidad en tus diarios diarios.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FORMATEADOR DE IMPRESIÓN TRIMESTRAL (PDF) --- */}
      {activePlan && (
        <div className="hidden print:block text-stone-900 bg-white p-8 space-y-8 max-w-4xl mx-auto font-sans leading-relaxed">
          <div className="border-b-4 border-stone-900 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight uppercase">Planeamiento Trimestral</h1>
              <p className="text-sm font-semibold tracking-wide text-stone-600 mt-1">Estructura del Ser al Legado</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">Trimestre: <span className="font-extrabold border-b-2 border-stone-900 px-2">{activePlan.quarterLabel}</span></p>
              <p className="text-xs font-mono text-stone-500 mt-1">Año: {activePlan.year}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-wider bg-stone-100 px-3 py-1.5 border-l-4 border-stone-900">Visión a 5 Años</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Espiritual:</strong>
                <p className="text-stone-800">{activePlan.fiveYearSpiritual || '—'}</p>
              </div>
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Ser (Identidad):</strong>
                <p className="text-stone-800">{activePlan.fiveYearBeing || '—'}</p>
              </div>
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Negocio:</strong>
                <p className="text-stone-800">{activePlan.fiveYearBusiness || '—'}</p>
              </div>
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Relaciones:</strong>
                <p className="text-stone-800">{activePlan.fiveYearRelations || '—'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-wider bg-stone-100 px-3 py-1.5 border-l-4 border-stone-900">Visión del Trimestre (Logros Concretos)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Espiritual:</strong>
                <p className="text-stone-800">{activePlan.quarterlySpiritual || '—'}</p>
              </div>
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Ser (Identidad):</strong>
                <p className="text-stone-800">{activePlan.quarterlyBeing || '—'}</p>
              </div>
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Negocio:</strong>
                <p className="text-stone-800">{activePlan.quarterlyBusiness || '—'}</p>
              </div>
              <div className="border border-stone-300 p-3 rounded-lg">
                <strong className="block text-xs uppercase text-stone-500 mb-1">Relaciones:</strong>
                <p className="text-stone-800">{activePlan.quarterlyRelations || '—'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wider bg-stone-100 px-3 py-1.5 border-l-4 border-stone-900">Objetivos del Trimestre — SMART</h2>
            <div className="space-y-2">
              {smartObjectives.map((obj: any, idx: number) => (
                <div key={obj.id || idx} className="flex justify-between items-center text-sm border-b border-stone-200 pb-2">
                  <p className="text-stone-850"><strong className="font-mono text-stone-400 mr-2">{idx + 1}.</strong> {obj.objective}</p>
                  <span className="text-xs font-mono text-stone-500">Vence: {obj.targetDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-wider bg-stone-100 px-3 py-1.5 border-l-4 border-stone-900">Plan de Acción (Meta 1-5)</h2>
            <div className="space-y-6">
              {metaPlans.map((plan: any, idx: number) => {
                const activeActions = plan.actions.filter((a: any) => a.action.trim() !== '');
                if (activeActions.length === 0) return null;
                return (
                  <div key={plan.metaIndex || idx} className="space-y-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide border-b border-stone-400 pb-1">{plan.metaTitle}</h3>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-300">
                          <th className="py-1.5 font-bold uppercase text-stone-500 w-[60%]">Acción Clave</th>
                          <th className="py-1.5 font-bold uppercase text-stone-500 w-[20%]">Frecuencia</th>
                          <th className="py-1.5 font-bold uppercase text-stone-500 w-[20%]">Indicador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {activeActions.map((row: any, rIdx: number) => (
                          <tr key={rIdx}>
                            <td className="py-2 text-stone-800">{row.action}</td>
                            <td className="py-2 text-stone-600 font-medium">{row.frequency}</td>
                            <td className="py-2 text-stone-600 italic">{row.indicator}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}