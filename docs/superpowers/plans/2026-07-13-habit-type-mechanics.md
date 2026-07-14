# Habit Type Mechanics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the 6 habit types (Sembrar, Cadena, Crecer, Cambiar, Preciso, Pilar) a unique interactive mechanic that changes how the user experiences and completes that habit.

**Architecture:** New DB columns for type-specific state. New card components in `src/app/habits/cards/`. Modified journal submission logic in `daily-journal.ts` to apply per-type rules. Type routing in existing `habitCards.tsx`.

**Tech Stack:** Next.js 15, Drizzle ORM + SQLite, React 19, Tailwind CSS, Zod, Vitest

## Global Constraints

- All user-facing text in Spanish (except code identifiers)
- All mechanics live inside expandable habit cards on /habits page — no separate routes
- Existing schema patterns followed for new columns
- 55 existing tests must continue to pass
- Follow spec exactly: no shame mechanics (Cambiar), shield system (Crecer), anchor-first (Cadena), one-click (Preciso)

---

### Task 0: Schema Migration — New Type-Mechanic Columns

**Files:**
- Modify: `src/db/schema.ts` (add columns to habits table)
- Create: `src/db/migrations/2026-07-13-habit-type-mechanics.ts`

**Interfaces:**
- Consumes: existing `habits` table definition
- Produces: `habits` with 10 new columns for Sembrar, Crecer, Cambiar, Preciso

- [ ] **Step 1: Add new columns to habits table in schema.ts**

Add after `lastStrengthDate` (line 191) and before `// Meta` (line 193):

```typescript
  // Type mechanics (Sembrar)
  evolutionCycle: integer('evolution_cycle').default(0),
  daysInCurrentCycle: integer('days_in_current_cycle').default(0),
  evolutionOptimal: text('evolution_optimal'),
  evolutionMinimum: text('evolution_minimum'),

  // Type mechanics (Crecer)
  streakShields: integer('streak_shields').default(0),
  currentStreak: integer('current_streak').default(0),

  // Type mechanics (Cambiar)
  victoryCount: integer('victory_count').default(0),
  temptationCount: integer('temptation_count').default(0),

  // Type mechanics (Preciso)
  triggerHitCount: integer('trigger_hit_count').default(0),
  actionExecutedCount: integer('action_executed_count').default(0),
```

- [ ] **Step 2: Push schema to DB**

Run: `npm run db:push`
Expected: drizzle-kit pushes schema successfully, adding all new columns to `local.db`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add type-mechanic columns to habits schema (Sembrar, Crecer, Cambiar, Preciso)"
```

---

### Task 1: Sembrar 🌱 — Evolution Cycles

**Files:**
- Create: `src/app/habits/cards/HabitCardSembrar.tsx`
- Modify: `src/app/habits/habitCards.tsx` (route to HabitCardSembrar based on habitType)
- Modify: `src/app/actions/daily-journal.ts` (increment daysInCurrentCycle on complete)

**Interfaces:**
- Consumes: `habits.evolutionCycle`, `habits.daysInCurrentCycle`, `habits.evolutionOptimal`, `habits.evolutionMinimum`
- Produces: HabitCardSembrar component with evolution bar + upgrade modal

- [ ] **Step 1: Create HabitCardSembrar component**

Create `src/app/habits/cards/HabitCardSembrar.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface SembrarHabit {
  id: string;
  name: string;
  domain?: string | null;
  activeAction?: string | null;
  rescueAction?: string | null;
  celebration?: string | null;
  anchor?: string | null;
  currentStrength?: number;
  evolutionCycle?: number;
  daysInCurrentCycle?: number;
  evolutionOptimal?: string | null;
  evolutionMinimum?: string | null;
}

const CYCLE_TARGET = 15;

export function HabitCardSembrar({ habit }: { habit: SembrarHabit }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [newOptimal, setNewOptimal] = useState(habit.evolutionOptimal || habit.activeAction || '');
  const [newMinimum, setNewMinimum] = useState(habit.evolutionMinimum || habit.rescueAction || '');
  const [upgrading, setUpgrading] = useState(false);

  const cycle = habit.evolutionCycle ?? 0;
  const days = habit.daysInCurrentCycle ?? 0;
  const isComplete = days >= CYCLE_TARGET;
  const pct = Math.min(Math.round((days / CYCLE_TARGET) * 100), 100);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/habits/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId: habit.id,
          evolutionOptimal: newOptimal,
          evolutionMinimum: newMinimum,
        }),
      });
      if (res.ok) {
        setShowUpgrade(false);
        router.refresh();
      }
    } catch (e) {
      console.error('Error upgrading habit:', e);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="border-l-4 border-l-emerald-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => !showUpgrade && setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🌱 Sembrar · Nivel {cycle + 1}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      {!isComplete ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Camino a la Evolución</span>
            <span>{days}/{CYCLE_TARGET} días</span>
          </div>
          <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}
          className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          ¡Has dominado este nivel! Mejorar hábito
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          <p>⚡ Óptimo: <span className="text-stone-700 dark:text-stone-300">{habit.evolutionOptimal || habit.activeAction}</span></p>
          <p>🌱 Mínimo: <span className="text-stone-700 dark:text-stone-300">{habit.evolutionMinimum || habit.rescueAction}</span></p>
          {habit.anchor && <p>🔗 Ancla: {habit.anchor}</p>}
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpgrade(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <Sparkles className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold">¡Has dominado este nivel! 🌱✨</h3>
              <p className="text-sm text-stone-500 mt-1">Llevas 15 días demostrando quién eres. ¿Quieres subir un escalón?</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nueva versión óptima</label>
                <input type="text" value={newOptimal} onChange={e => setNewOptimal(e.target.value)}
                  className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nueva versión mínima</label>
                <input type="text" value={newMinimum} onChange={e => setNewMinimum(e.target.value)}
                  className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent mt-1 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowUpgrade(false)} className="px-4 py-2 text-stone-500 text-sm">Mantener ritmo</button>
              <button onClick={handleUpgrade} disabled={upgrading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm disabled:opacity-50">
                {upgrading ? 'Mejorando...' : 'Mejorar hábito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create evolution API route**

Create `src/app/api/habits/evolve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { habits } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { habitId, evolutionOptimal, evolutionMinimum } = await req.json();
    if (!habitId) return NextResponse.json({ error: 'habitId required' }, { status: 400 });

    const habit = await db.query.habits.findFirst({ where: eq(habits.id, habitId) });
    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

    await db.update(habits).set({
      evolutionCycle: (habit.evolutionCycle ?? 0) + 1,
      daysInCurrentCycle: 0,
      evolutionOptimal: evolutionOptimal || null,
      evolutionMinimum: evolutionMinimum || null,
      activeAction: evolutionOptimal || habit.activeAction,
      rescueAction: evolutionMinimum || habit.rescueAction,
    }).where(eq(habits.id, habitId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error evolving habit:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add evolution logic to daily-journal.ts**

In `src/app/actions/daily-journal.ts`, inside the habit loop (around line 195), after the strength update, add:

```typescript
    if (habitRecord.habitType === 'sembrar') {
      const currentDays = habitRecord.daysInCurrentCycle ?? 0;
      if (habitEntry.completed === true && currentDays < 15) {
        await db.update(habits).set({
          daysInCurrentCycle: currentDays + 1,
        }).where(eq(habits.id, habitEntry.habitId));
      }
    }
```

- [ ] **Step 4: Route to HabitCardSembrar in habitCards.tsx**

In `src/app/habits/habitCards.tsx`, at the top of the file, add the import. Then in the main export switch, route by `habitType`:

```typescript
import { HabitCardSembrar } from './cards/HabitCardSembrar';

export function HabitCard({ habit }: { habit: any }) {
  if (habit.habitType === 'sembrar') {
    return <HabitCardSembrar habit={habit} />;
  }
  // ... rest of existing routing
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/habits/cards/HabitCardSembrar.tsx src/app/api/habits/evolve/route.ts src/app/habits/habitCards.tsx src/app/actions/daily-journal.ts
git commit -m "feat: Sembrar evolution mechanic with 15-day cycles and upgrade modal"
```

---

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

### Task 3: Crecer ⚡ — Momentum Streak with Shield

**Files:**
- Create: `src/app/habits/cards/HabitCardCrecer.tsx`
- Modify: `src/app/habits/habitCards.tsx` (add Crecer routing)
- Modify: `src/app/actions/daily-journal.ts` (shield earn/consume logic)
- Modify: `src/lib/habit-strength.ts` (add shield calculation)

**Interfaces:**
- Consumes: `habits.streakShields`, `habits.currentStreak`
- Produces: HabitCardCrecer with flame tiers + shield icons

- [ ] **Step 1: Create HabitCardCrecer component**

Create `src/app/habits/cards/HabitCardCrecer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface CrecerHabit {
  id: string;
  name: string;
  anchor?: string | null;
  currentStrength?: number;
  currentStreak?: number;
  streakShields?: number;
}

const STREAK_TIERS = [
  { min: 0, icon: '🔥', label: 'Empezando' },
  { min: 7, icon: '🔥', label: 'Consistente' },
  { min: 14, icon: '🔥🔥', label: 'Disciplinado' },
  { min: 21, icon: '🔥🔥🔥', label: 'Imparable' },
  { min: 30, icon: '👑', label: 'Maestro' },
];

function getTier(streak: number) {
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_TIERS[i].min) return STREAK_TIERS[i];
  }
  return STREAK_TIERS[0];
}

export function HabitCardCrecer({ habit }: { habit: CrecerHabit }) {
  const [expanded, setExpanded] = useState(false);
  const streak = habit.currentStreak ?? 0;
  const shields = habit.streakShields ?? 0;
  const tier = getTier(streak);

  return (
    <div className="border-l-4 border-l-stone-600 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            ⚡ Crecer · {tier.icon} {tier.label}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: shields }).map((_, i) => (
            <Shield key={i} className="h-4 w-4 text-amber-500" />
          ))}
          {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-2xl">{tier.icon}</span>
        <span className="font-bold text-stone-800 dark:text-stone-200">{streak} días seguidos</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          {habit.anchor && <p>🔗 Anclado a: <span className="text-stone-700 dark:text-stone-300">{habit.anchor}</span></p>}
          <p>🛡️ Escudos: {shields}/2 (1 cada 7 días)</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add shield earn/consume logic to daily-journal.ts**

In `src/app/actions/daily-journal.ts`, inside the habit loop, after strength update, add Crecer logic:

```typescript
if (habitRecord.habitType === 'crecer') {
  const currentStreak = habitRecord.currentStreak ?? 0;
  const currentShields = habitRecord.streakShields ?? 0;

  if (habitEntry.completed === true) {
    const newStreak = currentStreak + 1;
    const newShields = Math.min(currentShields + (newStreak % 7 === 0 ? 1 : 0), 2);
    await db.update(habits).set({
      currentStreak: newStreak,
      streakShields: newShields,
    }).where(eq(habits.id, habitEntry.habitId));
  } else if (currentShields > 0) {
    // Consume a shield — streak freezes, doesn't reset
    await db.update(habits).set({
      streakShields: currentShields - 1,
    }).where(eq(habits.id, habitEntry.habitId));
  } else {
    // No shields — streak resets
    await db.update(habits).set({
      currentStreak: 0,
    }).where(eq(habits.id, habitEntry.habitId));
  }
}
```

- [ ] **Step 3: Add shield logic to habit-strength.ts**

Add a new exported function:

```typescript
export function applyStreakShield(
  currentStreak: number,
  currentShields: number,
  completedToday: boolean,
): { newStreak: number; newShields: number } {
  if (completedToday) {
    const newStreak = currentStreak + 1;
    const newShields = Math.min(currentShields + (newStreak % 7 === 0 ? 1 : 0), 2);
    return { newStreak, newShields };
  }

  if (currentShields > 0) {
    return { newStreak: currentStreak, newShields: currentShields - 1 };
  }

  return { newStreak: 0, newShields: 0 };
}
```

- [ ] **Step 4: Add Crecer routing to habitCards.tsx**

```typescript
import { HabitCardCrecer } from './cards/HabitCardCrecer';

if (habit.habitType === 'crecer') {
  return <HabitCardCrecer habit={habit} />;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/habits/cards/HabitCardCrecer.tsx src/app/actions/daily-journal.ts src/lib/habit-strength.ts src/app/habits/habitCards.tsx
git commit -m "feat: Crecer momentum streak with shield system (earn 1 per 7 days, max 2)"
```

---

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

### Task 5: Preciso 🎯 — One-Click Execution

**Files:**
- Create: `src/app/habits/cards/HabitCardPreciso.tsx`
- Modify: `src/app/habits/habitCards.tsx` (add Preciso routing)
- Modify: `src/app/actions/daily-journal.ts` (single-click + no-decay-if-no-trigger)

**Interfaces:**
- Consumes: `habits.ifTrigger`, `habits.ifAction`, `habits.triggerHitCount`, `habits.actionExecutedCount`
- Produces: single smart button, execution rate display

- [ ] **Step 1: Create HabitCardPreciso component**

Create `src/app/habits/cards/HabitCardPreciso.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface PrecisoHabit {
  id: string;
  name: string;
  ifTrigger?: string | null;
  ifAction?: string | null;
  triggerHitCount?: number;
  actionExecutedCount?: number;
  currentStrength?: number;
}

export function HabitCardPreciso({ habit }: { habit: PrecisoHabit }) {
  const [expanded, setExpanded] = useState(false);
  const hits = habit.triggerHitCount ?? 0;
  const executed = habit.actionExecutedCount ?? 0;
  const rate = hits > 0 ? Math.round((executed / hits) * 100) : 0;

  return (
    <div className="border-l-4 border-l-sky-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🎯 Preciso
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
        Cuando <strong>{habit.ifTrigger}</strong> → <strong>{habit.ifAction}</strong>
      </p>

      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Target className="h-3 w-3" />
        <span>Ejecución: <strong className="text-stone-700 dark:text-stone-300">{rate}%</strong></span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1 text-xs text-stone-500">
          <p>📊 Se presentó: {hits} veces</p>
          <p>✅ Ejecutado: {executed} veces</p>
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Preciso logic to daily-journal.ts**

Inside the habit loop, add:

```typescript
if (habitRecord.habitType === 'preciso') {
  if (habitEntry.completed === true) {
    // User clicked "trigger occurred AND executed"
    await db.update(habits).set({
      triggerHitCount: (habitRecord.triggerHitCount ?? 0) + 1,
      actionExecutedCount: (habitRecord.actionExecutedCount ?? 0) + 1,
    }).where(eq(habits.id, habitEntry.habitId));
  }
  // If not completed, trigger didn't occur — no decay applied
  // (the caller logic in submitDailyEntry must skip decay for preciso when not completed)
}
```

- [ ] **Step 3: Skip decay for Preciso when not completed**

In `submitDailyEntry`, before applying decay, check:

```typescript
// Inside the habit loop, before applyDecayAndBonus:
if (habitRecord.habitType === 'preciso' && !habitEntry.completed) {
  // Trigger didn't occur — skip decay entirely
  continue;
}
```

- [ ] **Step 4: Add Preciso routing to habitCards.tsx**

```typescript
import { HabitCardPreciso } from './cards/HabitCardPreciso';

if (habit.habitType === 'preciso') {
  return <HabitCardPreciso habit={habit} />;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/habits/cards/HabitCardPreciso.tsx src/app/actions/daily-journal.ts src/app/habits/habitCards.tsx
git commit -m "feat: Preciso one-click execution with no-decay-when-no-trigger"
```

---

### Task 6: Pilar 🏛️ — Keystone Effect

**Files:**
- Create: `src/app/habits/cards/HabitCardPilar.tsx`
- Modify: `src/app/habits/habitCards.tsx` (add Pilar routing)
- Modify: `src/app/actions/daily-journal.ts` (domain bonus application)

**Interfaces:**
- Consumes: `habits.domain` (domain of the keystone habit)
- Produces: keystone badge, effect display, auto-bonus to same-domain habits

- [ ] **Step 1: Create HabitCardPilar component**

Create `src/app/habits/cards/HabitCardPilar.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface PilarHabit {
  id: string;
  name: string;
  domain?: string | null;
  currentStrength?: number;
}

const domainLabels: Record<string, string> = {
  cuerpo: 'Cuerpo', mente: 'Mente', trabajo: 'Trabajo',
  relaciones: 'Relaciones', hogar: 'Hogar', espiritual: 'Espiritual', finanzas: 'Finanzas',
};

export function HabitCardPilar({ habit }: { habit: PilarHabit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-l-4 border-l-violet-500 bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 cursor-pointer transition-all duration-300 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            🏛️ Pilar · Hábito Clave
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </div>

      <span className="inline-block text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
        🏛️ Clave
      </span>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-stone-500">
          <p>⚡ Al completarlo hoy, fortalece todos los hábitos de <strong>{domainLabels[habit.domain || ''] || 'su dominio'}</strong></p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Zap className="h-3 w-3" />
            <span>Efecto dominó activo</span>
          </div>
        </div>
      )}

      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Pilar bonus logic to daily-journal.ts**

At the end of `submitDailyEntry`, after the habit loop, add:

```typescript
// Pilar keystone effect: boost same-domain habits
for (const habitEntry of formData.dailyHabits) {
  if (!habitEntry.habitId || !habitEntry.completed) continue;

  const habitRecord = await db.query.habits.findFirst({
    where: eq(habits.id, habitEntry.habitId),
  });

  if (!habitRecord || habitRecord.habitType !== 'pilar' || !habitRecord.domain) continue;

  // Find all active habits in the same domain and boost them
  const domainHabits = await db.query.habits.findMany({
    where: and(
      eq(habits.domain, habitRecord.domain),
      eq(habits.isActive, 1),
    ),
  });

  for (const dh of domainHabits) {
    if (dh.id === habitRecord.id) continue; // Don't boost itself
    const boostedStrength = Math.round(((dh.currentStrength ?? 0) + 0.1) * 100) / 100;
    await db.update(habits).set({
      currentStrength: boostedStrength,
    }).where(eq(habits.id, dh.id));
  }
}
```

- [ ] **Step 3: Add Pilar routing to habitCards.tsx**

```typescript
import { HabitCardPilar } from './cards/HabitCardPilar';

if (habit.habitType === 'pilar') {
  return <HabitCardPilar habit={habit} />;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/habits/cards/HabitCardPilar.tsx src/app/actions/daily-journal.ts src/app/habits/habitCards.tsx
git commit -m "feat: Pilar keystone effect with domain-wide strength bonus on completion"
```

---

### Task 7: Integration Tests and Verification

**Files:**
- (none — verification only)

- [ ] **Step 1: Run all existing tests**

Run: `npm run test:run`
Expected: 55/55 tests pass.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 4: Start dev server and smoke test**

Run: `npm run dev`
Visit `/habits`. Verify:
- All 6 type cards render correctly
- Sembrar shows evolution bar
- Cadena shows anchor + steps
- Crecer shows streak + shields
- Cambiar shows victory-only bar
- Preciso shows if-then + execution rate
- Pilar shows keystone badge
- TypeScript hot reload works

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final fixes after type mechanics integration"
```
