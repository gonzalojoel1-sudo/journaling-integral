### Task 4: Cambiar 🔄 — New Neural Path Builder (100% Positive)

**Files:**
- Create: `src/app/habits/cards/HabitCardCambiar.tsx`
- Modify: `src/app/habits/habitCards.tsx` (add Cambiar routing)
- Modify: `src/app/habits/HabitWizard.tsx` (add paired creation flow)
- Modify: `src/app/actions/daily-journal.ts` (victory tracking — no penalty)

**Interfaces:**
- Consumes: `habits.victoryCount`, `habits.temptationCount`, `habits.oldRoutine`, `habits.newRoutine`
- Produces: single-bar victory tracker, no shame UI

- [ ] **Step 1: Create HabitCardCambiar component**

Create `src/app/habits/cards/HabitCardCambiar.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface CambiarHabit {
  id: string;
  name: string;
  newRoutine?: string | null;
  oldRoutine?: string | null;
  victoryCount?: number;
  currentStrength?: number;
}

const VICTORY_TARGET = 30;

export function HabitCardCambiar({ habit }: { habit: CambiarHabit }) {
  const [expanded, setExpanded] = useState(false);
  const victories = habit.victoryCount ?? 0;
  const pct = Math.min(Math.round((victories / VICTORY_TARGET) * 100), 100);

  return (
    <div className="border-l-4 border-l-amber-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🔄 Nueva Ruta Neuronal
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            🏆 {victories}/{VICTORY_TARGET} victorias
          </span>
        </div>
        <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          <p>🧠 Nuevo camino: <span className="text-stone-700 dark:text-stone-300 font-medium">{habit.newRoutine}</span></p>
          <p>→ Has elegido tu nueva identidad {victories} veces</p>
          {victories >= VICTORY_TARGET && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">¡Has construido una nueva ruta neuronal! 🧠✨</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add victory tracking to daily-journal.ts**

Inside the habit loop, after strength update:

```typescript
if (habitRecord.habitType === 'cambiar') {
  if (habitEntry.completed === true) {
    // Only count victories — no penalty for misses
    await db.update(habits).set({
      victoryCount: (habitRecord.victoryCount ?? 0) + 1,
    }).where(eq(habits.id, habitEntry.habitId));
  }
  // If temptation appeared but user didn't complete, log internally (no display)
  if (habitEntry.temptationAppeared && !habitEntry.completed) {
    await db.update(habits).set({
      temptationCount: (habitRecord.temptationCount ?? 0) + 1,
    }).where(eq(habits.id, habitEntry.habitId));
  }
}
```

- [ ] **Step 3: Modify HabitWizard for Cambiar paired creation**

In `src/app/habits/HabitWizard.tsx`, add a new step or modify step 2 to capture the old routine when user selects "cambiar":

Add to wizard data:
```typescript
type WizardData = {
  // ... existing fields ...
  oldRoutine: string;
  newRoutine: string;
  cue: string;
};
```

After step 2 (if user chose "cambiar"), show:
- "¿Qué disparador desencadena ese hábito?" → `cue`
- "¿Qué haces exactamente?" → `oldRoutine`
- "¿Qué harás en su lugar?" → `newRoutine`

When submitting a Cambiar habit, pass `oldRoutine`, `newRoutine`, `cue`.

- [ ] **Step 4: Add Cambiar routing to habitCards.tsx**

```typescript
import { HabitCardCambiar } from './cards/HabitCardCambiar';

if (habit.habitType === 'cambiar') {
  return <HabitCardCambiar habit={habit} />;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/habits/cards/HabitCardCambiar.tsx src/app/actions/daily-journal.ts src/app/habits/HabitWizard.tsx src/app/habits/habitCards.tsx
git commit -m "feat: Cambiar positive-only substitution with victory tracking and no-shame UI"
```

---

