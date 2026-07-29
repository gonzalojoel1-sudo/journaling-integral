'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { completeOnboarding } from '../actions/user-settings';

const STEPS = [
  {
    question: '¿Tienes un negocio o emprendimiento activo?',
    description: 'Habilita el panel de Negocio 1-1-1, Centro de Mando y seguimiento de ventas.',
    field: 'showBusinessPanel',
  },
  {
    question: '¿Quieres llevar un control estricto de tus finanzas personales?',
    description: 'Activa Mi Capital, donuts de ingresos/gastos y el ledger personal.',
    field: 'showFinancePanel',
  },
  {
    question: '¿Te interesa hacer seguimiento de tus hábitos diarios?',
    description: 'Gestor EOR, Habit Stacking atómico y racha de disciplina.',
    field: 'showHabitsPanel',
  },
  {
    question: '¿Deseas habilitar la planificación trimestral y desafíos?',
    description: 'Visión 5 años, objetivos SMART, insignias, niveles y gamificación.',
    field: 'showQuarterlyPanel',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleAnswer = (value: boolean) => {
    const updated = { ...answers, [current.field]: value };
    if (current.field === 'showQuarterlyPanel') {
      updated.showChallengesPanel = value;
    }
    setAnswers(updated);

    if (isLast) {
      handleFinish(updated);
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = async (finalAnswers: Record<string, boolean>) => {
    setLoading(true);
    await completeOnboarding({
      showBusinessPanel: finalAnswers.showBusinessPanel || false,
      showFinancePanel: finalAnswers.showFinancePanel || false,
      showHabitsPanel: finalAnswers.showHabitsPanel || false,
      showQuarterlyPanel: finalAnswers.showQuarterlyPanel || false,
      showChallengesPanel: finalAnswers.showQuarterlyPanel || false,
    });
    router.push('/');
    router.refresh();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">
            Configurar Journaling
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Responde para personalizar tu experiencia
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < step ? 'w-6 bg-emerald-500' : i === step ? 'w-8 bg-zinc-300' : 'w-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-zinc-100 leading-snug">
              {current.question}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {current.description}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleAnswer(true)}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" /> Sí
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={loading}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 text-zinc-300 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              No
            </button>
          </div>

          {step > 0 && (
            <button
              onClick={handleBack}
              className="w-full flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-3"
            >
              <ArrowLeft className="h-3 w-3" /> Atrás
            </button>
          )}

          {loading && (
            <p className="text-xs text-zinc-500 text-center">Guardando preferencias...</p>
          )}
        </div>
      </div>
    </div>
  );
}
