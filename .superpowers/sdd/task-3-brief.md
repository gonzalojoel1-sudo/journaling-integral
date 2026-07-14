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

