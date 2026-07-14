### Task 2: Cadena ⛓️ — Sequential Chain with Anchor

**Files:**
- Create: `src/app/habits/cards/HabitCardCadena.tsx`
- Modify: `src/app/habits/habitCards.tsx` (add Cadena routing)
- Modify: `src/app/actions/daily-journal.ts` (chain progress)
- Create: `src/lib/cadena-store.ts` (chain step completion logic)

**Interfaces:**
- Consumes: `chains` + `chain_items` tables, `habits.belongsToChainId`
- Produces: HabitCardCadena with anchor block, numbered steps, progress line

- [ ] **Step 1: Create HabitCardCadena component**

Create `src/app/habits/cards/HabitCardCadena.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface ChainStep {
  id: string;
  name: string;
  order: number;
}

interface CadenaHabit {
  id: string;
  name: string;
  currentStrength?: number;
  anchor?: string | null;
  chainSteps?: ChainStep[];
  chainId?: string;
}

export function HabitCardCadena({ habit }: { habit: CadenaHabit }) {
  const [expanded, setExpanded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps = habit.chainSteps || [];
  const allDone = steps.length > 0 && steps.every(s => completedSteps.has(s.id));
  const anchor = habit.anchor || 'Completar tu rutina actual';

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  return (
    <div className={`border-l-4 border-l-stone-400 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 transition-all duration-300 ${
      allDone ? 'shadow-emerald-500/20 shadow-lg border-emerald-500/30' : ''
    }`}>
      <div className="flex items-start justify-between mb-2" onClick={() => setExpanded(!expanded)}>
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            ⛓️ Cadena · {completedSteps.size}/{steps.length} pasos
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      {expanded && (
        <div className="mt-3 pl-2">
          {/* Anchor block — non-interactive, fixed at top */}
          <div className="mb-4 p-3 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">🔴 Ancla</p>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mt-1">{anchor}</p>
          </div>

          {/* Vertical chain */}
          <div className="relative ml-3">
            <div className={`absolute left-[11px] top-0 bottom-0 w-0.5 transition-colors duration-500 ${
              allDone ? 'bg-emerald-400' : completedSteps.size > 0 ? 'bg-emerald-400/50' : 'bg-stone-200 dark:bg-stone-700'
            }`} />
            <div className="space-y-5">
              {steps.map((step, i) => {
                const done = completedSteps.has(step.id);
                return (
                  <div key={step.id} className="flex items-center gap-3 relative">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 z-10 ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/40'
                          : 'border-stone-300 dark:border-stone-600 hover:border-emerald-400'
                      }`}
                    >
                      {done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </button>
                    <span className={`text-sm ${done ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-stone-300'}`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compact summary */}
      {!expanded && steps.length > 0 && (
        <p className="text-xs text-stone-400 mt-2">{completedSteps.size}/{steps.length} pasos completados</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create cadena data store**

Create `src/lib/cadena-store.ts`:

```typescript
import { db } from '@/db/db';
import { chains, chainItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getChainWithSteps(chainId: string) {
  const chain = await db.query.chains.findFirst({
    where: eq(chains.id, chainId),
  });
  if (!chain) return null;

  const items = await db.query.chainItems.findMany({
    where: eq(chainItems.chainId, chainId),
    orderBy: (items, { asc }) => [asc(items.order)],
  });

  return {
    ...chain,
    steps: items.map(item => ({ id: item.id, name: item.habitId, order: item.order })),
  };
}
```

- [ ] **Step 3: Add Cadena routing to habitCards.tsx**

Add import and routing:

```typescript
import { HabitCardCadena } from './cards/HabitCardCadena';

// In the HabitCard switch:
if (habit.habitType === 'cadena') {
  return <HabitCardCadena habit={habit} />;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/habits/cards/HabitCardCadena.tsx src/lib/cadena-store.ts src/app/habits/habitCards.tsx
git commit -m "feat: Cadena sequential chain with anchor block and step-by-step progress"
```

---

