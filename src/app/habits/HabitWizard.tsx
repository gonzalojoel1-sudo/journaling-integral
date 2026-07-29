'use client';

import { useState, useRef, useEffect } from 'react';
import { createHabit } from '../actions/habits';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type WizardData = {
  name: string;
  type: 'crecer' | 'sembrar' | 'cambiar' | 'preciso' | 'pilar';
  anchor: string;
  rescueAction: string;
  celebration: string;
  domain: string;
  cue: string;
  oldRoutine: string;
  newRoutine: string;
};

const DOMAINS = [
  { id: 'cuerpo', label: 'Cuerpo', icon: '💪' },
  { id: 'mente', label: 'Mente', icon: '🧠' },
  { id: 'trabajo', label: 'Trabajo', icon: '💼' },
  { id: 'relaciones', label: 'Relaciones', icon: '👥' },
  { id: 'hogar', label: 'Hogar', icon: '🏠' },
  { id: 'espiritual', label: 'Espiritual', icon: '✨' },
  { id: 'finanzas', label: 'Finanzas', icon: '💰' },
];

export function HabitWizard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>({
    name: '',
    type: 'crecer',
    anchor: '',
    rescueAction: '',
    celebration: '',
    domain: '',
    cue: '',
    oldRoutine: '',
    newRoutine: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === 1 || step === 4 || step === 5 || step === 8) {
      stepInputRef.current?.focus();
    }
  }, [step]);

  const update = (partial: Partial<WizardData>) => setData(prev => ({ ...prev, ...partial }));

  const handleNext = () => setStep(prev => Math.min(prev + 1, 8) as Step);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1) as Step);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    const celebrationMap: Record<string, string> = {
      crecer: '✅ Hecho',
      sembrar: data.celebration || '🎉',
      cambiar: '🔄 Avance',
      preciso: '🎯 Ejecutado',
      pilar: '🏛️ Un paso más',
    };

    const result = await createHabit({
      name: data.name,
      habitType: data.type,
      domain: data.domain || undefined,
      rescueAction: data.rescueAction,
      anchor: data.anchor || undefined,
      celebration: data.celebration || celebrationMap[data.type],
      cue: data.cue || undefined,
      oldRoutine: data.oldRoutine || undefined,
      newRoutine: data.newRoutine || undefined,
    });

    if (!result.success) {
      setError(result.error || 'Error al crear el hábito');
      setIsSubmitting(false);
      return;
    }

    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
        {/* Step indicator */}
        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7,8].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-stone-800 dark:bg-stone-200' : 'bg-stone-200 dark:bg-stone-700'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">¿Qué hábito quieres crear o cambiar?</h2>
            <input
              ref={stepInputRef}
              type="text"
              value={data.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="Ej: Hacer ejercicio, meditar, dejar Instagram..."
              className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent"
            />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-stone-500">Cancelar</button>
              <button onClick={handleNext} disabled={!data.name.trim()} className="px-4 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Esto es algo que...</h2>
            <div className="space-y-3">
              <button
                onClick={() => { update({ type: 'crecer' }); handleNext(); }}
                className="w-full p-4 text-left border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <span className="text-lg">⚡ Quiero EMPEZAR a hacer desde cero</span>
                <p className="text-sm text-stone-500 mt-1">Un hábito nuevo que sume a mi vida</p>
              </button>
              <button
                onClick={() => { update({ type: 'cambiar' }); setStep(8); }}
                className="w-full p-4 text-left border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <span className="text-lg">🔄 Quiero DEJAR de hacer algo</span>
                <p className="text-sm text-stone-500 mt-1">Reemplazar un mal hábito por algo mejor</p>
              </button>
            </div>
            <button onClick={handleBack} className="text-sm text-stone-500">Atrás</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Al empezar, siento que...</h2>
            <div className="space-y-3">
              <button
                onClick={() => { update({ type: 'crecer' }); handleNext(); }}
                className="w-full p-4 text-left border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <span className="text-lg">⚡ Es fácil arrancar pero me cuesta mantenerlo</span>
              </button>
              <button
                onClick={() => { update({ type: 'sembrar' }); handleNext(); }}
                className="w-full p-4 text-left border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <span className="text-lg">🌱 Me da miedo, parece difícil, siempre lo dejo</span>
              </button>
            </div>
            <button onClick={handleBack} className="text-sm text-stone-500">Atrás</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">¿Después de qué momento del día harías esto?</h2>
            <input
              ref={stepInputRef}
              type="text"
              value={data.anchor}
              onChange={e => update({ anchor: e.target.value })}
              placeholder="Ej: después del café, al cepillarme los dientes..."
              className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent"
            />
            <p className="text-sm text-stone-500">Un ancla es una rutina que ya haces todos los días sin fallar</p>
            <div className="flex justify-end gap-2">
              <button onClick={handleBack} className="px-4 py-2 text-stone-500">Atrás</button>
              <button onClick={handleNext} disabled={!data.anchor.trim()} className="px-4 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Versión para un día difícil</h2>
            <p className="text-sm text-stone-500">Si tuvieras un día pésimo, sin energía... ¿cuál es la versión TAN pequeña que SÍ podrías hacer? (Debe tomar menos de 2 minutos)</p>
            <input
              ref={stepInputRef}
              type="text"
              value={data.rescueAction}
              onChange={e => update({ rescueAction: e.target.value })}
              placeholder="Ej: 1 sentadilla, leer 1 párrafo..."
              className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent"
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleBack} className="px-4 py-2 text-stone-500">Atrás</button>
              <button
                onClick={() => {
                  if (data.type !== 'sembrar') {
                    setStep(7);
                  } else {
                    handleNext();
                  }
                }}
                disabled={!data.rescueAction.trim()}
                className="px-4 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 6 && data.type === 'sembrar' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">¿Cómo te vas a celebrar?</h2>
            <p className="text-sm text-stone-500">La celebración fija el hábito en tu cerebro. Elige una:</p>
            <div className="grid grid-cols-2 gap-3">
              {['💪 Fist bump', '✅ "¡Hecho!"', '🎉 Yes!', '✨ Bien'].map(c => (
                <button
                  key={c}
                  onClick={() => { update({ celebration: c }); handleNext(); }}
                  className={`p-4 border rounded-xl text-center ${data.celebration === c ? 'border-stone-800 bg-stone-100 dark:border-stone-200 dark:bg-stone-800' : 'border-stone-300 dark:border-stone-700'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={handleBack} className="text-sm text-stone-500">Atrás</button>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">¿En qué área de tu vida encaja?</h2>
            <p className="text-sm text-stone-500">Selecciona el dominio principal de este hábito:</p>
            <div className="grid grid-cols-2 gap-3">
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => update({ domain: d.id })}
                  className={`p-4 border rounded-xl text-center hover:bg-stone-50 dark:hover:bg-stone-800 ${data.domain === d.id ? 'border-stone-800 bg-stone-100 dark:border-stone-200 dark:bg-stone-800' : 'border-stone-300 dark:border-stone-700'}`}
                >
                  <span className="text-2xl block mb-1">{d.icon}</span>
                  <span className="text-sm font-medium">{d.label}</span>
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* Ruta Neuronal Educativa */}
            {data.anchor || data.rescueAction ? (
              <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  ⚡ Ruta Neuronal
                </span>
                <div className="space-y-3 pt-3 relative">
                  {data.anchor && (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[9px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">1</div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">Ancla</span>
                          <p className="text-xs font-semibold text-stone-800 dark:text-stone-300 mt-0.5">{data.anchor}</p>
                        </div>
                      </div>
                      <div className="h-3 w-0.5 bg-emerald-500/40 absolute left-[9.5px]" style={{ top: '24px' }}></div>
                    </>
                  )}
                  {data.rescueAction && (
                    <div className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full text-[9px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 ${data.anchor ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-stone-200 dark:bg-stone-800 text-stone-600'}`}>2</div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">Acción</span>
                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-300 mt-0.5">{data.rescueAction}</p>
                      </div>
                    </div>
                  )}
                  {data.anchor && (
                    <>
                      <div className="h-3 w-0.5 bg-amber-500/40 absolute left-[9.5px]" style={{ top: data.rescueAction ? '62px' : '36px' }}></div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[9px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">3</div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">Celebración</span>
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5">{data.celebration || '✅ Hecho'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="border-t border-emerald-500/10 pt-3 mt-3 text-[9px] text-stone-500 leading-relaxed italic">
                  "La dopamina inmediata bloquea la ruta neuronal y la asienta en tu subconsciente." — James Clear.
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={handleBack} className="px-4 py-2 text-stone-500">Atrás</button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? 'Creando...' : 'Crear hábito'}
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cuéntame sobre el hábito que quieres dejar</h2>
            <input
              ref={stepInputRef}
              type="text"
              value={data.cue}
              onChange={e => update({ cue: e.target.value })}
              placeholder="¿Qué disparador desencadena ese hábito? (Ej: ver Instagram al despertar)"
              className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent"
            />
            <input
              type="text"
              value={data.oldRoutine}
              onChange={e => update({ oldRoutine: e.target.value })}
              placeholder="¿Qué haces exactamente? (Ej: abro Instagram y pierdo 20 min)"
              className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent"
            />
            <input
              type="text"
              value={data.newRoutine}
              onChange={e => update({ newRoutine: e.target.value })}
              placeholder="¿Qué harás en su lugar? (Ej: leer un libro 5 min)"
              className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent"
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleBack} className="px-4 py-2 text-stone-500">Atrás</button>
              <button
                onClick={() => setStep(4)}
                disabled={!data.cue.trim() || !data.oldRoutine.trim() || !data.newRoutine.trim()}
                className="px-4 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
