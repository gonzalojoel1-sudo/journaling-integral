### Task 4: Guided Wizard Component

**Files:**
- Create: `src/app/habits/HabitWizard.tsx`
- Modify: `src/app/habits/HabitsClient.tsx` (replace old create button with wizard trigger)

**Interfaces:**
- Consumes: `createHabit()` action
- Produces: HabitWizard component with 7-step flow, domain selector

- [ ] **Step 1: Create the HabitWizard component**

Create `src/app/habits/HabitWizard.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { createHabit } from '../actions/habits';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type WizardData = {
  name: string;
  type: 'crecer' | 'sembrar' | 'cambiar' | 'preciso' | 'pilar';
  anchor: string;
  rescueAction: string;
  celebration: string;
  domain: string;
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
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (partial: Partial<WizardData>) => setData(prev => ({ ...prev, ...partial }));

  const handleNext = () => setStep(prev => Math.min(prev + 1, 7) as Step);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1) as Step);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    const celebrationMap: Record<string, string> = {
      crecer: '✅ Hecho',
      sembrar: data.celebbration || '🎉',
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
          {[1,2,3,4,5,6,7].map(s => (
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
              autoFocus
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
                onClick={() => { update({ type: 'cambiar' }); handleNext(); }}
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
              autoFocus
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
              autoFocus
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
                    setStep(7); // Skip celebration step
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
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate wizard into HabitsClient**

In `src/app/habits/HabitsClient.tsx`, find the create button section and add:

```tsx
import { HabitWizard } from './HabitWizard';
// Add state:
const [showWizard, setShowWizard] = useState(false);

// Replace old create button trigger with:
<button onClick={() => setShowWizard(true)} className="...">
  + Nuevo hábito
</button>

// At the bottom of the component:
{showWizard && <HabitWizard onClose={() => setShowWizard(false)} />}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/habits/HabitWizard.tsx src/app/habits/HabitsClient.tsx
git commit -m "feat: add guided habit wizard with 7-step flow"
```

---

