'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitDailyEntry, getVersesByTopic } from '../actions/journal';
import { 
  Heart, 
  Activity, 
  Brain, 
  Save, 
  Sparkles, 
  AlertTriangle,
  FileText,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Smile,
  CheckCircle,
  CheckSquare,
  BookOpen,
  TrendingUp,
  Award
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  type: string;
  strategyDetails: string | null;
}

interface JournalFormProps {
  userLevel: number;
  existingEntry: any | null;
  habitsList: Habit[];
}

export function JournalForm({ userLevel, existingEntry, habitsList }: JournalFormProps) {
  const router = useRouter();

  // --- 1. DECLARACIONES DE ESTADO (SIEMPRE AL INICIO DEL COMPONENTE) ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Sistema de pasos (Wizard)
  const [step, setStep] = useState<number>(1);
  const totalSteps = userLevel === 1 ? 4 : 6;

  // Guía Devocional
  const [devotionalTopic, setDevotionalTopic] = useState<'Dominio Propio' | 'Finanzas' | 'Crecimiento' | 'Identidad'>('Dominio Propio');
  const [guidedVerse, setGuidedVerse] = useState<any | null>(null);
  const [loadingVerse, setLoadingVerse] = useState<boolean>(false);

  // Activador de Plan B rápido
  const [isPlanB, setIsPlanB] = useState<boolean>(existingEntry?.isPlanBUsed === 1 || false);
  
  // Paso 1: Energía
  const [sleepRating, setSleepRating] = useState<number>(existingEntry?.sleepRating ?? 7);
  const [energyRating, setEnergyRating] = useState<number>(existingEntry?.energyRating ?? 7);
  const [focusRating, setFocusRating] = useState<number>(existingEntry?.focusRating ?? 7);
  const [stressRating, setStressRating] = useState<number>(existingEntry?.stressRating ?? 5);
  const [quickEnergyAction, setQuickEnergyAction] = useState<string>(existingEntry?.quickEnergyAction ?? '');

  // Paso 2: Gratitud
  const [gratitude1, setGratitude1] = useState<string>(existingEntry?.gratitude1 ?? '');
  const [gratitude2, setGratitude2] = useState<string>(existingEntry?.gratitude2 ?? '');
  const [gratitude3, setGratitude3] = useState<string>(existingEntry?.gratitude3 ?? '');
  const [wisdomRequest, setWisdomRequest] = useState<string>(existingEntry?.wisdomRequest ?? '');

  // Paso 3: Identidad y Micro-ejecución
  const [chooseToBeIdentity, setChooseToBeIdentity] = useState<string>(existingEntry?.chooseToBeIdentity ?? 'PRESENTE');
  const [identityAction, setIdentityAction] = useState<string>(existingEntry?.identityAction ?? '');
  const [dailyMicroAchievement, setDailyMicroAchievement] = useState<string>(existingEntry?.dailyMicroAchievement ?? '');

  // Paso 4: Devocional Diario y Hábitos
  const [devotionalNotes, setDevotionalNotes] = useState<string>(existingEntry?.devotionalNotes ?? '');
  
  const parseSavedHabits = () => {
    if (existingEntry?.dailyHabitsJson) {
      return JSON.parse(existingEntry.dailyHabitsJson);
    }
    return habitsList.map(h => ({ habitId: h.id, name: h.name, type: h.type, completed: false }));
  };
  const [dailyHabits, setDailyHabits] = useState<any[]>(parseSavedHabits());

  // Paso 5: Autoeducación (Nivel 2)
  const [eduSubject, setEduSubject] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).subject : '');
  const [eduFormat, setEduFormat] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).format : '');
  const [eduLesson, setEduLesson] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).lesson : '');
  const [eduKeyIdeas, setEduKeyIdeas] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).keyIdeas : '');
  const [eduObstacle, setEduObstacle] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).obstacle : '');
  const [eduFiveMinAction, setEduFiveMinAction] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).fiveMinAction : '');

  // Paso 5: MITs (Nivel 2)
  const [mitSer, setMitSer] = useState<string>(existingEntry?.mitSer ?? '');
  const [mitSerCompleted, setMitSerCompleted] = useState<boolean>(existingEntry?.mitSerCompleted === 1);
  const [mitNegocio, setMitNegocio] = useState<string>(existingEntry?.mitNegocio ?? '');
  const [mitNegocioCompleted, setMitNegocioCompleted] = useState<boolean>(existingEntry?.mitNegocioCompleted === 1);
  const [mitRelaciones, setMitRelaciones] = useState<string>(existingEntry?.mitRelaciones ?? '');
  const [mitRelacionesCompleted, setMitRelacionesCompleted] = useState<boolean>(existingEntry?.mitRelacionesCompleted === 1);

  // Paso 5: Módulo de Negocio 1-1-1 (Nivel 2)
  const parseSavedBizActions = () => {
    if (existingEntry?.bizActionsSpecific) {
      try {
        return JSON.parse(existingEntry.bizActionsSpecific);
      } catch (e) {}
    }
    return {
      prospectText: '',
      prospectCompleted: existingEntry?.bizProspectCompleted === 1,
      followUpText: '',
      followUpCompleted: existingEntry?.bizFollowUpCompleted === 1,
      mktText: '',
      mktCompleted: existingEntry?.bizMktActionCompleted === 1
    };
  };
  const [bizActions, setBizActions] = useState(parseSavedBizActions());

  const handleBizActionChange = (field: string, value: any) => {
    setBizActions({ ...bizActions, [field]: value });
  };

  const [bizContactsCount, setBizContactsCount] = useState<number>(existingEntry?.bizContactsCount ?? 0);
  const [bizSalesCount, setBizSalesCount] = useState<number>(existingEntry?.bizSalesCount ?? 0);
  const [bizIncome, setBizIncome] = useState<number>(existingEntry?.bizIncome ?? 0);
  const [bizExpenses, setBizExpenses] = useState<number>(existingEntry?.bizExpenses ?? 0);
  const [bizImprovementTomorrow, setBizImprovementTomorrow] = useState<string>(existingEntry?.bizImprovementTomorrow ?? '');

  // Paso 5 & 6: Logros de Revisión y Reset Diario
  const [ach1, setAch1] = useState<string>(existingEntry?.achievementsTop3 ? JSON.parse(existingEntry.achievementsTop3)[0] : '');
  const [ach2, setAch2] = useState<string>(existingEntry?.achievementsTop3 ? JSON.parse(existingEntry.achievementsTop3)[1] : '');
  const [ach3, setAch3] = useState<string>(existingEntry?.achievementsTop3 ? JSON.parse(existingEntry.achievementsTop3)[2] : '');

  // NUEVAS VARIABLES DE REVISIÓN SEMANAL/DIARIA (Faltaban declarar)
  const [whatWorked, setWhatWorked] = useState<string>(existingEntry?.whatWorked ?? '');
  const [whatDidNotWork, setWhatDidNotWork] = useState<string>(existingEntry?.whatDidNotWork ?? '');
  const [improvementIdea, setImprovementIdea] = useState<string>(existingEntry?.improvementIdea ?? '');

  // Paso 6: Mentalidad (Nivel 2)
  const [mindsetStateRating, setMindsetStateRating] = useState<number>(existingEntry?.mindsetStateRating ?? 7);
  const [mindsetEmotion1, setMindsetEmotion1] = useState<string>(existingEntry?.mindsetEmotion1 ?? '');
  const [mindsetEmotion2, setMindsetEmotion2] = useState<string>(existingEntry?.mindsetEmotion2 ?? '');
  const [mindsetEmotion3, setMindsetEmotion3] = useState<string>(existingEntry?.mindsetEmotion3 ?? '');
  const [mindsetTriggers, setMindsetTriggers] = useState<string>(existingEntry?.mindsetTriggers ?? '');
  const [mindsetBiblicalTruth, setMindsetBiblicalTruth] = useState<string>(existingEntry?.mindsetBiblicalTruth ?? '');
  const [mindsetLimitingBelief, setMindsetLimitingBelief] = useState<string>(existingEntry?.mindsetLimitingBelief ?? '');
  const [mindsetLimitingAction, setMindsetLimitingAction] = useState<string>(existingEntry?.mindsetLimitingAction ?? '');
  const [mindsetEmpoweringBelief, setMindsetEmpoweringBelief] = useState<string>(existingEntry?.mindsetEmpoweringBelief ?? '');
  const [mindsetEmpoweringAction, setMindsetEmpoweringAction] = useState<string>(existingEntry?.mindsetEmpoweringAction ?? '');

  // Paso 6: Reset de mañana (Nivel 2)
  const [prep1, setPrep1] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[0] : '');
  const [prep2, setPrep2] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[1] : '');
  const [prep3, setPrep3] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[2] : '');

  // Paso 6: Legado (Nivel 3)
  const [legacyReflection, setLegacyReflection] = useState<string>(existingEntry?.legacyReflection ?? '');
  const [dominantFocusCompleted, setDominantFocusCompleted] = useState<boolean>(existingEntry?.dominantFocusCompleted === 1);

  // --- 2. FUNCIONES DE AYUDA Y EFECTOS ---
  const refreshVerse = async () => {
    setLoadingVerse(true);
    const v = await getVersesByTopic(devotionalTopic);
    setGuidedVerse(v);
    setLoadingVerse(false);
  };

  useEffect(() => {
    refreshVerse();
  }, [devotionalTopic]);

  const handleHabitCheck = (index: number) => {
    const updated = [...dailyHabits];
    updated[index].completed = !updated[index].completed;
    setDailyHabits(updated);
  };

  // --- 3. FUNCIÓN DE GUARDADO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, any> = {
      isPlanBUsed: isPlanB,
      sleepRating,
      energyRating,
      focusRating,
      stressRating,
      quickEnergyAction,
      gratitude1,
      gratitude2,
      gratitude3,
      wisdomRequest,
      chooseToBeIdentity,
      identityAction,
      dailyMicroAchievement,
      devotionalNotes,
    };

    if (userLevel >= 2) {
      payload.autoeducation = {
        subject: eduSubject,
        format: eduFormat,
        lesson: eduLesson,
        keyIdeas: eduKeyIdeas,
        obstacle: eduObstacle,
        fiveMinAction: eduFiveMinAction
      };
      payload.mitSer = mitSer;
      payload.mitSerCompleted = mitSerCompleted;
      payload.mitNegocio = mitNegocio;
      payload.mitNegocioCompleted = mitNegocioCompleted;
      payload.mitRelaciones = mitRelaciones;
      payload.mitRelacionesCompleted = mitRelacionesCompleted;
      payload.dailyHabits = dailyHabits;
      payload.achievementsTop3 = [ach1, ach2, ach3].filter(Boolean);
      payload.whatWorked = whatWorked;
      payload.whatDidNotWork = whatDidNotWork;
      payload.improvementIdea = improvementIdea;

      // Guardado del Módulo de Negocio 1-1-1
      payload.bizProspectCompleted = bizActions.prospectCompleted ? 1 : 0;
      payload.bizFollowUpCompleted = bizActions.followUpCompleted ? 1 : 0;
      payload.bizMktActionCompleted = bizActions.mktCompleted ? 1 : 0;
      payload.bizActionsSpecific = JSON.stringify(bizActions);

      payload.bizContactsCount = bizContactsCount;
      payload.bizSalesCount = bizSalesCount;
      payload.bizIncome = bizIncome;
      payload.bizExpenses = bizExpenses;
      payload.bizImprovementTomorrow = bizImprovementTomorrow;
      payload.mindsetStateRating = mindsetStateRating;
      payload.mindsetEmotion1 = mindsetEmotion1;
      payload.mindsetEmotion2 = mindsetEmotion2;
      payload.mindsetEmotion3 = mindsetEmotion3;
      payload.mindsetTriggers = mindsetTriggers;
      payload.mindsetBiblicalTruth = mindsetBiblicalTruth;
      payload.mindsetLimitingBelief = mindsetLimitingBelief;
      payload.mindsetLimitingAction = mindsetLimitingAction;
      payload.mindsetEmpoweringBelief = mindsetEmpoweringBelief;
      payload.mindsetEmpoweringAction = mindsetEmpoweringAction;
      payload.prepTomorrow = [prep1, prep2, prep3].filter(Boolean);
    }

    if (userLevel === 3) {
      payload.legacyReflection = legacyReflection;
      payload.dominantFocusCompleted = dominantFocusCompleted;
    }

    const res = await submitDailyEntry(payload);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || 'No se pudo guardar la entrada.');
    }
  };

  const progressPercent = Math.min(Math.round((step / totalSteps) * 100), 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative max-w-4xl mx-auto">
      
      {/* --- EFECTO DE GRADIENTES DE FONDO (FRESCO) --- */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

      {/* --- INDICADOR DE PROGRESO DE WIZARD --- */}
      <div className="bg-white/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-soft backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold font-mono text-stone-500 mb-1.5 uppercase">
            <span>Paso {step} de {totalSteps}</span>
            <span>{progressPercent}% Completado</span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Botón rápido del Plan B para días con fatiga o viajes */}
      {step === 1 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">¿Día difícil, sin tiempo o en crisis?</p>
              <p className="text-xs text-amber-800 dark:text-amber-400">Sostén la racha con el Plan B rápido de 2 minutos.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPlanB(!isPlanB)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPlanB 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300 hover:bg-stone-350'
            }`}
          >
            {isPlanB ? 'Plan B Activo' : 'Usar Plan B'}
          </button>
        </div>
      )}

      {/* --- RENDERIZADO VERSIÓN PLAN B --- */}
      {isPlanB ? (
        <div className="bg-white/80 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-850 backdrop-blur-md rounded-3xl p-6 space-y-6 shadow-soft">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Plan B: Sostener la Presencia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Hoy elijo SER:</label>
              <input
                type="text" value={chooseToBeIdentity} onChange={(e) => setChooseToBeIdentity(e.target.value)}
                placeholder="Ej. PACIENTE, PRESENTE, AGRADECIDO"
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Acción específica para demostrarlo:</label>
              <input
                type="text" value={identityAction} onChange={(e) => setIdentityAction(e.target.value)}
                placeholder="Ej. Escuchar 5 mins sin mirar el celular"
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Gracias Dios por (un agradecimiento hoy):</label>
              <input
                type="text" value={gratitude1} onChange={(e) => setGratitude1(e.target.value)}
                placeholder="Ej. Por la salud de mi familia hoy."
                className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        /* --- RENDERIZADO DEL ASISTENTE PASO A PASO (WIZARD) --- */
        <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white/80 dark:bg-stone-900/70 backdrop-blur-md shadow-soft w-full">
          
          {/* PASO 1: CHEQUEO DE ENERGÍA */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500 shrink-0" />
                  Paso 1: ¿Cómo está tu energía física y mental hoy?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                    <span>Sueño / Descanso:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sleepRating}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={sleepRating} onChange={(e) => setSleepRating(Number(e.target.value))} className="w-full accent-emerald-600" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                    <span>Nivel de Energía Física:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{energyRating}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={energyRating} onChange={(e) => setEnergyRating(Number(e.target.value))} className="w-full accent-emerald-600" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                    <span>Nivel de Enfoque Mental:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{focusRating}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={focusRating} onChange={(e) => setFocusRating(Number(e.target.value))} className="w-full accent-emerald-600" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                    <span>Nivel de Estrés / Tensión:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{stressRating}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={stressRating} onChange={(e) => setStressRating(Number(e.target.value))} className="w-full accent-amber-600" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Acción rápida hoy para mejorar energía:</label>
                  <input type="text" value={quickEnergyAction} onChange={(e) => setQuickEnergyAction(e.target.value)} placeholder="Ej. Beber 500ml de agua o respirar hondo" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ORACIÓN Y GRATITUD */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-emerald-500 shrink-0" />
                  Paso 2: Oración y Gratitud
                </h3>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Hoy agradezco a Dios por:</label>
                <input type="text" value={gratitude1} onChange={(e) => setGratitude1(e.target.value)} placeholder="1. Escribir un agradecimiento sincero" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                <input type="text" value={gratitude2} onChange={(e) => setGratitude2(e.target.value)} placeholder="2. Segundo agradecimiento" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                <input type="text" value={gratitude3} onChange={(e) => setGratitude3(e.target.value)} placeholder="3. Tercer agradecimiento" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Pido sabiduría para:</label>
                  <input type="text" value={wisdomRequest} onChange={(e) => setWisdomRequest(e.target.value)} placeholder="Ej. Tomar decisiones difíciles en la reunión de la tarde" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: IDENTIDAD Y RESPONSABILIDAD */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-emerald-500 shrink-0" />
                  Paso 3: Enfoque, Identidad y Micro-Victoria
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Hoy elijo SER:</label>
                  <input type="text" value={chooseToBeIdentity} onChange={(e) => setChooseToBeIdentity(e.target.value)} placeholder="Ej. PACIENTE, GENEROSO, ENFOCADO" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Acción específica de identidad:</label>
                  <input type="text" value={identityAction} onChange={(e) => setIdentityAction(e.target.value)} placeholder="Acción concreta que sustenta la elección" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Logro del día de hoy (aunque sea pequeño):</label>
                  <input type="text" value={dailyMicroAchievement} onChange={(e) => setDailyMicroAchievement(e.target.value)} placeholder="Micro-victoria celebrada" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: DEVOCIONAL Y HÁBITOS EOR */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Paso 4: Devocional Diario y Consistencia EOR
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Reflexión y notas espirituales:</label>
                  <textarea value={devotionalNotes} onChange={(e) => setDevotionalNotes(e.target.value)} placeholder="Escribe aquí tus reflexiones o lo aprendido el día de hoy." rows={5} className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                      <span className="text-[9px] font-bold font-mono text-emerald-600 uppercase bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Guía Devocional</span>
                      <select value={devotionalTopic} onChange={(e: any) => setDevotionalTopic(e.target.value)} className="bg-transparent text-[10px] font-bold text-stone-500 uppercase outline-none cursor-pointer">
                        <option value="Dominio Propio">Dominio Propio</option>
                        <option value="Finanzas">Dinero y Finanzas</option>
                        <option value="Crecimiento">Crecimiento</option>
                        <option value="Identidad">Identidad</option>
                      </select>
                    </div>
                    {guidedVerse ? (
                      <div className="mt-4">
                        <p className="text-xs italic leading-relaxed font-serif">"{guidedVerse.text}"</p>
                        <span className="block text-[10px] font-bold text-stone-500 text-right mt-2 font-mono">— {guidedVerse.reference}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 mt-4 italic">Cargando versículo...</p>
                    )}
                  </div>
                  <button type="button" onClick={refreshVerse} className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1.5 mt-4"><RotateCw className="h-3.5 w-3.5" /> Rotar Versículo</button>
                </div>
              </div>

              {/* Registro de Hábitos */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Tus Hábitos del Día:</h4>
                {dailyHabits.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dailyHabits.map((habit, idx) => {
                      const isStack = habit.strategyDetails?.includes('"isStack":true') || habit.type === 'STACK';
                      const stackData = isStack && habit.strategyDetails ? JSON.parse(habit.strategyDetails) : null;
                      return (
                        <div key={habit.habitId || idx} className="flex items-start justify-between p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl">
                          {isStack && stackData ? (
                            <div className="flex-1 space-y-2 pr-4 text-xs">
                              <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-amber-600 block">Circuito de Dopamina</span>
                              <p>1. Ancla: <strong className="text-stone-900 dark:text-stone-100">{stackData.anchor}</strong></p>
                              <p>2. Acción 1%: <strong className="text-stone-900 dark:text-stone-100">{stackData.action}</strong></p>
                              <p className="text-emerald-600 dark:text-emerald-400">3. Premio: <em>{stackData.reward}</em></p>
                            </div>
                          ) : (
                            <div className="flex-1 pr-4">
                              <span className="text-sm font-bold text-stone-800 dark:text-stone-200 block">{habit.name}</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase block mt-1">{habit.type}</span>
                            </div>
                          )}
                          <input type="checkbox" checked={habit.completed} onChange={() => handleHabitCheck(idx)} className="h-5 w-5 accent-emerald-600 rounded cursor-pointer shrink-0 mt-1" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">No tienes hábitos registrados. Agrégalos en el panel de hábitos.</p>
                )}
              </div>
            </div>
          )}

          {/* PASO 5: NEGOCIO Y MAYORDOMÍA (Nivel 2) */}
          {userLevel >= 2 && step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-500 shrink-0" />
                  Paso 5: Mayordomía de Negocio y Regla 1-1-1
                </h3>
              </div>
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${bizActions.prospectCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-stone-500 line-through' : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850'}`}>
                  <div className="flex-1"><label className="block text-[10px] font-bold text-stone-400 uppercase font-mono mb-1">1. Prospecto Nuevo:</label>
                  <input type="text" value={bizActions.prospectText} onChange={(e) => handleBizActionChange('prospectText', e.target.value)} placeholder="Ej. Buscar y contactar a 1 prospecto frío" className="bg-transparent w-full text-xs outline-none" /></div>
                  <input type="checkbox" checked={bizActions.prospectCompleted} onChange={(e) => handleBizActionChange('prospectCompleted', e.target.checked)} className="h-5 w-5 accent-emerald-600 rounded cursor-pointer" />
                </div>
                <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${bizActions.followUpCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-stone-500 line-through' : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850'}`}>
                  <div className="flex-1"><label className="block text-[10px] font-bold text-stone-400 uppercase font-mono mb-1">2. Seguimiento:</label>
                  <input type="text" value={bizActions.followUpText} onChange={(e) => handleBizActionChange('followUpText', e.target.value)} placeholder="Ej. Volver a contactar a 1 cliente del mes anterior" className="bg-transparent w-full text-xs outline-none" /></div>
                  <input type="checkbox" checked={bizActions.followUpCompleted} onChange={(e) => handleBizActionChange('followUpCompleted', e.target.checked)} className="h-5 w-5 accent-emerald-600 rounded cursor-pointer" />
                </div>
                <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${bizActions.mktCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-stone-500 line-through' : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850'}`}>
                  <div className="flex-1"><label className="block text-[10px] font-bold text-stone-400 uppercase font-mono mb-1">3. Acción MKT:</label>
                  <input type="text" value={bizActions.mktText} onChange={(e) => handleBizActionChange('mktText', e.target.value)} placeholder="Ej. Publicar 1 carrusel de valor" className="bg-transparent w-full text-xs outline-none" /></div>
                  <input type="checkbox" checked={bizActions.mktCompleted} onChange={(e) => handleBizActionChange('mktCompleted', e.target.checked)} className="h-5 w-5 accent-emerald-600 rounded cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                <div><label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Contactos:</label><input type="number" value={bizContactsCount} onChange={(e) => setBizContactsCount(Number(e.target.value))} className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Ventas:</label><input type="number" value={bizSalesCount} onChange={(e) => setBizSalesCount(Number(e.target.value))} className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Ingresos ($):</label><input type="number" step="0.01" value={bizIncome} onChange={(e) => setBizIncome(Number(e.target.value))} className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Egresos ($):</label><input type="number" step="0.01" value={bizExpenses} onChange={(e) => setBizExpenses(Number(e.target.value))} className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none" /></div>
              </div>
            </div>
          )}

          {/* PASO 6: MENTALIDAD Y RESET DE MAÑANA (Nivel 2) */}
          {userLevel >= 2 && step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-emerald-500 shrink-0" />
                  Paso 6: Mentalidad, Revisión y Plan de Mañana
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs text-stone-500 font-bold mb-1">Emoción Primaria:</label><input type="text" value={mindsetEmotion1} onChange={(e) => setMindsetEmotion1(e.target.value)} placeholder="Ej. Plenitud, Ansiedad, Duda" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none" /></div>
                <div><label className="block text-xs text-stone-500 font-bold mb-1">Gatillos (Triggers):</label><input type="text" value={mindsetTriggers} onChange={(e) => setMindsetTriggers(e.target.value)} placeholder="¿Qué originó esta emoción?" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none" /></div>
                <div className="sm:col-span-2"><label className="block text-xs text-stone-500 font-bold mb-1">Verdad Bíblica que confronta:</label><input type="text" value={mindsetBiblicalTruth} onChange={(e) => setMindsetBiblicalTruth(e.target.value)} placeholder="Ej. No temeré, pues Tú estás conmigo" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none" /></div>
              </div>

              {/* Módulo de Revisión Diaria Integrado */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Revisión Retrospectiva del Día:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">¿Qué funcionó hoy?:</label>
                    <input type="text" value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} placeholder="Ej. El enfoque del trabajo profundo" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">¿Qué NO funcionó hoy?:</label>
                    <input type="text" value={whatDidNotWork} onChange={(e) => setWhatDidNotWork(e.target.value)} placeholder="Ej. Revisé redes sociales por cansancio" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Idea de mejora para mañana:</label>
                    <input type="text" value={improvementIdea} onChange={(e) => setImprovementIdea(e.target.value)} placeholder="Ej. Mantener celular bloqueado a la tarde" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Planificación de Mañana (Evitar Reactividad):</h4>
                <input type="text" value={prep1} onChange={(e) => setPrep1(e.target.value)} placeholder="1. Tarea unificadora 1" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2 text-sm outline-none" />
                <input type="text" value={prep2} onChange={(e) => setPrep2(e.target.value)} placeholder="2. Tarea unificadora 2" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2 text-sm outline-none" />
                <input type="text" value={prep3} onChange={(e) => setPrep3(e.target.value)} placeholder="3. Tarea unificadora 3" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- BOTONES DE CONTROL DE PASOS --- */}
      {!isPlanB && (
        <div className="flex justify-between items-center bg-white/70 dark:bg-stone-900/60 p-4 border border-stone-200 dark:border-stone-850 rounded-2xl shadow-soft backdrop-blur-md">
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

          {step < totalSteps ? (
            <button
              type="button" onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:opacity-90"
            >
              Siguiente Paso <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit" disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-400 text-white font-bold px-6 py-3.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer shadow-emerald-900/30"
            >
              <Save className="h-4 w-4" /> {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
          )}
        </div>
      )}

      {isPlanB && (
        <div className="flex justify-end p-4 bg-white/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-850 rounded-2xl shadow-soft backdrop-blur-md">
          <button
            type="submit" disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-400 text-white font-bold px-6 py-3.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer shadow-emerald-900/30"
          >
            <Save className="h-4 w-4" /> {loading ? 'Guardando...' : 'Guardar Registro Plan B'}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold animate-pulse">
          ¡Guardado exitoso! Redireccionando al dashboard...
        </div>
      )}

    </form>
  );
}