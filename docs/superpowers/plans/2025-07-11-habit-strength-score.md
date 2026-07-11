# Puntuacion de Fuerza para Habitos - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema de puntuacion de fuerza para habitos con decaimiento exponencial y barra visual metalica/minimalista en dashboard y pagina de habitos.

**Architecture:** Enfoque hibrido: `submitDailyEntry` persiste fuerza en tabla `habits` aplicando formula `0.90^n + 1.0`. Funcion `getRealTimeStrength` calcula decaimiento en memoria para UI sin submit pendiente. Componente `StrengthBar` muestra barra horizontal de 2px con gradiente metalico.

**Tech Stack:** Drizzle ORM + SQLite, Next.js 15 App Router, React 19, Tailwind CSS 3, TypeScript 5

## Global Constraints

- Palette: zinc/slate/silver tones, no colors outside metallic spectrum for strength indicator
- No text, no labels, no numbers in StrengthBar component
- Bar height: 2px, width proportional to strength/10
- Strength precision: 2 decimal places
- Habit card type additions: `currentStrength: number`, `lastStrengthDate: string | null`

---

### Task 1: Add strength columns to habits table schema

**Files:**
- Modify: `src/db/schema.ts:152-162`

**Interfaces:**
- Produces: Updated `habits` table with `currentStrength` (real, default 0.0) and `lastStrengthDate` (text, nullable, default null)

- [ ] **Step 1: Add columns to habits table**

In `src/db/schema.ts`, locate the `habits` table definition near line 152. Add two new columns inside the table object, after `strategyDetails` and before `createdAt`:

```typescript
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  strategyDetails: text('strategy_details'),
  currentStrength: real('current_strength').default(0.0).notNull(),
  lastStrengthDate: text('last_strength_date'),
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active').default(1).notNull(),
});
```

- [ ] **Step 2: Push schema to DB**

Run:
```bash
npm run db:push
```

Expected: drizzle-kit pushes the schema successfully, adding `current_strength` and `last_strength_date` columns to the live `local.db`.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add currentStrength and lastStrengthDate columns to habits table"
```

---

### Task 2: Create habit-strength calculation library

**Files:**
- Create: `src/lib/habit-strength.ts`

**Interfaces:**
- Produces:
  - `applyDecayAndBonus(currentStrength: number, lastStrengthDate: string | null, todayStr: string, completedToday: boolean): { newStrength: number; newDate: string }`
  - `getRealTimeStrength(currentStrength: number, lastStrengthDate: string | null): number`

- [ ] **Step 1: Create `src/lib/habit-strength.ts`**

```typescript
const DECAY_RATE = 0.90;

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

export function applyDecayAndBonus(
  currentStrength: number,
  lastStrengthDate: string | null,
  todayStr: string,
  completedToday: boolean,
): { newStrength: number; newDate: string } {
  let daysSince = 0;

  if (lastStrengthDate) {
    daysSince = daysBetween(lastStrengthDate, todayStr);
  }

  let strength = currentStrength * Math.pow(DECAY_RATE, daysSince);

  if (completedToday) {
    strength += 1.0;
  }

  return {
    newStrength: Math.round(strength * 100) / 100,
    newDate: todayStr,
  };
}

export function getRealTimeStrength(
  currentStrength: number,
  lastStrengthDate: string | null,
): number {
  if (!lastStrengthDate) return currentStrength;

  const todayStr = new Date().toISOString().split('T')[0];
  const daysSince = daysBetween(lastStrengthDate, todayStr);

  if (daysSince <= 0) return currentStrength;

  const strength = currentStrength * Math.pow(DECAY_RATE, daysSince);
  return Math.round(strength * 100) / 100;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit src/lib/habit-strength.ts
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/habit-strength.ts
git commit -m "feat: add habit-strength calculation library with decay and real-time functions"
```

---

### Task 3: Create StrengthBar component

**Files:**
- Create: `src/components/StrengthBar.tsx`

**Interfaces:**
- Produces: `<StrengthBar strength={number} className?: string />` — React client component rendering a 2px colored bar

- [ ] **Step 1: Create `src/components/StrengthBar.tsx`**

```typescript
import React from 'react';

interface StrengthBarProps {
  strength: number;
  className?: string;
}

function getBarStyle(strength: number): string {
  const clamped = Math.min(Math.max(strength, 0), 10);
  const pct = Math.round((clamped / 10) * 100);

  if (pct <= 20) {
    return 'bg-zinc-400/30 dark:bg-zinc-600/30';
  }
  if (pct <= 50) {
    return 'bg-zinc-400 dark:bg-zinc-500';
  }
  if (pct <= 80) {
    return 'bg-zinc-500 dark:bg-zinc-400';
  }
  return 'bg-zinc-300 dark:bg-zinc-300 shadow-[0_0_4px_rgba(212,212,216,0.5)] dark:shadow-[0_0_4px_rgba(161,161,170,0.4)]';
}

export function StrengthBar({ strength, className = '' }: StrengthBarProps) {
  const clamped = Math.min(Math.max(strength, 0), 10);
  const pct = Math.round((clamped / 10) * 100);

  return (
    <div className={`h-[2px] w-full bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-premium ${getBarStyle(clamped)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit src/components/StrengthBar.tsx
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StrengthBar.tsx
git commit -m "feat: add StrengthBar component with metallic gradient indicator"
```

---

### Task 4: Update habits server actions to include strength fields

**Files:**
- Modify: `src/app/actions/habits.ts`

**Interfaces:**
- Consumes: `habits` table with new columns from Task 1, `applyDecayAndBonus` from Task 2
- Produces: `getActiveHabits()` returns habits with `currentStrength` and `lastStrengthDate` fields; `createHabit` initializes `currentStrength: 0` and `lastStrengthDate: null`

- [ ] **Step 1: Update `createHabit` to initialize strength fields**

In `src/app/actions/habits.ts`, locate the `createHabit` function (line 23). Add the two new fields to the `db.insert(habits).values(...)` call:

```typescript
export async function createHabit(name: string, type: string, strategyDetails: string) {
  try {
    const userId = await getCurrentUserId();
    await db.insert(habits).values({
      id: randomUUID(),
      userId: userId,
      name,
      type,
      strategyDetails,
      currentStrength: 0.0,
      lastStrengthDate: null,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/habits');
    revalidatePath('/journal');
    return { success: true };
  } catch (error) {
    console.error('Error al añadir hábito:', error);
    return { success: false, error: 'Ocurrió un error al guardar el hábito.' };
  }
}
```

- [ ] **Step 2: Verify the `getActiveHabits` query returns the new columns automatically**

Drizzle's `findMany` with `db.query.habits.findMany(...)` returns all columns by default when no `.select()` is specified. The existing query at line 13 already returns all columns. No code changes needed in `getActiveHabits`.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/habits.ts
git commit -m "feat: initialize currentStrength and lastStrengthDate on habit creation"
```

---

### Task 5: Integrate strength calculation into daily journal submission

**Files:**
- Modify: `src/app/actions/daily-journal.ts`

**Interfaces:**
- Consumes: `applyDecayAndBonus` from `src/lib/habit-strength.ts`, `habits` table from schema
- Produces: Updated `submitDailyEntry` that calculates and persists strength for each habit after journal save

- [ ] **Step 1: Add import for habit-strength and update schema import**

In `src/app/actions/daily-journal.ts`, line 4 currently reads:
```typescript
import { dailyEntries, users } from '../../db/schema';
```
Change it to:
```typescript
import { dailyEntries, users, habits } from '../../db/schema';
import { applyDecayAndBonus } from '../../lib/habit-strength';
```

- [ ] **Step 2: Add strength update logic after entry save**

In `submitDailyEntry`, after the block that handles `existingEntry` update/insert (lines 127-143, which ends with the `}` closing the `if (existingEntry)` block), and before the `revalidatePath` calls (line 166), add the strength calculation block:

```typescript
    // --- Actualizar fuerza de hábitos ---
    if (formData.dailyHabits && Array.isArray(formData.dailyHabits)) {
      const todayStr = new Date().toISOString().split('T')[0];

      for (const habitEntry of formData.dailyHabits) {
        if (!habitEntry.habitId) continue;

        const habitRecord = await db.query.habits.findFirst({
          where: eq(habits.id, habitEntry.habitId),
        });

        if (!habitRecord) continue;

        const { newStrength, newDate } = applyDecayAndBonus(
          habitRecord.currentStrength,
          habitRecord.lastStrengthDate,
          todayStr,
          habitEntry.completed === true,
        );

        await db
          .update(habits)
          .set({
            currentStrength: newStrength,
            lastStrengthDate: newDate,
          })
          .where(eq(habits.id, habitEntry.habitId));
      }
    }
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit src/app/actions/daily-journal.ts
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/daily-journal.ts
git commit -m "feat: integrate habit strength calculation into submitDailyEntry"
```

---

### Task 6: Update dashboard to show strength bars

**Files:**
- Modify: `src/app/dashboard/HabitProgress.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `StrengthBar` from Task 3, habits with strength fields from Task 4
- Produces: Dashboard habit cards show thin strength bar below each habit name

- [ ] **Step 1: Update Habit interface and add StrengthBar to HabitProgress**

In `src/app/dashboard/HabitProgress.tsx`, update the `Habit` interface to include `currentStrength` and add `StrengthBar`:

```typescript
'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { StrengthBar } from '@/components/StrengthBar';

interface Habit {
  id: string;
  name: string;
  type: string;
  completed?: boolean;
  currentStrength?: number;
  lastStrengthDate?: string | null;
}

interface HabitProgressProps {
  habits: Habit[];
  initialCompletedIds?: string[];
}
```

Then in the map of habits (around line 71), inside each habit button, add the StrengthBar between the habit name and the check icon. Replace the existing habit button JSX with:

```typescript
        {habits.map((habit) => {
          const isCompleted = completedIds.has(habit.id);
          const strength = habit.currentStrength ?? 0;
          return (
            <button
              key={habit.id}
              type="button"
              onClick={() => toggleHabit(habit.id)}
              className={`w-full flex flex-col gap-1.5 p-2.5 rounded-lg transition-all duration-200 text-left group ${
                isCompleted
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                  : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                      : 'border border-zinc-300 dark:border-zinc-600 group-hover:border-emerald-400'
                  }`}
                >
                  {isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span
                  className={`text-xs font-medium truncate ${
                    isCompleted
                      ? 'text-zinc-500 dark:text-zinc-400 line-through'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {habit.name}
                </span>
              </div>
              <StrengthBar strength={strength} className="ml-8" />
            </button>
          );
        })}
```

- [ ] **Step 2: Pass strength data from dashboard page to HabitProgress**

In `src/app/page.tsx`, update the `parsedHabits` mapping to include `currentStrength` and `lastStrengthDate`. Replace the existing `parsedHabits` variable definition (around line 95-117) and the `HabitProgress` usage:

Update the type (line 95):
```typescript
  let parsedHabits: { id: string; name: string; type: string; completed?: boolean; currentStrength?: number; lastStrengthDate?: string | null }[] = [];
```

Update the mapping logic to include strength fields from the actual habits records:

```typescript
  if (habitsList.length > 0) {
    if (todayEntry?.dailyHabitsJson) {
      try {
        const savedHabits = JSON.parse(todayEntry.dailyHabitsJson);
        parsedHabits = savedHabits.map((h: any) => {
          const dbHabit = habitsList.find(dbh => dbh.id === h.habitId);
          return {
            id: h.habitId,
            name: h.name,
            type: h.type,
            completed: h.completed,
            currentStrength: dbHabit?.currentStrength ?? 0,
            lastStrengthDate: dbHabit?.lastStrengthDate ?? null,
          };
        });
        initialCompletedIds = savedHabits
          .filter((h: any) => h.completed)
          .map((h: any) => h.habitId);
      } catch {
        parsedHabits = habitsList.map((h) => ({ id: h.id, name: h.name, type: h.type, currentStrength: h.currentStrength ?? 0, lastStrengthDate: h.lastStrengthDate ?? null }));
      }
    } else {
      parsedHabits = habitsList.map((h) => ({ id: h.id, name: h.name, type: h.type, currentStrength: h.currentStrength ?? 0, lastStrengthDate: h.lastStrengthDate ?? null }));
    }
  }
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors (or only pre-existing errors unrelated to our changes).

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/HabitProgress.tsx src/app/page.tsx
git commit -m "feat: integrate StrengthBar into dashboard habit widget"
```

---

### Task 7: Update habits page to show strength bars

**Files:**
- Modify: `src/app/habits/HabitsClient.tsx`
- Modify: `src/app/habits/page.tsx`

**Interfaces:**
- Consumes: `StrengthBar` from Task 3, habits with strength fields from Task 4
- Produces: Habit cards in EOR columns show thin strength bar

- [ ] **Step 1: Update Habit interface and add StrengthBar import**

In `src/app/habits/HabitsClient.tsx`, update the imports to include `StrengthBar`:

```typescript
import React, { useState } from 'react';
import { createHabit, archiveHabit } from '../actions/habits';
import { StrengthBar } from '@/components/StrengthBar';
import { 
  Plus, 
  Trash2, 
  ToggleLeft, 
  Zap, 
  RefreshCw, 
  CheckCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Smile
} from 'lucide-react';
```

Update the `Habit` interface to include strength fields:

```typescript
interface Habit {
  id: string;
  name: string;
  type: string;
  strategyDetails: string | null;
  isActive: number;
  currentStrength?: number;
  lastStrengthDate?: string | null;
}
```

- [ ] **Step 2: Add StrengthBar to habit cards in EOR columns**

In the three column sections (Estandarizar, Optimizar, Reemplazar — lines 219-271), inside each habit card's `div`, add StrengthBar between the name and strategy details. The common pattern is:

Replace each card's inner content:

```typescript
<div key={h.id} className="bg-stone-100/60 dark:bg-stone-950/40 p-3.5 border border-stone-200/50 dark:border-stone-850/60 rounded-xl flex justify-between items-start gap-4">
  <div className="min-w-0 flex-1">
    <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-snug">{h.name}</h5>
    <StrengthBar strength={h.currentStrength ?? 0} className="my-1.5" />
    {h.strategyDetails && <p className="text-[10px] text-stone-400 mt-1">Estrategia: {h.strategyDetails}</p>}
  </div>
  <button onClick={() => handleArchive(h.id)} className="text-stone-400 hover:text-red-500 transition-colors shrink-0">
    <Trash2 className="h-4 w-4" />
  </button>
</div>
```

Apply this pattern to all three: `estandarizarList.map` (line 223), `optimizarList.map` (line 241), and `reemplazarList.map` (line 259).

- [ ] **Step 3: Update local habit creation to include strength defaults**

In the `handleCreate` function (line 58), update the local habit object:

```typescript
      const newHabitLocal: Habit = {
        id: Math.random().toString(),
        name,
        type,
        strategyDetails: strategyDetails || null,
        isActive: 1,
        currentStrength: 0.0,
        lastStrengthDate: null,
      };
```

In the `handleCreateStack` function (line 98), update similarly:

```typescript
      const newHabitLocal: Habit = {
        id: Math.random().toString(),
        name: habitName,
        type: 'STACK',
        strategyDetails: serializedStack,
        isActive: 1,
        currentStrength: 0.0,
        lastStrengthDate: null,
      };
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/habits/HabitsClient.tsx
git commit -m "feat: integrate StrengthBar into habits page EOR columns"
```

---

### Task 8: Smoke test the full flow

**Files:**
- (none — verification only)

- [ ] **Step 1: Push database schema**

```bash
npm run db:push
```

Expected: "No changes to push" or successful push.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: Next.js dev server starts on port 3000 without compilation errors.

- [ ] **Step 3: Verify dashboard loads with strength bars**

Open `http://localhost:3000`. Verify:
- Dashboard loads without errors
- Habit cards in "Habitos EOR" widget show thin strength bars under names
- New habits have near-invisible bars (strength 0)
- No visual regression to existing layout

- [ ] **Step 4: Submit a journal entry with habits checked**

Navigate to `/journal`. Complete all steps, mark some habits as done in Step 4, and submit. Verify:
- No console errors during submission
- Dashboard reload shows updated strength bars for completed habits
- Habit with check shows slight increase in strength bar width

- [ ] **Step 5: Verify habits page shows strength bars**

Navigate to `/habits`. Verify:
- Each habit card shows StrengthBar between name and strategy
- Strength values match what dashboard shows

- [ ] **Step 6: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "chore: final fixes and verification after strength score integration"
```
