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

