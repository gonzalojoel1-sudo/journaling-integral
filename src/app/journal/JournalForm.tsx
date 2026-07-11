'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Heart, Brain, FileText, Briefcase, CheckSquare, Save, Loader2, Check } from 'lucide-react';
import { FlowStep } from './FlowStep';
import { PlanBModal } from './PlanBModal';
import { StepEnergia, getEnergiaSummary } from './steps/StepEnergia';
import { StepGratitud, getGratitudSummary } from './steps/StepGratitud';
import { StepIdentidad, getIdentidadSummary } from './steps/StepIdentidad';
import { StepDevocional, getDevocionalSummary } from './steps/StepDevocional';
import { StepNegocio, getNegocioSummary } from './steps/StepNegocio';
import { StepCierre, getCierreSummary } from './steps/StepCierre';
import { useAutosave } from './useAutosave';
import { submitDailyEntry } from '../actions/daily-journal';
import { SmartDictationButton } from '@/components/SmartDictationButton';

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

interface SubmitResult {
  levelUpgraded: boolean;
  newLevel: number;
  badgeUnlocked: any | null;
}

export function JournalForm({ userLevel, existingEntry, habitsList }: JournalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const [showPlanBModal, setShowPlanBModal] = useState(!existingEntry);
  const [isPlanB, setIsPlanB] = useState(false);

  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = userLevel === 1 ? 4 : 6;

  const [isPlanBUsed, setIsPlanBUsed] = useState<boolean>(existingEntry?.isPlanBUsed === 1 || false);

  const [sleepRating, setSleepRating] = useState<number>(existingEntry?.sleepRating ?? 7);
  const [energyRating, setEnergyRating] = useState<number>(existingEntry?.energyRating ?? 7);
  const [focusRating, setFocusRating] = useState<number>(existingEntry?.focusRating ?? 7);
  const [stressRating, setStressRating] = useState<number>(existingEntry?.stressRating ?? 5);
  const [quickEnergyAction, setQuickEnergyAction] = useState<string>(existingEntry?.quickEnergyAction ?? '');

  const [gratitude1, setGratitude1] = useState<string>(existingEntry?.gratitude1 ?? '');
  const [gratitude2, setGratitude2] = useState<string>(existingEntry?.gratitude2 ?? '');
  const [gratitude3, setGratitude3] = useState<string>(existingEntry?.gratitude3 ?? '');
  const [wisdomRequest, setWisdomRequest] = useState<string>(existingEntry?.wisdomRequest ?? '');

  const [chooseToBeIdentity, setChooseToBeIdentity] = useState<string>(existingEntry?.chooseToBeIdentity ?? 'PRESENTE');
  const [identityAction, setIdentityAction] = useState<string>(existingEntry?.identityAction ?? '');
  const [dailyMicroAchievement, setDailyMicroAchievement] = useState<string>(existingEntry?.dailyMicroAchievement ?? '');

  const [devotionalNotes, setDevotionalNotes] = useState<string>(existingEntry?.devotionalNotes ?? '');
  const [dailyHabits, setDailyHabits] = useState<any[]>(() => {
    if (existingEntry?.dailyHabitsJson) {
      return JSON.parse(existingEntry.dailyHabitsJson);
    }
    return habitsList.map(h => ({ habitId: h.id, name: h.name, type: h.type, completed: false }));
  });

  const [mitSer, setMitSer] = useState<string>(existingEntry?.mitSer ?? '');
  const [mitSerCompleted, setMitSerCompleted] = useState<boolean>(existingEntry?.mitSerCompleted === 1);
  const [mitNegocio, setMitNegocio] = useState<string>(existingEntry?.mitNegocio ?? '');
  const [mitNegocioCompleted, setMitNegocioCompleted] = useState<boolean>(existingEntry?.mitNegocioCompleted === 1);
  const [mitRelaciones, setMitRelaciones] = useState<string>(existingEntry?.mitRelaciones ?? '');
  const [mitRelacionesCompleted, setMitRelacionesCompleted] = useState<boolean>(existingEntry?.mitRelacionesCompleted === 1);

  const [whatWorked, setWhatWorked] = useState<string>(existingEntry?.whatWorked ?? '');
  const [whatDidNotWork, setWhatDidNotWork] = useState<string>(existingEntry?.whatDidNotWork ?? '');
  const [improvementIdea, setImprovementIdea] = useState<string>(existingEntry?.improvementIdea ?? '');
  const [prep1, setPrep1] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[0] : '');
  const [prep2, setPrep2] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[1] : '');
  const [prep3, setPrep3] = useState<string>(existingEntry?.prepTomorrowJson ? JSON.parse(existingEntry.prepTomorrowJson)[2] : '');

  const autosaveData = useMemo(() => ({
    sleepRating, energyRating, focusRating, stressRating, quickEnergyAction,
    gratitude1, gratitude2, gratitude3, wisdomRequest,
    chooseToBeIdentity, identityAction, dailyMicroAchievement,
    devotionalNotes, dailyHabits,
    mitSer, mitSerCompleted, mitNegocio, mitNegocioCompleted, mitRelaciones, mitRelacionesCompleted,
    whatWorked, whatDidNotWork, improvementIdea,
    prep1, prep2, prep3,
  }), [
    sleepRating, energyRating, focusRating, stressRating, quickEnergyAction,
    gratitude1, gratitude2, gratitude3, wisdomRequest,
    chooseToBeIdentity, identityAction, dailyMicroAchievement,
    devotionalNotes, dailyHabits,
    mitSer, mitSerCompleted, mitNegocio, mitNegocioCompleted, mitRelaciones, mitRelacionesCompleted,
    whatWorked, whatDidNotWork, improvementIdea,
    prep1, prep2, prep3,
  ]);

  const mockSave = useCallback(async (data: Record<string, unknown>) => {
    await new Promise((r) => setTimeout(r, 800));
    console.log('[Autosave] Borrador guardado:', data);
  }, []);

  const { isSaving, lastSaved, hasChanges } = useAutosave({
    data: autosaveData,
    onSave: mockSave,
    delay: 3000,
    enabled: !showPlanBModal && !isPlanB,
  });

  const formatTimeSince = (date: Date | null): string => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `hace ${minutes}m`;
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const handleSelectMode = (planB: boolean) => {
    setIsPlanB(planB);
    setShowPlanBModal(false);
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= activeStep || completedSteps.has(stepNumber)) {
      setActiveStep(stepNumber);
    }
  };

  const handleCompleteStep = () => {
    setCompletedSteps(prev => new Set([...prev, activeStep]));
    if (activeStep < totalSteps) {
      setActiveStep(activeStep + 1);
    }
  };

  const getStepState = (stepNumber: number): 'completed' | 'active' | 'pending' => {
    if (completedSteps.has(stepNumber)) return 'completed';
    if (stepNumber === activeStep) return 'active';
    return 'pending';
  };

  const handleSmartDictation = useCallback((data: any) => {
    if (data.energy) {
      if (data.energy.sleepRating != null) setSleepRating(data.energy.sleepRating);
      if (data.energy.energyRating != null) setEnergyRating(data.energy.energyRating);
      if (data.energy.focusRating != null) setFocusRating(data.energy.focusRating);
      if (data.energy.stressRating != null) setStressRating(data.energy.stressRating);
      if (data.energy.quickEnergyAction) setQuickEnergyAction(data.energy.quickEnergyAction);
    }
    if (data.gratitude) {
      if (data.gratitude.items?.length) {
        setGratitude1(data.gratitude.items[0] || '');
        setGratitude2(data.gratitude.items[1] || '');
        setGratitude3(data.gratitude.items[2] || '');
      }
      if (data.gratitude.wisdomRequest) setWisdomRequest(data.gratitude.wisdomRequest);
    }
    if (data.identity) {
      if (data.identity.chooseToBe) setChooseToBeIdentity(data.identity.chooseToBe);
      if (data.identity.action) setIdentityAction(data.identity.action);
      if (data.identity.microAchievement) setDailyMicroAchievement(data.identity.microAchievement);
    }
    if (data.devotional?.notes) {
      setDevotionalNotes(data.devotional.notes);
    }
    if (data.habits?.completedNames?.length) {
      setDailyHabits((prev) =>
        prev.map((h) => {
          const matched = data.habits.completedNames.some(
            (name: string) => {
              const lower = name.toLowerCase();
              const habitLower = h.name.toLowerCase();
              return lower.includes(habitLower) || habitLower.includes(lower);
            }
          );
          return matched ? { ...h, completed: true } : h;
        })
      );
    }
    if (data.mit) {
      if (data.mit.ser) setMitSer(data.mit.ser);
      if (data.mit.serCompleted != null) setMitSerCompleted(data.mit.serCompleted);
      if (data.mit.negocio) setMitNegocio(data.mit.negocio);
      if (data.mit.negocioCompleted != null) setMitNegocioCompleted(data.mit.negocioCompleted);
      if (data.mit.relaciones) setMitRelaciones(data.mit.relaciones);
      if (data.mit.relacionesCompleted != null) setMitRelacionesCompleted(data.mit.relacionesCompleted);
    }
    if (data.closure) {
      if (data.closure.whatWorked) setWhatWorked(data.closure.whatWorked);
      if (data.closure.whatDidNotWork) setWhatDidNotWork(data.closure.whatDidNotWork);
      if (data.closure.improvementIdea) setImprovementIdea(data.closure.improvementIdea);
      if (data.closure.prepTomorrow?.length) {
        setPrep1(data.closure.prepTomorrow[0] || '');
        setPrep2(data.closure.prepTomorrow[1] || '');
        setPrep3(data.closure.prepTomorrow[2] || '');
      }
    }
  }, []);

  const buildFormData = (): Record<string, any> => ({
    isPlanBUsed,
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
    dailyHabits,
    mitSer,
    mitSerCompleted,
    mitNegocio,
    mitNegocioCompleted,
    mitRelaciones,
    mitRelacionesCompleted,
    whatWorked,
    whatDidNotWork,
    improvementIdea,
    prepTomorrow: [prep1, prep2, prep3].filter(Boolean),
  });

  const handleFormSubmit = async () => {
    setLoading(true);
    setError(null);
    setSubmitResult(null);

    try {
      const result = await submitDailyEntry(buildFormData());

      if (!result.success) {
        setError(result.error || 'Error desconocido al guardar.');
        setLoading(false);
        return;
      }

      setSubmitResult({
        levelUpgraded: result.levelUpgraded || false,
        newLevel: result.newLevel || userLevel,
        badgeUnlocked: result.badgeUnlocked || null,
      });
      setSuccess(true);

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2500);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  if (showPlanBModal) {
    return <PlanBModal onSelectMode={handleSelectMode} />;
  }

  if (isPlanB) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="surface-elevated p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-xl bg-amber-500/10 items-center justify-center">
              <Activity className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Plan B: Sostener la Presencia
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Solo lo esencial para mantener tu racha
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                Hoy elijo SER:
              </label>
              <input
                type="text"
                value={chooseToBeIdentity}
                onChange={(e) => setChooseToBeIdentity(e.target.value)}
                placeholder="Ej. PACIENTE, PRESENTE, AGRADECIDO"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                Acción específica para demostrarlo:
              </label>
              <input
                type="text"
                value={identityAction}
                onChange={(e) => setIdentityAction(e.target.value)}
                placeholder="Ej. Escuchar 5 mins sin mirar el celular"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                Gracias Dios por:
              </label>
              <input
                type="text"
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                placeholder="Ej. Por la salud de mi familia hoy"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={loading || isSaving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white font-bold px-6 py-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {loading ? 'Guardando...' : existingEntry ? 'Actualizar Plan B' : 'Guardar Registro Plan B'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Diario del Día
            </h1>
            <SmartDictationButton
              dailyHabits={dailyHabits}
              onDataExtracted={handleSmartDictation}
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {completedSteps.size} de {totalSteps} pasos completados
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-xs font-mono text-zinc-400">
            {completedSteps.size === totalSteps ? '¡Listo para cerrar!' : 'En progreso'}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Guardando...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Guardado {formatTimeSince(lastSaved)}
                </span>
              </>
            ) : hasChanges ? (
              <span className="text-zinc-400">Cambios sin guardar</span>
            ) : null}
          </div>
        </div>
      </div>

      <FlowStep
        stepNumber={1}
        title="Energía"
        icon={<Activity className="h-4 w-4" />}
        state={getStepState(1)}
        summary={getEnergiaSummary(sleepRating, energyRating, focusRating, stressRating)}
        onToggle={() => handleStepClick(1)}
        accentColor="sky"
      >
        <StepEnergia
          sleepRating={sleepRating}
          setSleepRating={setSleepRating}
          energyRating={energyRating}
          setEnergyRating={setEnergyRating}
          focusRating={focusRating}
          setFocusRating={setFocusRating}
          stressRating={stressRating}
          setStressRating={setStressRating}
          quickEnergyAction={quickEnergyAction}
          setQuickEnergyAction={setQuickEnergyAction}
        />
        {!completedSteps.has(1) && activeStep === 1 && (
          <button
            type="button"
            onClick={handleCompleteStep}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Completar y Continuar
          </button>
        )}
      </FlowStep>

      <FlowStep
        stepNumber={2}
        title="Gratitud"
        icon={<Heart className="h-4 w-4" />}
        state={getStepState(2)}
        summary={getGratitudSummary(gratitude1, gratitude2, gratitude3)}
        onToggle={() => handleStepClick(2)}
        accentColor="rose"
      >
        <StepGratitud
          gratitude1={gratitude1}
          setGratitude1={setGratitude1}
          gratitude2={gratitude2}
          setGratitude2={setGratitude2}
          gratitude3={gratitude3}
          setGratitude3={setGratitude3}
          wisdomRequest={wisdomRequest}
          setWisdomRequest={setWisdomRequest}
        />
        {!completedSteps.has(2) && activeStep === 2 && (
          <button
            type="button"
            onClick={handleCompleteStep}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Completar y Continuar
          </button>
        )}
      </FlowStep>

      <FlowStep
        stepNumber={3}
        title="Identidad"
        icon={<Brain className="h-4 w-4" />}
        state={getStepState(3)}
        summary={getIdentidadSummary(chooseToBeIdentity)}
        onToggle={() => handleStepClick(3)}
        accentColor="violet"
      >
        <StepIdentidad
          chooseToBeIdentity={chooseToBeIdentity}
          setChooseToBeIdentity={setChooseToBeIdentity}
          identityAction={identityAction}
          setIdentityAction={setIdentityAction}
          dailyMicroAchievement={dailyMicroAchievement}
          setDailyMicroAchievement={setDailyMicroAchievement}
        />
        {!completedSteps.has(3) && activeStep === 3 && (
          <button
            type="button"
            onClick={handleCompleteStep}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Completar y Continuar
          </button>
        )}
      </FlowStep>

      <FlowStep
        stepNumber={4}
        title="Devocional y Hábitos"
        icon={<FileText className="h-4 w-4" />}
        state={getStepState(4)}
        summary={getDevocionalSummary(devotionalNotes, dailyHabits)}
        onToggle={() => handleStepClick(4)}
        accentColor="amber"
      >
        <StepDevocional
          devotionalNotes={devotionalNotes}
          setDevotionalNotes={setDevotionalNotes}
          dailyHabits={dailyHabits}
          setDailyHabits={setDailyHabits}
        />
        {!completedSteps.has(4) && activeStep === 4 && (
          <button
            type="button"
            onClick={handleCompleteStep}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Completar y Continuar
          </button>
        )}
      </FlowStep>

      {userLevel >= 2 && (
        <FlowStep
          stepNumber={5}
          title="MIT's"
          icon={<Briefcase className="h-4 w-4" />}
          state={getStepState(5)}
          summary={getNegocioSummary(mitSer, mitNegocio, mitRelaciones, [mitSerCompleted, mitNegocioCompleted, mitRelacionesCompleted].filter(Boolean).length)}
          onToggle={() => handleStepClick(5)}
          accentColor="emerald"
        >
          <StepNegocio
            mitSer={mitSer}
            setMitSer={setMitSer}
            mitSerCompleted={mitSerCompleted}
            setMitSerCompleted={setMitSerCompleted}
            mitNegocio={mitNegocio}
            setMitNegocio={setMitNegocio}
            mitNegocioCompleted={mitNegocioCompleted}
            setMitNegocioCompleted={setMitNegocioCompleted}
            mitRelaciones={mitRelaciones}
            setMitRelaciones={setMitRelaciones}
            mitRelacionesCompleted={mitRelacionesCompleted}
            setMitRelacionesCompleted={setMitRelacionesCompleted}
          />
          {!completedSteps.has(5) && activeStep === 5 && (
            <button
              type="button"
              onClick={handleCompleteStep}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Completar y Continuar
            </button>
          )}
        </FlowStep>
      )}

      {userLevel >= 2 && (
        <FlowStep
          stepNumber={6}
          title="Cierre y Mañana"
          icon={<CheckSquare className="h-4 w-4" />}
          state={getStepState(6)}
          summary={getCierreSummary(whatWorked, prep1)}
          onToggle={() => handleStepClick(6)}
          accentColor="cyan"
        >
          <StepCierre
            whatWorked={whatWorked}
            setWhatWorked={setWhatWorked}
            whatDidNotWork={whatDidNotWork}
            setWhatDidNotWork={setWhatDidNotWork}
            improvementIdea={improvementIdea}
            setImprovementIdea={setImprovementIdea}
            prep1={prep1}
            setPrep1={setPrep1}
            prep2={prep2}
            setPrep2={setPrep2}
            prep3={prep3}
            setPrep3={setPrep3}
          />
          {!completedSteps.has(6) && activeStep === 6 && (
            <button
              type="button"
              onClick={handleCompleteStep}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Completar y Continuar
            </button>
          )}
        </FlowStep>
      )}

      {completedSteps.size === totalSteps && (
        <div className="surface-elevated p-6 mt-8">
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={loading || isSaving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white font-bold px-6 py-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {loading ? 'Guardando...' : existingEntry ? 'Actualizar Diario' : 'Guardar y Cerrar Día'}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="space-y-3">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold animate-pulse">
            ¡Guardado exitoso! Redireccionando al dashboard...
          </div>

          {submitResult?.levelUpgraded && (
            <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 rounded-xl text-center">
              <p className="text-sm font-extrabold text-violet-700 dark:text-violet-400">
                ¡Subiste al Nivel {submitResult.newLevel}!
              </p>
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
                Tu constancia está dando frutos.
              </p>
            </div>
          )}

          {submitResult?.badgeUnlocked && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-center">
              <p className="text-sm font-extrabold text-amber-700 dark:text-amber-400">
                ¡Insignia desbloqueada!
              </p>
              <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                {submitResult.badgeUnlocked.area} — {submitResult.badgeUnlocked.mineral}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
