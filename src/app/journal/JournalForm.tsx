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
  Smile,
  CheckCircle2
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'energia' | 'espiritual' | 'negocio' | 'mentalidad'>('energia');

  // --- ESTADO PARA LA GUÍA DE VERSÍCULOS EN EL DEVOCIONAL ---
  const [devotionalTopic, setDevotionalTopic] = useState<'Dominio Propio' | 'Finanzas' | 'Crecimiento' | 'Identidad'>('Dominio Propio');
  const [guidedVerse, setGuidedVerse] = useState<any | null>(null);
  const [loadingVerse, setLoadingVerse] = useState<boolean>(false);

  // Función para refrescar o rotar el versículo según el tópico activo
  const refreshVerse = async () => {
    setLoadingVerse(true);
    const v = await getVersesByTopic(devotionalTopic);
    setGuidedVerse(v);
    setLoadingVerse(false);
  };

  useEffect(() => {
    refreshVerse();
  }, [devotionalTopic]);

  // --- ESTADOS LOCALES DE CAMPOS DE ENTRADA ---
  const [isPlanB, setIsPlanB] = useState<boolean>(existingEntry?.isPlanBUsed === 1 || false);
  
  // Nivel 1: Energía
  const [sleepRating, setSleepRating] = useState<number>(existingEntry?.sleepRating ?? 7);
  const [energyRating, setEnergyRating] = useState<number>(existingEntry?.energyRating ?? 7);
  const [focusRating, setFocusRating] = useState<number>(existingEntry?.focusRating ?? 7);
  const [stressRating, setStressRating] = useState<number>(existingEntry?.stressRating ?? 5);
  const [quickEnergyAction, setQuickEnergyAction] = useState<string>(existingEntry?.quickEnergyAction ?? '');

  // Nivel 1: Gratitud e Identidad
  const [gratitude1, setGratitude1] = useState<string>(existingEntry?.gratitude1 ?? '');
  const [gratitude2, setGratitude2] = useState<string>(existingEntry?.gratitude2 ?? '');
  const [gratitude3, setGratitude3] = useState<string>(existingEntry?.gratitude3 ?? '');
  const [wisdomRequest, setWisdomRequest] = useState<string>(existingEntry?.wisdomRequest ?? '');
  const [chooseToBeIdentity, setChooseToBeIdentity] = useState<string>(existingEntry?.chooseToBeIdentity ?? 'PRESENTE');
  const [identityAction, setIdentityAction] = useState<string>(existingEntry?.identityAction ?? '');
  const [dailyMicroAchievement, setDailyMicroAchievement] = useState<string>(existingEntry?.dailyMicroAchievement ?? '');

  // Devocional Diario
  const [devotionalNotes, setDevotionalNotes] = useState<string>(existingEntry?.devotionalNotes ?? '');

  // Nivel 2: Autoeducación
  const [eduSubject, setEduSubject] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).subject : '');
  const [eduFormat, setEduFormat] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).format : '');
  const [eduLesson, setEduLesson] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).lesson : '');
  const [eduKeyIdeas, setEduKeyIdeas] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).keyIdeas : '');
  const [eduObstacle, setEduObstacle] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).obstacle : '');
  const [eduFiveMinAction, setEduFiveMinAction] = useState<string>(existingEntry?.autoeducation ? JSON.parse(existingEntry.autoeducation).fiveMinAction : '');

  // Nivel 2: MITs
  const [mitSer, setMitSer] = useState<string>(existingEntry?.mitSer ?? '');
  const [mitSerCompleted, setMitSerCompleted] = useState<boolean>(existingEntry?.mitSerCompleted === 1);
  const [mitNegocio, setMitNegocio] = useState<string>(existingEntry?.mitNegocio ?? '');
  const [mitNegocioCompleted, setMitNegocioCompleted] = useState<boolean>(existingEntry?.mitNegocioCompleted === 1);
  const [mitRelaciones, setMitRelaciones] = useState<string>(existingEntry?.mitRelaciones ?? '');
  const [mitRelacionesCompleted, setMitRelacionesCompleted] = useState<boolean>(existingEntry?.mitRelacionesCompleted === 1);

  // Nivel 2: Checklist de Hábitos EOR
  const parseSavedHabits = () => {
    if (existingEntry?.dailyHabitsJson) {
      return JSON.parse(existingEntry.dailyHabitsJson);
    }
    return habitsList.map(h => ({ habitId: h.id, name: h.name, type: h.type, completed: false }));
  };
  const [dailyHabits, setDailyHabits] = useState<any[]>(parseSavedHabits());

  // --- NUEVA REGLA 1-1-1 CON SOPORTE DE TEXTO E ILUMINACIÓN ---
  const parseSavedBizActions = () => {
    if (existingEntry?.bizActionsSpecific) {
      try {
        return JSON.parse(existingEntry.bizActionsSpecific);
      } catch (e) {
        // Fallback si no estaba en JSON antes
      }
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

  // Nivel 2: Revisión Diaria
  const [ach1, setAch1] = useState<string>(existingEntry?.achievementsTop3 ? JSON.parse(existingEntry.achievementsTop3)[0] : '');
  const [ach2, setAch2] = useState<string>(existingEntry?.achievementsTop3 ? JSON.parse(existingEntry.achievementsTop3)[1] : '');
  const [ach3, setAch3] = useState<string>(existingEntry?.achievementsTop3 ? JSON.parse(existingEntry.achievementsTop3)[2] : '');
  const [whatWorked, setWhatWorked] = useState<string>(existingEntry?.whatWorked ?? '');
  const [whatDidNotWork, setWhatDidNotWork] = useState<string>(existingEntry?.whatDidNotWork ?? '');
  const [improvementIdea, setImprovementIdea] = useState<string>(existingEntry?.improvementIdea ?? '');

  // Nivel 2 & 3: Negocio
  const [bizContactsCount, setBizContactsCount] = useState<number>(existingEntry?.bizContactsCount ?? 0);
  const [bizSalesCount, setBizSalesCount] = useState<number>(existingEntry?.bizSalesCount ?? 0);
  const [bizIncome, setBizIncome] = useState<number>(existingEntry?.bizIncome ?? 0);
  const [bizExpenses, setBizExpenses] = useState<number>(existingEntry?.bizExpenses ?? 0);
  const [bizImprovementTomorrow, setBizImprovementTomorrow] = useState<string>(existingEntry?.bizImprovementTomorrow ?? '');

  // Nivel 2 & 3: Mentalidad y Creencias
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

  // Preparación de mañana
  const [prep1, setPrep1] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[0] : '');
  const [prep2, setPrep2] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[1] : '');
  const [prep3, setPrep3] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[2] : '');

  // Nivel 3: Legado y Mayordomía
  const [legacyReflection, setLegacyReflection] = useState<string>(existingEntry?.legacyReflection ?? '');
  const [dominantFocusCompleted, setDominantFocusCompleted] = useState<boolean>(existingEntry?.dominantFocusCompleted === 1);

  const handleHabitCheck = (index: number) => {
    const updated = [...dailyHabits];
    updated[index].completed = !updated[index].completed;
    setDailyHabits(updated);
  };

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

      // Estructura adaptada del Módulo de Negocio 1-1-1
      payload.bizProspectCompleted = bizActions.prospectCompleted ? 1 : 0;
      payload.bizFollowUpCompleted = bizActions.followUpCompleted ? 1 : 0;
      payload.bizMktActionCompleted = bizActions.mktCompleted ? 1 : 0;
      payload.bizActionsSpecific = JSON.stringify(bizActions); // Empaquetado como JSON para no saturar DB

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Botón rápido del Plan B para días con fatiga o viajes */}
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

      {/* --- RENDERIZADO VERSIÓN PLAN B --- */}
      {isPlanB ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Plan B: Sostener la Presencia
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Hoy elijo SER:</label>
              <input
                type="text"
                value={chooseToBeIdentity}
                onChange={(e) => setChooseToBeIdentity(e.target.value)}
                placeholder="Ej. PACIENTE, PRESENTE, AGRADECIDO"
                className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Acción específica para demostrarlo:</label>
              <input
                type="text"
                value={identityAction}
                onChange={(e) => setIdentityAction(e.target.value)}
                placeholder="Ej. Escuchar 5 mins sin mirar el celular"
                className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Gracias Dios por (un agradecimiento hoy):</label>
              <input
                type="text"
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                placeholder="Ej. Por la salud de mi familia hoy."
                className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        /* --- RENDERIZADO NORMAL POR NIVELES --- */
        <>
          {/* Sistema de pestañas para Nivel 2 y 3 */}
          {userLevel >= 2 && (
            <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('energia')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'energia' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-stone-500'
                }`}
              >
                1. Energía e Identidad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('espiritual')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'espiritual' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-stone-500'
                }`}
              >
                2. Espiritual y Hábitos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('negocio')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'negocio' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-stone-500'
                }`}
              >
                3. Negocio y Ejecución
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mentalidad')}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'mentalidad' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-stone-500'
                }`}
              >
                4. Mentalidad y Creencias
              </button>
            </div>
          )}

          {/* TAB 1: ENERGÍA, GRATITUD E IDENTIDAD */}
          {(userLevel === 1 || activeTab === 'energia') && (
            <div className="space-y-6">
              {/* Bloque: Chequeo de Energía */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-6 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 border-b border-stone-150 dark:border-stone-850 pb-2">
                  <Activity className="h-5 w-5 text-emerald-500 shrink-0" /> Chequeo de Energía Global
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Sueño */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                      <span>Sueño / Descanso:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sleepRating}/10</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={sleepRating} onChange={(e) => setSleepRating(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  {/* Energía */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                      <span>Nivel de Energía Física:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{energyRating}/10</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={energyRating} onChange={(e) => setEnergyRating(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  {/* Enfoque */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                      <span>Nivel de Enfoque Mental:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{focusRating}/10</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={focusRating} onChange={(e) => setFocusRating(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  {/* Estrés */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-500 mb-2 font-mono">
                      <span>Nivel de Estrés / Tensión:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{stressRating}/10</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={stressRating} onChange={(e) => setStressRating(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Acción rápida hoy para mejorar energía:</label>
                    <input
                      type="text"
                      value={quickEnergyAction}
                      onChange={(e) => setQuickEnergyAction(e.target.value)}
                      placeholder="Ej. Beber 500ml de agua o respirar hondo 3 veces"
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Oración y Gratitud */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 border-b border-stone-150 dark:border-stone-850 pb-2">
                  <Heart className="h-5 w-5 text-emerald-500 shrink-0" /> Oración y Gratitud
                </h3>
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Hoy agradezco a Dios por:</label>
                  <input
                    type="text" value={gratitude1} onChange={(e) => setGratitude1(e.target.value)}
                    placeholder="1. Escribir un agradecimiento sincero"
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text" value={gratitude2} onChange={(e) => setGratitude2(e.target.value)}
                    placeholder="2. Segundo agradecimiento"
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text" value={gratitude3} onChange={(e) => setGratitude3(e.target.value)}
                    placeholder="3. Tercer agradecimiento"
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Pido sabiduría para:</label>
                  <input
                    type="text" value={wisdomRequest} onChange={(e) => setWisdomRequest(e.target.value)}
                    placeholder="Ej. Tomar decisiones difíciles en la reunión de la tarde"
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Bloque: Identidad y Micro-ejecución */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 border-b border-stone-150 dark:border-stone-850 pb-2">
                  <Brain className="h-5 w-5 text-emerald-500 shrink-0" /> Enfoque y Responsabilidad Coherente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Hoy elijo SER:</label>
                    <input
                      type="text" value={chooseToBeIdentity} onChange={(e) => setChooseToBeIdentity(e.target.value)}
                      placeholder="Ej. PACIENTE, GENEROSO, ENFOCADO"
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Acción específica de identidad:</label>
                    <input
                      type="text" value={identityAction} onChange={(e) => setIdentityAction(e.target.value)}
                      placeholder="Acción concreta que sustenta la elección"
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">Logro del día de hoy (aunque sea pequeño):</label>
                    <input
                      type="text" value={dailyMicroAchievement} onChange={(e) => setDailyMicroAchievement(e.target.value)}
                      placeholder="Micro-victoria celebrada"
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* --- BLOQUE: DEVOCIONAL DIARIO MULTI-COLUMNAS CON REFRESH DE VERSÍCULO --- */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2 flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-emerald-500" /> Devocional y Quietud Diaria
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Izquierda: Cuadro de entrada de notas */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Reflexión, notas y apuntes espirituales:</label>
                    <textarea
                      value={devotionalNotes} onChange={(e) => setDevotionalNotes(e.target.value)}
                      placeholder="Escribe aquí tus reflexiones o lo aprendido el día de hoy."
                      rows={6}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Derecha: Escritura de Guía Temática Interactiva + Refresh */}
                  <div className="bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-255 dark:border-stone-800 pb-2">
                        <span className="text-[9px] font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          Guía Devocional
                        </span>
                        
                        <div className="flex items-center gap-3">
                          {/* Selector de Tópicos */}
                          <select
                            value={devotionalTopic}
                            onChange={(e: any) => setDevotionalTopic(e.target.value)}
                            className="bg-transparent text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase outline-none cursor-pointer focus:text-emerald-600"
                          >
                            <option value="Dominio Propio">Dominio Propio</option>
                            <option value="Finanzas">Dinero y Finanzas</option>
                            <option value="Crecimiento">Crecimiento</option>
                            <option value="Identidad">Identidad</option>
                          </select>

                          {/* Botón de Refrescar Versículo */}
                          <button
                            type="button"
                            onClick={refreshVerse}
                            disabled={loadingVerse}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                            title="Rotar otro versículo de este tópico"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${loadingVerse ? 'animate-spin text-emerald-600' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {guidedVerse ? (
                        <div className={`mt-4 transition-opacity duration-300 ${loadingVerse ? 'opacity-30' : 'opacity-100'}`}>
                          <p className="text-xs italic text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
                            "{guidedVerse.text}"
                          </p>
                          <span className="block text-[10px] font-bold text-stone-500 text-right mt-2 font-mono">
                            — {guidedVerse.reference}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 mt-4 italic">Cargando versículo...</p>
                      )}
                    </div>

                    {guidedVerse?.interpretation && (
                      <div className={`mt-4 border-t border-stone-255 dark:border-stone-800 pt-3 text-[10px] text-stone-500 leading-relaxed transition-opacity duration-300 ${loadingVerse ? 'opacity-30' : 'opacity-100'}`}>
                        <span className="font-bold text-stone-700 dark:text-stone-300 uppercase block font-mono text-[9px] mb-0.5">Enfoque:</span>
                        {guidedVerse.interpretation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOEDUCACIÓN Y HÁBITOS */}
          {userLevel >= 2 && activeTab === 'espiritual' && (
            <div className="space-y-6">
              {/* Autoeducación */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
                  Autoeducación Aplicada (Aprender → Actuar)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Materia de hoy:</label>
                    <input
                      type="text" value={eduSubject} onChange={(e) => setEduSubject(e.target.value)}
                      placeholder="Ej. Finanzas personales" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Formato:</label>
                    <input
                      type="text" value={eduFormat} onChange={(e) => setEduFormat(e.target.value)}
                      placeholder="Ej. Libro, Podcast, Mentoría" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-stone-500 font-bold mb-1">Aprendizaje Clave:</label>
                    <textarea
                      value={eduLesson} onChange={(e) => setEduLesson(e.target.value)}
                      placeholder="¿Qué aprendiste hoy de valor?" rows={2}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">¿Qué me impide aplicar?:</label>
                    <input
                      type="text" value={eduObstacle} onChange={(e) => setEduObstacle(e.target.value)}
                      placeholder="Ej. Impaciencia" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Acción para los próximos 5 minutos:</label>
                    <input
                      type="text" value={eduFiveMinAction} onChange={(e) => setEduFiveMinAction(e.target.value)}
                      placeholder="Ej. Configurar débito automático de ahorro" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Registro de Hábitos del Día */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
                  Registro de Hábitos EOR (Check de Cumplimiento)
                </h3>
                {dailyHabits.length > 0 ? (
                  <div className="space-y-3">
                    {dailyHabits.map((habit, idx) => {
                      const isStack = habit.strategyDetails?.includes('"isStack":true') || habit.type === 'STACK';
                      const stackData = isStack && habit.strategyDetails ? JSON.parse(habit.strategyDetails) : null;

                      return (
                        <div key={habit.habitId || idx} className="flex items-start justify-between p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl transition-all-fresco">
                          {isStack && stackData ? (
                            /* Visualización de Dopamina Premium para Habit Stacking */
                            <div className="flex-1 space-y-2 pr-4">
                              <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-amber-600 dark:text-amber-400">Circuito de Dopamina Activado</span>
                              </div>
                              <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1">
                                <p>1. Ancla: <strong className="text-stone-900 dark:text-stone-100">{stackData.anchor}</strong></p>
                                <p>2. Acción 1%: <strong className="text-stone-900 dark:text-stone-100">{stackData.action}</strong></p>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">3. Celebrar de inmediato: <em>{stackData.reward}</em></p>
                              </div>
                            </div>
                          ) : (
                            /* Visualización Habit Ordinario */
                            <div className="flex-1 pr-4">
                              <span className="text-sm font-bold text-stone-800 dark:text-stone-200 block">{habit.name}</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase block mt-1">{habit.type}</span>
                            </div>
                          )}
                          
                          <input
                            type="checkbox"
                            checked={habit.completed}
                            onChange={() => handleHabitCheck(idx)}
                            className="h-5 w-5 accent-emerald-600 rounded border-stone-300 mt-1 cursor-pointer shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">No tienes hábitos registrados. Agrégalos en el panel de hábitos.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NEGOCIO Y EJECUCIÓN (MITs) */}
          {userLevel >= 2 && activeTab === 'negocio' && (
            <div className="space-y-6">
              {/* TOP 3 MITs */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
                  TOP 3 MIT's (Most Important Tasks)
                </h3>
                <div className="space-y-4">
                  {/* SER */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox" checked={mitSerCompleted} onChange={() => setMitSerCompleted(!mitSerCompleted)}
                      className="h-5 w-5 accent-emerald-600 rounded"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono">SER (Identidad/Salud):</label>
                      <input
                        type="text" value={mitSer} onChange={(e) => setMitSer(e.target.value)}
                        placeholder="Ej. Beber agua y estirar por la mañana"
                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  {/* NEGOCIO */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox" checked={mitNegocioCompleted} onChange={() => setMitNegocioCompleted(!mitNegocioCompleted)}
                      className="h-5 w-5 accent-emerald-600 rounded"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono">NEGOCIO (Contribución/Foco):</label>
                      <input
                        type="text" value={mitNegocio} onChange={(e) => setMitNegocio(e.target.value)}
                        placeholder="E.g., Avanzar 1 hora en propuesta de cliente"
                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  {/* RELACIONES */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox" checked={mitRelacionesCompleted} onChange={() => setMitRelacionesCompleted(!mitRelacionesCompleted)}
                      className="h-5 w-5 accent-emerald-600 rounded"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono">FAMILIA / RELACIONES:</label>
                      <input
                        type="text" value={mitRelaciones} onChange={(e) => setMitRelaciones(e.target.value)}
                        placeholder="Ej. Llamar a mis padres y conversar"
                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- MÓDULO DE NEGOCIO INTERACTIVO (1-1-1) CON ILUMINACIÓN --- */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
                  Módulo de Negocio (Regla 1-1-1 y Mayordomía)
                </h3>
                
                <div className="space-y-3">
                  {/* Prospecto */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                    bizActions.prospectCompleted 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-stone-500 line-through' 
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850'
                  }`}>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase font-mono mb-1">1. Prospecto Nuevo (Escribe la acción):</label>
                      <input
                        type="text"
                        value={bizActions.prospectText}
                        onChange={(e) => handleBizActionChange('prospectText', e.target.value)}
                        placeholder="Ej. Identificar 1 prospecto frío en LinkedIn y contactar"
                        className="bg-transparent w-full text-xs outline-none"
                      />
                    </div>
                    <input
                      type="checkbox"
                      checked={bizActions.prospectCompleted}
                      onChange={(e) => handleBizActionChange('prospectCompleted', e.target.checked)}
                      className="h-5 w-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Seguimiento */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                    bizActions.followUpCompleted 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-stone-500 line-through' 
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850'
                  }`}>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase font-mono mb-1">2. Seguimiento (Escribe la acción):</label>
                      <input
                        type="text"
                        value={bizActions.followUpText}
                        onChange={(e) => handleBizActionChange('followUpText', e.target.value)}
                        placeholder="Ej. Volverle a escribir a 1 persona que contacté y no respondió"
                        className="bg-transparent w-full text-xs outline-none"
                      />
                    </div>
                    <input
                      type="checkbox"
                      checked={bizActions.followUpCompleted}
                      onChange={(e) => handleBizActionChange('followUpCompleted', e.target.checked)}
                      className="h-5 w-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Acción MKT */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                    bizActions.mktCompleted 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-stone-500 line-through' 
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850'
                  }`}>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase font-mono mb-1">3. Acción MKT / Publicación (Escribe la acción):</label>
                      <input
                        type="text"
                        value={bizActions.mktText}
                        onChange={(e) => handleBizActionChange('mktText', e.target.value)}
                        placeholder="Ej. Publicar un carrusel de valor sobre mi servicio"
                        className="bg-transparent w-full text-xs outline-none"
                      />
                    </div>
                    <input
                      type="checkbox"
                      checked={bizActions.mktCompleted}
                      onChange={(e) => handleBizActionChange('mktCompleted', e.target.checked)}
                      className="h-5 w-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-mono">Contactos:</label>
                    <input
                      type="number" value={bizContactsCount} onChange={(e) => setBizContactsCount(Number(e.target.value))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-mono">Ventas:</label>
                    <input
                      type="number" value={bizSalesCount} onChange={(e) => setBizSalesCount(Number(e.target.value))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-mono">Ingresos ($):</label>
                    <input
                      type="number" step="0.01" value={bizIncome} onChange={(e) => setBizIncome(Number(e.target.value))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-mono">Egresos ($):</label>
                    <input
                      type="number" step="0.01" value={bizExpenses} onChange={(e) => setBizExpenses(Number(e.target.value))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MENTALIDAD, CREENCIAS Y REVISIÓN */}
          {userLevel >= 2 && activeTab === 'mentalidad' && (
            <div className="space-y-6">
              {/* Mentalidad */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
                  Mentalidad y Creencias de Reino
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Emoción Primaria del día:</label>
                    <input
                      type="text" value={mindsetEmotion1} onChange={(e) => setMindsetEmotion1(e.target.value)}
                      placeholder="Ej. Ansiedad, Plenitud, Duda" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Gatillos (Triggers):</label>
                    <input
                      type="text" value={mindsetTriggers} onChange={(e) => setMindsetTriggers(e.target.value)}
                      placeholder="¿Qué originó esta emoción?" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-stone-500 font-bold mb-1">Verdad Bíblica que confronta:</label>
                    <input
                      type="text" value={mindsetBiblicalTruth} onChange={(e) => setMindsetBiblicalTruth(e.target.value)}
                      placeholder="Ej. No temeré, pues Tú estás conmigo" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Creencia limitante a quitar:</label>
                    <input
                      type="text" value={mindsetLimitingBelief} onChange={(e) => setMindsetLimitingBelief(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 font-bold mb-1">Creencia potenciadora a sembrar:</label>
                    <input
                      type="text" value={mindsetEmpoweringBelief} onChange={(e) => setMindsetEmpoweringBelief(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Nivel 3: Mayordomía de Legado */}
              {userLevel === 3 && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2">
                    Nivel 3: Mayordomía y Legado Generacional
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-stone-500 font-bold mb-1">Reflexión de Legado (¿Qué dirán de mí en mi funeral?):</label>
                      <textarea
                        value={legacyReflection} onChange={(e) => setLegacyReflection(e.target.value)}
                        placeholder="Reflexión de alineación espiritual a largo plazo." rows={3}
                        className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox" checked={dominantFocusCompleted} onChange={() => setDominantFocusCompleted(!dominantFocusCompleted)}
                        className="h-5 w-5 accent-emerald-600 rounded"
                      />
                      <label className="text-sm font-bold text-stone-700 dark:text-stone-300">¿Completé mi Enfoque Dominante 80/20 hoy?</label>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PREPARACIÓN PARA MAÑANA (EVITAR REACTIVIDAD) --- */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-bold text-stone-800 dark:text-stone-200 border-b border-stone-150 dark:border-stone-850 pb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Preparación para Mañana (Evitar Reactividad)
                </h3>
                <p className="text-xs text-stone-500">
                  Escribe las tres acciones estratégicas más importantes que destrabarán tu día de mañana. Al guardarlas, se cargarán de forma interactiva en tu Panel de Inicio mañana al despertar.
                </p>
                <div className="space-y-2">
                  <input
                    type="text" value={prep1} onChange={(e) => setPrep1(e.target.value)}
                    placeholder="1. Primera acción estratégica del día de mañana" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text" value={prep2} onChange={(e) => setPrep2(e.target.value)}
                    placeholder="2. Segunda acción estratégica" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text" value={prep3} onChange={(e) => setPrep3(e.target.value)}
                    placeholder="3. Tercera acción estratégica" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- MENSAJES DE RESPUESTA --- */}
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

      {/* --- SECCIÓN DE GUARDADO --- */}
      <div className="flex justify-end gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-400 text-white font-bold px-6 py-3.5 rounded-xl transition-colors text-sm shadow-md cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar Registro Diario'}
        </button>
      </div>

    </form>
  );
}