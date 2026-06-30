'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Activity, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Heart,
  Target
} from 'lucide-react';

interface DailyEntry {
  id: string;
  date: string;
  sleepRating: number | null;
  energyRating: number | null;
  focusRating: number | null;
  stressRating: number | null;
  dailyMicroAchievement: string | null;
  mitSerCompleted: number;
  mitNegocioCompleted: number;
  mitRelacionesCompleted: number;
  bizIncome: number;
  bizSalesCount: number;
  bizContactsCount: number;
}

interface ReviewClientProps {
  weeklyEntries: DailyEntry[];
}

export function ReviewClient({ weeklyEntries }: ReviewClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const totalEntries = weeklyEntries.length;

  // --- 1. PROMEDIOS DE ESTA SEMANA ---
  const avgSleep = totalEntries > 0 ? weeklyEntries.reduce((acc, e) => acc + (e.sleepRating || 0), 0) / totalEntries : 0;
  const avgEnergy = totalEntries > 0 ? weeklyEntries.reduce((acc, e) => acc + (e.energyRating || 0), 0) / totalEntries : 0;
  const avgFocus = totalEntries > 0 ? weeklyEntries.reduce((acc, e) => acc + (e.focusRating || 0), 0) / totalEntries : 0;

  // --- 2. LOGROS COMPILADOS ---
  const achievements = weeklyEntries.map(e => ({ date: e.date, text: e.dailyMicroAchievement })).filter(a => a.text);

  // --- 3. RENDIMIENTO NEGOCIO ---
  const weeklyIncome = weeklyEntries.reduce((acc, e) => acc + e.bizIncome, 0);
  const weeklySales = weeklyEntries.reduce((acc, e) => acc + e.bizSalesCount, 0);
  const weeklyContacts = weeklyEntries.reduce((acc, e) => acc + e.bizContactsCount, 0);

  // --- 4. FORMULARIO RESET ---
  const [weeklyFocus, setWeeklyFocus] = useState('');
  const [task1, setPrep1] = useState('');
  const [task2, setPrep2] = useState('');
  const [task3, setPrep3] = useState('');
  const [relationToNutre, setRelationToNutre] = useState('');

  const handleFinishReset = () => {
    alert('Planificación Dominical registrada con éxito. Tu enfoque semanal se ha establecido.');
    router.push('/');
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Indicador de Pasos */}
      <div className="flex items-center justify-between bg-stone-100/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl">
        <span className="text-xs font-bold font-mono text-stone-500">Paso {step} de 4</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-2 w-8 rounded-full transition-all ${
                step >= s ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: CELEBRACIÓN DE MICRO-VICTORIAS                                    */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft space-y-5 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" />
              1. Celebración del Esfuerzo (Tus Logros Semanales)
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Antes de planificar lo nuevo, celebra lo avanzado. Tu cerebro necesita validar el esfuerzo para sostener la autoconfianza conductual.
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {achievements.length > 0 ? (
              achievements.map((ach, idx) => (
                <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-850/60 rounded-xl text-xs flex justify-between items-center">
                  <span className="font-bold text-stone-800 dark:text-stone-300">"{ach.text}"</span>
                  <span className="text-[10px] font-mono text-stone-500">{ach.date}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 italic text-center py-10">No registraste logros en la semana transcurrida. Procura completarlos diariamente.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: RENDIMIENTO FISIOLÓGICO SEMANAL                                   */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft space-y-6 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              2. Diagnóstico de Salud y Energía de la Semana
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Analiza tus variables de recarga. Si tus niveles son bajos, tu próximo plan semanal debe ser más conservador o priorizar el descanso.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200/60 text-center">
              <span className="text-[10px] font-bold text-stone-500 font-mono block uppercase">Promedio Sueño</span>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">{avgSleep.toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200/60 text-center">
              <span className="text-[10px] font-bold text-stone-500 font-mono block uppercase">Promedio Energía</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">{avgEnergy.toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200/60 text-center">
              <span className="text-[10px] font-bold text-stone-500 font-mono block uppercase">Promedio Enfoque</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">{avgFocus.toFixed(1)}/10</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: RENDIMIENTO DEL NEGOCIO Y CONVERSIÓN                              */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft space-y-6 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              3. Rendimiento Comercial Semanal
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Evalúa la mayordomía financiera. Tu negocio es tu motor de contribución en el mundo, mide tus acciones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200/60 text-center">
              <span className="text-[10px] font-bold text-stone-500 font-mono block uppercase">Ingresos Generados</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">${weeklyIncome.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200/60 text-center">
              <span className="text-[10px] font-bold text-stone-500 font-mono block uppercase">Ventas Cerradas</span>
              <p className="text-2xl font-extrabold text-stone-800 dark:text-stone-200 mt-2">{weeklySales} cierres</p>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200/60 text-center">
              <span className="text-[10px] font-bold text-stone-500 font-mono block uppercase">Nuevos Contactos</span>
              <p className="text-2xl font-extrabold text-stone-800 dark:text-stone-200 mt-2">{weeklyContacts} prospectos</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 4: RESET Y PLANIFICACIÓN SEMANAL 80/20                               */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft space-y-5 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              4. El Reset Semanal (Planificación 80/20)
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              No hagas todo, haz lo que corresponde. Diseña tu único Enfoque Dominante y las 3 prioridades de la próxima semana.
            </p>
          </div>

          <div className="space-y-4">
            {/* Enfoque Dominante */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono mb-2">
                Enfoque Dominante Semanal (La única cosa que mueve el 80%):
              </label>
              <input
                type="text" value={weeklyFocus} onChange={(e) => setWeeklyFocus(e.target.value)}
                placeholder="E.g., Validar propuesta de valor con clientes potenciales"
                className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>

            {/* Tres Tareas Clave */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
                Tres Acciones Semanales Críticas:
              </label>
              <input
                type="text" value={task1} onChange={(e) => setPrep1(e.target.value)}
                placeholder="1. Primera acción clave"
                className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 text-sm outline-none"
              />
              <input
                type="text" value={task2} onChange={(e) => setPrep2(e.target.value)}
                placeholder="2. Segunda acción clave"
                className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 text-sm outline-none"
              />
              <input
                type="text" value={task3} onChange={(e) => setPrep3(e.target.value)}
                placeholder="3. Tercera acción clave"
                className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 text-sm outline-none"
              />
            </div>

            {/* Persona a Nutrir */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono mb-2">
                Persona del Oikos a Nutrir (Relación prioritaria esta semana):
              </label>
              <input
                type="text" value={relationToNutre} onChange={(e) => setRelationToNutre(e.target.value)}
                placeholder="E.g., Cena exclusiva con mi cónyuge"
                className="w-full bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- BOTONES DE DESPLAZAMIENTO --- */}
      <div className="flex justify-between items-center">
        {step > 1 ? (
          <button
            type="button" onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
        ) : (
          <div></div>
        )}

        {step < 4 ? (
          <button
            type="button" onClick={() => setStep(step + 1)}
            className="flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
          >
            Siguiente Paso <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button" onClick={handleFinishReset}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow shadow-emerald-900"
          >
            <CheckCircle className="h-4 w-4" /> Finalizar Reset Semanal
          </button>
        )}
      </div>

    </div>
  );
}