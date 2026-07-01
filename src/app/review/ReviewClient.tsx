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
  Heart,
  Thermometer,
  User,
  Percent,
  Calendar,
  Zap,
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

interface NuclearRelation {
  name: string;
  role: string;
  temp: number;
  undividedTime: boolean;
}

export function ReviewClient({ weeklyEntries }: ReviewClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const totalEntries = weeklyEntries.length;

  // --- 1. COMPILACIÓN Y CLASIFICACIÓN DE LOGROS (Paso 1) ---
  const achievements = weeklyEntries
    .map(e => {
      // Intentar clasificar el logro por el contenido de forma inteligente
      let category = 'Ser';
      let badgeColor = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
      
      const txt = (e.dailyMicroAchievement || '').toLowerCase();
      if (txt.includes('venta') || txt.includes('dinero') || txt.includes('cliente') || txt.includes('reunión') || txt.includes('negocio') || txt.includes('prospecto')) {
        category = 'Negocio';
        badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      } else if (txt.includes('orar') || txt.includes('biblia') || txt.includes('dios') || txt.includes('iglesia') || txt.includes('devocional')) {
        category = 'Espiritual';
        badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      }

      return {
        date: e.date,
        text: e.dailyMicroAchievement,
        category,
        badgeColor
      };
    })
    .filter(a => a.text);

  // --- 2. RENDIMIENTO COMERCIAL Y TASA DE CONVERSIÓN (Paso 2) ---
  const weeklyIncome = weeklyEntries.reduce((acc, e) => acc + e.bizIncome, 0);
  const weeklySales = weeklyEntries.reduce((acc, e) => acc + e.bizSalesCount, 0);
  const weeklyContacts = weeklyEntries.reduce((acc, e) => acc + e.bizContactsCount, 0);

  // Tasa de conversión de contactos a ventas (Cierres / Contactos * 100) en tiempo real
  const conversionRate = weeklyContacts > 0 ? (weeklySales / weeklyContacts) * 100 : 0;

  // --- 3. EL TERMÓMETRO DEL CÍRCULO ÍNTIMO NUCLEAR (Paso 3) ---
  const [nuclearRelations, setNuclearRelations] = useState<NuclearRelation[]>([
    { name: 'Cónyuge / Pareja', role: 'Relación Primaria', temp: 6, undividedTime: false },
    { name: 'Hijos / Familia Directa', role: 'Legado de Sangre', temp: 7, undividedTime: false },
    { name: 'Autocuidado (Templo del Espíritu)', role: 'Salud y Recarga', temp: 5, undividedTime: false },
    { name: 'Padres / Hermanos', role: 'Familia Nuclear', temp: 6, undividedTime: false }
  ]);

  const handleTempChange = (index: number, newTemp: number) => {
    const updated = [...nuclearRelations];
    updated[index].temp = newTemp;
    setNuclearRelations(updated);
  };

  const handleTimeToggle = (index: number) => {
    const updated = [...nuclearRelations];
    updated[index].undividedTime = !updated[index].undividedTime;
    setNuclearRelations(updated);
  };

  // --- 4. PLANIFICACIÓN SEMANAL ANTIRREACTIVA (Paso 4) ---
  const [weeklyFocus, setWeeklyFocus] = useState('');
  
  // Tareas de destrabe asignadas a días específicos
  const [task1, setPrep1] = useState('');
  const [day1, setDay1] = useState('Lunes');
  
  const [task2, setPrep2] = useState('');
  const [day2, setDay2] = useState('Miércoles');
  
  const [task3, setPrep3] = useState('');
  const [day3, setDay3] = useState('Viernes');

  const handleFinishReset = () => {
    alert('Planificación Semanal registrada con éxito. Tu enfoque, metas temporizadas y el termómetro relacional han sido configurados.');
    router.push('/');
    router.refresh();
  };

  // Estilos de temperatura relacional
  const getTempStyling = (temp: number) => {
    if (temp <= 4) {
      return {
        cardClass: 'border-blue-500/20 bg-blue-50/5 dark:bg-blue-950/5 shadow-blue-500/5',
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-900/10',
        alertText: 'Conexión baja. Dedica tiempo intencional y apaga el celular al estar juntos.',
        iconColor: 'text-blue-500'
      };
    } else if (temp <= 7) {
      return {
        cardClass: 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-emerald-500/5',
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-900/10',
        alertText: 'Relación estable. Sigue regando esta planta con atención proactiva.',
        iconColor: 'text-emerald-500'
      };
    } else {
      return {
        cardClass: 'border-amber-500/30 bg-amber-50/5 dark:bg-amber-950/5 shadow-amber-500/10 animate-pulse',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-900/10',
        alertText: '¡Conexión profunda y enérgica! Sigan nutriendo este espacio en armonía.',
        iconColor: 'text-amber-500'
      };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Indicador de pasos */}
      <div className="flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-sm">
        <span className="text-xs font-bold font-mono text-stone-500 uppercase">Alineación Estratégica Semanal</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-2.5 w-10 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-stone-200 dark:bg-stone-850'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: MURO DE LOGROS COMPILADOS Y CATEGORIZADOS                         */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-soft space-y-5 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500 shrink-0" />
              1. Muro de Logros Semanales (Clasificación Inteligente)
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Aquí tienes la bitácora de tus victorias del diario de los últimos 7 días. El balance te ayuda a ver dónde estás teniendo más impacto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {achievements.length > 0 ? (
              achievements.map((ach, idx) => (
                <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-850 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between">
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-300 italic leading-relaxed">
                    "{ach.text}"
                  </p>
                  <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-850 pt-2.5 mt-2">
                    <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded ${ach.badgeColor}`}>
                      {ach.category}
                    </span>
                    <span className="text-[9px] font-mono text-stone-400 font-bold">{ach.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-12 italic col-span-2">Aún no registras logros semanales en tu diario diario.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: MAYORDOMÍA COMERCIAL CON TASA DE CONVERSIÓN                       */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-soft space-y-6 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-500 shrink-0" />
              2. Módulo de Mayordomía Comercial de Alto Impacto
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Las finanzas reflejan tu tasa de servicio en el mercado. Evaluamos en tiempo real tu tasa de conversión de prospectos a cierres.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ingresos (Glass Emerald) */}
            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-emerald-500/5 text-center space-y-2">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono block uppercase">Ingresos Generados</span>
              <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">${weeklyIncome.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 italic">Mayordomía e ingresos totales</p>
            </div>

            {/* Ventas y Contactos (Glass Blue) */}
            <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-50/5 dark:bg-blue-950/5 shadow-blue-500/5 text-center space-y-2">
              <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 font-mono block uppercase">Embudo Comercial</span>
              <p className="text-4xl font-extrabold text-stone-800 dark:text-stone-100">{weeklySales}</p>
              <p className="text-[10px] text-stone-400 italic">Cierres de un total de {weeklyContacts} prospectos</p>
            </div>

            {/* Conversión Real (Glass Amber) */}
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-50/5 dark:bg-amber-950/5 shadow-amber-500/5 text-center space-y-2">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono block uppercase">Tasa de Conversión</span>
              <p className="text-4xl font-extrabold text-amber-600 dark:text-amber-500">{conversionRate.toFixed(1)}%</p>
              <p className="text-[10px] text-stone-400 italic">Porcentaje de éxito comercial</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: EL TERMÓMETRO DEL CÍRCULO ÍNTIMO NUCLEAR                          */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-soft space-y-6 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500 shrink-0" />
              3. El Termómetro de tu Círculo Íntimo Nuclear
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Mide la temperatura y la calidad de tus relaciones nucleares primarias. Es la barrera de paz que protege tu enfoque diario.
            </p>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {nuclearRelations.map((person, idx) => {
              const styles = getTempStyling(person.temp);
              return (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border transition-all duration-500 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${styles.cardClass}`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-stone-500" />
                      <h4 className="text-sm font-extrabold text-stone-850 dark:text-stone-100">{person.name}</h4>
                      <span className={`text-[9px] font-bold uppercase tracking-wider font-mono border px-2 py-0.5 rounded-full ${styles.badgeClass}`}>
                        {person.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-semibold">{styles.alertText}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                    {/* Deslizador */}
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-stone-400" />
                      <input
                        type="range" min="1" max="10"
                        value={person.temp}
                        onChange={(e) => handleTempChange(idx, Number(e.target.value))}
                        className="accent-emerald-600 w-24 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-stone-600 dark:text-stone-300 w-4">{person.temp}</span>
                    </div>

                    {/* Check */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={person.undividedTime}
                        onChange={() => handleTimeToggle(idx)}
                        className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <label className="text-[10px] font-bold uppercase text-stone-500 font-mono">¿Hubo tiempo de calidad?</label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 4: PLANIFICACIÓN SEMANAL ANTIRREACTIVA Y DE DESTRABE                 */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-soft space-y-5 animate-fade-in">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              4. Planificación Semanal 80/20 Antirreactiva
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Asigna tus tres tareas de destrabe de la semana entrante a un día específico. Esto liberará tu mente y previene la fatiga de decidir qué hacer cada mañana.
            </p>
          </div>

          <div className="space-y-5">
            {/* Enfoque Dominante */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono mb-2">
                Enfoque Dominante Semanal (La única cosa para la semana entrante):
              </label>
              <input
                type="text" value={weeklyFocus} onChange={(e) => setWeeklyFocus(e.target.value)}
                placeholder="Ej. Consolidar el MVP del servicio comercial con llamadas de diagnóstico"
                className="w-full bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none font-bold"
              />
            </div>

            {/* Tres Tareas Clave Temporizadas por Día */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono mb-1">
                Tres Acciones de Destrabe Semanales (Temporizadas):
              </label>
              
              {/* Acción 1 */}
              <div className="flex gap-2 items-center">
                <select
                  value={day1} onChange={(e) => setDay1(e.target.value)}
                  className="bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-xs font-bold w-28"
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                </select>
                <input
                  type="text" value={task1} onChange={(e) => setPrep1(e.target.value)}
                  placeholder="Acción clave de destrabe 1"
                  className="flex-1 bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 text-xs outline-none"
                />
              </div>

              {/* Acción 2 */}
              <div className="flex gap-2 items-center">
                <select
                  value={day2} onChange={(e) => setDay2(e.target.value)}
                  className="bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-xs font-bold w-28"
                >
                  <option value="Miércoles">Miércoles</option>
                  <option value="Martes">Martes</option>
                  <option value="Jueves">Jueves</option>
                </select>
                <input
                  type="text" value={task2} onChange={(e) => setPrep2(e.target.value)}
                  placeholder="Acción clave de destrabe 2"
                  className="flex-1 bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 text-xs outline-none"
                />
              </div>

              {/* Acción 3 */}
              <div className="flex gap-2 items-center">
                <select
                  value={day3} onChange={(e) => setDay3(e.target.value)}
                  className="bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-xs font-bold w-28"
                >
                  <option value="Viernes">Viernes</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Sábado">Sábado</option>
                </select>
                <input
                  type="text" value={task3} onChange={(e) => setPrep3(e.target.value)}
                  placeholder="Acción clave de destrabe 3"
                  className="flex-1 bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTONES DE DESPLAZAMIENTO --- */}
      <div className="flex justify-between items-center print:hidden">
        {step > 1 ? (
          <button
            type="button" onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-300 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
        ) : (
          <div></div>
        )}

        {step < 4 ? (
          <button
            type="button" onClick={() => setStep(step + 1)}
            className="flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
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