# Habit Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current EOR/domain dual-system with a unified habit engine with 5 types + 7 domains + chain relationships

**Architecture:** New DB columns + tables, updated validations, new server actions, new guided wizard component, per-type card rendering, auto-recovery hooks into existing strength system. Old data migrated.

**Tech Stack:** Next.js 14, Drizzle ORM with SQLite, Zod, NextAuth, React Server Components

## Global Constraints

- All user-facing text in Spanish (except code identifiers)
- `type` column renamed to `habitType` to avoid SQL reserved word issues
- `strategyDetails` column repurposed — no longer a JSON blob, individual columns instead
- All existing habits migrated with sensible defaults
- `Cadena` is NOT a type — it's a chain_items + chains relationship

---

### Task 1: DB Schema Migration

**Files:**
- Modify: `src/db/schema.ts` (habits table, new tables for chains + chain_items)
- Create: `src/db/migrations/2026-07-12-habit-engine.ts`

**Interfaces:**
- Consumes: existing `habits` table definition
- Produces: new `habits` column signatures, `chains` table, `chain_items` table

- [ ] **Step 1: Update the habits table definition**

Replace current habits table with new columns in `schema.ts`:

```typescript
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Core
  name: text('name').notNull(),
  habitType: text('habit_type').notNull(),   // crecer | sembrar | cambiar | preciso | pilar
  domain: text('domain'),                     // cuerpo | mente | trabajo | relaciones | hogar | espiritual | finanzas | null

  // Action system
  rescueAction: text('rescue_action'),
  activeAction: text('active_action'),
  celebration: text('celebration').default('✅ Hecho'),

  // Type-specific fields
  anchor: text('anchor'),                     // Crecer, Sembrar
  ifTrigger: text('if_trigger'),              // Preciso
  ifAction: text('if_action'),                // Preciso
  cue: text('cue'),                           // Cambiar
  oldRoutine: text('old_routine'),            // Cambiar
  newRoutine: text('new_routine'),            // Cambiar

  // Identity
  identityLabel: text('identity_label'),

  // Chain relationship
  belongsToChainId: text('belongs_to_chain_id'),
  nextHabitId: text('next_habit_id'),

  // Strength
  currentStrength: real('current_strength').default(0.0),
  lastStrengthDate: text('last_strength_date'),

  // Meta
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active').default(1).notNull(),
});
```

- [ ] **Step 2: Create chains + chain_items tables**

Add after the habits table in `schema.ts`:

```typescript
export const chains = sqliteTable('chains', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const chainItems = sqliteTable('chain_items', {
  id: text('id').primaryKey(),
  chainId: text('chain_id')
    .notNull()
    .references(() => chains.id, { onDelete: 'cascade' }),
  habitId: text('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
});

export const chainsRelations = relations(chains, ({ one, many }) => ({
  user: one(users, {
    fields: [chains.userId],
    references: [users.id],
  }),
  items: many(chainItems),
}));

export const chainItemsRelations = relations(chainItems, ({ one }) => ({
  chain: one(chains, {
    fields: [chainItems.chainId],
    references: [chains.id],
  }),
  habit: one(habits, {
    fields: [chainItems.habitId],
    references: [habits.id],
  }),
}));
```

- [ ] **Step 3: Write the migration script**

Create `src/db/migrations/2026-07-12-habit-engine.ts`:

```typescript
import { db } from '../db';
import { habits } from '../schema';
import { sql } from 'drizzle-orm';

export async function migrate() {
  // 1. Rename 'type' to 'habit_type', add new columns
  // SQLite doesn't support ALTER COLUMN, so we need to:
  // - Create temp table with new schema
  // - Copy data with migration logic
  // - Drop old table
  // - Rename temp table

  // Helper: map old types to new habitType
  const typeMap: Record<string, string> = {
    'ESTANDARIZAR': 'crecer',
    'OPTIMIZAR': 'sembrar',
    'REEMPLAZAR': 'cambiar',
    'STACK': 'crecer',
    'fe': 'crecer',
    'negocio': 'crecer',
    'cuerpo': 'crecer',
    'mente': 'crecer',
    'relaciones': 'crecer',
    'personal': 'crecer',
  };

  // Helper: map old types to domain
  const domainMap: Record<string, string | null> = {
    'fe': 'espiritual',
    'negocio': 'trabajo',
    'cuerpo': 'cuerpo',
    'mente': 'mente',
    'relaciones': 'relaciones',
    'personal': null,
  };

  // Execute migration
  await db.run(sql`
    CREATE TABLE habits_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      habit_type TEXT NOT NULL DEFAULT 'crecer',
      domain TEXT,
      rescue_action TEXT,
      active_action TEXT,
      celebration TEXT DEFAULT '✅ Hecho',
      anchor TEXT,
      if_trigger TEXT,
      if_action TEXT,
      cue TEXT,
      old_routine TEXT,
      new_routine TEXT,
      identity_label TEXT,
      belongs_to_chain_id TEXT,
      next_habit_id TEXT,
      current_strength REAL DEFAULT 0.0,
      last_strength_date TEXT,
      created_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL
    );

    INSERT INTO habits_new (id, user_id, name, habit_type, domain, active_action, current_strength, last_strength_date, created_at, is_active)
    SELECT
      id,
      user_id,
      name,
      CASE
        WHEN type IN ('ESTANDARIZAR', 'STACK') THEN 'crecer'
        WHEN type = 'OPTIMIZAR' THEN 'sembrar'
        WHEN type = 'REEMPLAZAR' THEN 'cambiar'
        ELSE 'crecer'
      END,
      CASE
        WHEN type IN ('fe', 'negocio', 'cuerpo', 'mente', 'relaciones', 'personal')
        THEN CASE type
          WHEN 'fe' THEN 'espiritual'
          WHEN 'negocio' THEN 'trabajo'
          WHEN 'cuerpo' THEN 'cuerpo'
          WHEN 'mente' THEN 'mente'
          WHEN 'relaciones' THEN 'relaciones'
          WHEN 'personal' THEN NULL
        END
        ELSE NULL
      END,
      name,
      current_strength,
      last_strength_date,
      created_at,
      is_active
    FROM habits;

    DROP TABLE habits;
    ALTER TABLE habits_new RENAME TO habits;
  `);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/migrations/2026-07-12-habit-engine.ts
git commit -m "feat: migrate habits schema to unified habit engine types + domains + chain tables"
```

---

### Task 2: Validations

**Files:**
- Modify: `src/lib/validations.ts`

**Interfaces:**
- Consumes: new `habitType` + `domain` column names from schema
- Produces: `HabitTypeEnum`, `DomainEnum`, `CreateHabitSchema` with new fields

- [ ] **Step 1: Write the failing test**

Read `src/lib/validations.test.ts` first.

```typescript
// Add to src/lib/validations.test.ts
import { describe, it, expect } from 'vitest';
import { HabitTypeEnum, DomainEnum, CreateHabitSchema } from './validations';

describe('HabitTypeEnum', () => {
  it('accepts valid types', () => {
    expect(HabitTypeEnum.parse('crecer')).toBe('crecer');
    expect(HabitTypeEnum.parse('sembrar')).toBe('sembrar');
    expect(HabitTypeEnum.parse('cambiar')).toBe('cambiar');
    expect(HabitTypeEnum.parse('preciso')).toBe('preciso');
    expect(HabitTypeEnum.parse('pilar')).toBe('pilar');
  });

  it('rejects old types', () => {
    expect(() => HabitTypeEnum.parse('ESTANDARIZAR')).toThrow();
    expect(() => HabitTypeEnum.parse('personal')).toThrow();
  });
});

describe('DomainEnum', () => {
  it('accepts valid domains', () => {
    expect(DomainEnum.parse('cuerpo')).toBe('cuerpo');
    expect(DomainEnum.parse('espiritual')).toBe('espiritual');
  });
});

describe('CreateHabitSchema', () => {
  it('validates a minimal crecer habit', () => {
    const result = CreateHabitSchema.parse({
      name: 'Ejercicio matutino',
      habitType: 'crecer',
      anchor: 'Después del café',
      rescueAction: '1 sentadilla',
    });
    expect(result.name).toBe('Ejercicio matutino');
  });

  it('requires rescueAction', () => {
    expect(() => CreateHabitSchema.parse({
      name: 'Test',
      habitType: 'crecer',
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validations.test.ts --reporter=verbose`
Expected: FAIL (HabitTypeEnum, DomainEnum, CreateHabitSchema not defined or wrong)

- [ ] **Step 3: Write validations**

Replace the old HabitTypeEnum and CreateHabitSchema in `src/lib/validations.ts`:

```typescript
// ============================================================
// HABITS
// ============================================================

export const HabitTypeEnum = z.enum([
  'crecer',
  'sembrar',
  'cambiar',
  'preciso',
  'pilar',
]);

export const DomainEnum = z.enum([
  'cuerpo',
  'mente',
  'trabajo',
  'relaciones',
  'hogar',
  'espiritual',
  'finanzas',
]);

export const CreateHabitSchema = z.object({
  name: z.string().min(1, 'El nombre del hábito es requerido').max(100, 'Máximo 100 caracteres'),
  habitType: HabitTypeEnum,
  domain: DomainEnum.optional(),
  rescueAction: z.string().min(1, 'La acción de rescate es requerida').max(200),
  activeAction: z.string().optional(),
  celebration: z.string().optional(),
  anchor: z.string().optional(),
  ifTrigger: z.string().optional(),
  ifAction: z.string().optional(),
  cue: z.string().optional(),
  oldRoutine: z.string().optional(),
  newRoutine: z.string().optional(),
  identityLabel: z.string().optional(),
  belongsToChainId: z.string().optional(),
  nextHabitId: z.string().optional(),
});

export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;

export const ArchiveHabitSchema = z.object({
  habitId: UUIDSchema,
});

export type ArchiveHabitInput = z.infer<typeof ArchiveHabitSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validations.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations.ts src/lib/validations.test.ts
git commit -m "feat: update habit validations with new types and domains"
```

---

### Task 3: Server Actions

**Files:**
- Modify: `src/app/actions/habits.ts`

**Interfaces:**
- Consumes: `CreateHabitSchema` from validations, new habits columns from schema
- Produces: `createHabit()` accepting new parameters

- [ ] **Step 1: Rewrite createHabit**

```typescript
'use server';

import { db } from '../../db/db';
import { habits } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';
import { validate, CreateHabitSchema, ArchiveHabitSchema } from '@/lib/validations';

export async function getActiveHabits() {
  try {
    const userId = await getCurrentUserId();
    const list = await db.query.habits.findMany({
      where: and(eq(habits.userId, userId), eq(habits.isActive, 1)),
    });
    return { success: true, habits: list };
  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    return { success: false, error: 'No se pudo cargar la lista de hábitos.' };
  }
}

export async function createHabit(data: {
  name: string;
  habitType: string;
  domain?: string;
  rescueAction: string;
  activeAction?: string;
  celebration?: string;
  anchor?: string;
  ifTrigger?: string;
  ifAction?: string;
  cue?: string;
  oldRoutine?: string;
  newRoutine?: string;
  identityLabel?: string;
  belongsToChainId?: string;
  nextHabitId?: string;
}) {
  try {
    const v = validate(CreateHabitSchema, data);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const defaultCelebration: Record<string, string> = {
      crecer: '✅ Hecho',
      sembrar: '',
      cambiar: '🔄 Avance',
      preciso: '🎯 Ejecutado',
      pilar: '🏛️ Un paso más',
    };

    const celebration = data.celebration || defaultCelebration[data.habitType] || '✅ Hecho';

    await db.insert(habits).values({
      id: randomUUID(),
      userId,
      name: data.name,
      habitType: data.habitType,
      domain: data.domain || null,
      rescueAction: data.rescueAction,
      activeAction: data.activeAction || data.rescueAction,
      celebration,
      anchor: data.anchor || null,
      ifTrigger: data.ifTrigger || null,
      ifAction: data.ifAction || null,
      cue: data.cue || null,
      oldRoutine: data.oldRoutine || null,
      newRoutine: data.newRoutine || null,
      identityLabel: data.identityLabel || null,
      belongsToChainId: data.belongsToChainId || null,
      nextHabitId: data.nextHabitId || null,
      currentStrength: 0.0,
      lastStrengthDate: null,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/habits');
    revalidatePath('/journal');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al añadir hábito:', error);
    return { success: false, error: 'Ocurrió un error al guardar el hábito.' };
  }
}

export async function archiveHabit(habitId: string) {
  try {
    const v = validate(ArchiveHabitSchema, { habitId });
    if (!v.success) return { success: false, error: v.error };

    await db.update(habits).set({ isActive: 0 }).where(eq(habits.id, habitId));
    revalidatePath('/habits');
    revalidatePath('/journal');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al archivar hábito:', error);
    return { success: false, error: 'No se pudo completar la operación.' };
  }
}

export async function triggerAutoRescue(habitId: string) {
  try {
    const userId = await getCurrentUserId();
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });
    if (!habit) return { success: false, error: 'Hábito no encontrado' };

    await db.update(habits)
      .set({ activeAction: habit.rescueAction })
      .where(eq(habits.id, habitId));

    revalidatePath('/habits');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error en auto-rescue:', error);
    return { success: false, error: 'No se pudo ejecutar el rescate.' };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/habits.ts
git commit -m "feat: rewrite habit actions with new type system and auto-rescue"
```

---

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

### Task 5: Per-Type Card Rendering

**Files:**
- Modify: `src/app/habits/HabitsClient.tsx` (replace old EOR columns with per-type cards)
- Modify: `src/components/StrengthBar.tsx` (add celebration display)

**Interfaces:**
- Consumes: new `habitType`, `domain`, `activeAction`, `celebration` fields
- Produces: 5 different card layouts (one per type)

- [ ] **Step 1: Create a HabitCard sub-component per type**

In `HabitsClient.tsx`, implement card rendering based on `habitType`:

```tsx
function HabitCard({ habit }: { habit: any }) {
  const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
    crecer: { icon: '⚡', label: 'Crecer', color: 'border-l-stone-600' },
    sembrar: { icon: '🌱', label: 'Sembrar', color: 'border-l-emerald-500' },
    cambiar: { icon: '🔄', label: 'Cambiar', color: 'border-l-amber-500' },
    preciso: { icon: '🎯', label: 'Preciso', color: 'border-l-sky-500' },
    pilar: { icon: '🏛️', label: 'Pilar', color: 'border-l-violet-500' },
  };
  const config = typeConfig[habit.habitType] || typeConfig.crecer;

  const domainLabels: Record<string, string> = {
    cuerpo: 'Cuerpo', mente: 'Mente', trabajo: 'Trabajo',
    relaciones: 'Relaciones', hogar: 'Hogar', espiritual: 'Espiritual', finanzas: 'Finanzas',
  };

  return (
    <div className={`border-l-4 ${config.color} bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            {config.icon} {config.label}
            {habit.domain && <span className="ml-2 text-stone-300">· {domainLabels[habit.domain]}</span>}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        <button onClick={() => archiveHabit(habit.id)} className="text-stone-400 hover:text-red-500 transition-colors" title="Archivar">
          ✕
        </button>
      </div>

      {/* Active action display */}
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
        {habit.activeAction || habit.rescueAction}
      </p>

      {/* Type-specific details */}
      {habit.habitType === 'crecer' && habit.anchor && (
        <p className="text-xs text-stone-400">Después de: {habit.anchor}</p>
      )}
      {habit.habitType === 'sembrar' && habit.anchor && (
        <div className="text-xs text-stone-400 space-y-1">
          <p>Ancla: {habit.anchor}</p>
          {habit.celebration && <p>Celebración: {habit.celebration}</p>}
        </div>
      )}
      {habit.habitType === 'cambiar' && (
        <div className="text-xs text-stone-400 space-y-1">
          {habit.cue && <p>Disparador: {habit.cue}</p>}
          {habit.newRoutine && <p>Nueva rutina: {habit.newRoutine}</p>}
        </div>
      )}
      {habit.habitType === 'preciso' && habit.ifTrigger && (
        <p className="text-xs text-stone-400">Cuando {habit.ifTrigger} → {habit.ifAction}</p>
      )}
      {habit.habitType === 'pilar' && (
        <span className="inline-block text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
          Hábito clave
        </span>
      )}

      {/* Identity */}
      {habit.identityLabel && (
        <p className="text-xs text-stone-400 mt-1 italic">
          Te estás convirtiendo en una persona {habit.identityLabel}
        </p>
      )}

      {/* Strength */}
      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
        {habit.celebration && (
          <p className="text-xs text-stone-400 mt-1 text-right">{habit.celebration}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the old EOR columns in HabitsClient.tsx**

Replace the three-column EOR section with a flat grid of `HabitCard` components grouped by type:

```tsx
// Replace the old {activeSubTab === 'catalogo' && (...)} section
{activeSubTab === 'catalogo' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {habits.map(habit => (
      <HabitCard key={habit.id} habit={habit} />
    ))}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/habits/HabitsClient.tsx src/components/StrengthBar.tsx
git commit -m "feat: per-type habit card rendering with icon, action, and celebration"
```

---

### Task 6: Dashboard Integration

**Files:**
- Modify: `src/app/dashboard/HabitProgress.tsx` (show activeAction + rescue indicator)

**Interfaces:**
- Consumes: `activeAction`, `rescueAction`, `celebration` from habits

- [ ] **Step 1: Update HabitProgress to show active action + rescue badge**

```tsx
// In the habit item rendering section, add:
<div className="flex items-center justify-between py-2">
  <div className="flex items-center gap-3 flex-1">
    {/* ... existing checkbox ... */}
    <div className="flex-1">
      <span className={`text-sm ${completedIds.has(habit.id) ? 'line-through text-stone-400' : ''}`}>
        {habit.name}
      </span>
      <div className="flex items-center gap-2">
        <p className="text-xs text-stone-400">{habit.activeAction || habit.rescueAction}</p>
        {habit.activeAction !== habit.rescueAction && habit.activeAction === habit.rescueAction && (
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
            Modo rescate
          </span>
        )}
      </div>
      <StrengthBar strength={habit.currentStrength ?? 0} className="mt-1" />
    </div>
  </div>
  {/* Celebration */}
  {completedIds.has(habit.id) && habit.celebration && (
    <span className="text-xs text-stone-400">{habit.celebration}</span>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/HabitProgress.tsx
git commit -m "feat: show activeAction and rescue badge in dashboard"
```

---

### Task 7: AI Chat Tool Update

**Files:**
- Modify: `src/app/api/chat/route.ts` (update `crearNuevoHabito` tool)

**Interfaces:**
- Consumes: new `habitType` + `domain` enums
- Produces: tool creates habits with new schema

- [ ] **Step 1: Update the tool**

In `src/app/api/chat/route.ts`, lines 207-238, replace the tool:

```typescript
crearNuevoHabito: tool({
  description: 'Crea un nuevo hábito o disciplina diaria en el sistema del usuario.',
  inputSchema: z.object({
    name: z.string().describe('Nombre del hábito, ej: Devocional Matutino'),
    habitType: z.enum(['crecer', 'sembrar', 'cambiar', 'preciso', 'pilar']).default('crecer').describe('Tipo de hábito: crecer (nuevo), sembrar (mini), cambiar (reemplazo), preciso (if-then), pilar (keystone)'),
    domain: z.enum(['cuerpo', 'mente', 'trabajo', 'relaciones', 'hogar', 'espiritual', 'finanzas']).optional().describe('Área de vida del hábito'),
    rescueAction: z.string().describe('Versión mínima del hábito para días difíciles (menos de 2 minutos)'),
    anchor: z.string().optional().describe('Rutina existente después de la cual se hará el hábito'),
    celebration: z.string().optional().describe('Celebración al completar el hábito'),
  }),
  execute: async ({ name, habitType, domain, rescueAction, anchor, celebration }) => {
    console.log('⚡ [TOOL EXECUTING] Crear hábito:', { name, habitType, domain, rescueAction, anchor });
    if (!userId) {
      return 'SISTEMA: Error - Usuario no autenticado.';
    }
    try {
      const celebrationMap: Record<string, string> = {
        crecer: '✅ Hecho',
        sembrar: '🎉',
        cambiar: '🔄 Avance',
        preciso: '🎯 Ejecutado',
        pilar: '🏛️ Un paso más',
      };

      await db.insert(habits).values({
        id: randomUUID(),
        userId,
        name,
        habitType: habitType || 'crecer',
        domain: domain || null,
        rescueAction: rescueAction,
        activeAction: rescueAction,
        celebration: celebration || celebrationMap[habitType || 'crecer'],
        anchor: anchor || null,
        currentStrength: 0.15,
        isActive: 1,
        createdAt: new Date().toISOString(),
      });

      revalidatePath('/', 'layout');
      return 'SISTEMA: Acción completada y guardada en SQLite con éxito. Informa al usuario.';
    } catch (error) {
      console.error('❌ [TOOL DB ERROR]:', error);
      return 'SISTEMA: Error al guardar en la base de datos.';
    }
  },
}),
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: update AI habit creation tool with new types and domains"
```

---

### Task 8: Daily Journal Integration (Auto-Recovery Hook)

**Files:**
- Modify: `src/app/actions/daily-journal.ts` (add rescue trigger logic)

**Interfaces:**
- Consumes: `applyDecayAndBonus` result
- Produces: auto-rescue when 2 consecutive misses detected

- [ ] **Step 1: Add auto-rescue logic after strength update**

In `daily-journal.ts`, after the existing habit update loop (around line 209), add:

```typescript
// After updating all habits, check for auto-rescue
if (formData.dailyHabits && Array.isArray(formData.dailyHabits)) {
  for (const habitEntry of formData.dailyHabits) {
    if (!habitEntry.habitId) continue;

    const habitRecord = await db.query.habits.findFirst({
      where: eq(habits.id, habitEntry.habitId),
    });

    if (!habitRecord) continue;

    const { newStrength, newDate } = applyDecayAndBonus(
      habitRecord.currentStrength ?? 0,
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

    // Auto-rescue: if not completed and strength dropped significantly
    // (2+ consecutive misses = strength roughly halved)
    if (
      !habitEntry.completed &&
      habitRecord.rescueAction &&
      habitRecord.activeAction !== habitRecord.rescueAction &&
      newStrength < (habitRecord.currentStrength ?? 0) * 0.85
    ) {
      await db
        .update(habits)
        .set({ activeAction: habitRecord.rescueAction })
        .where(eq(habits.id, habitEntry.habitId));
    }

    // Restore: if 3+ consecutive completes, restore action
    if (
      habitEntry.completed === true &&
      habitRecord.rescueAction && habitRecord.rescueAction !== habitRecord.activeAction
    ) {
      // Check last 3 entries — if all completed, restore
      // For simplicity, restore after 3 consecutive days
      if (newStrength >= (habitRecord.currentStrength ?? 0) + 2.5) {
        await db
          .update(habits)
          .set({ activeAction: habitRecord.rescueAction })
          .where(eq(habits.id, habitEntry.habitId));
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/daily-journal.ts
git commit -m "feat: add auto-rescue hook on consecutive misses"
```

---

### Task 9: Main Page / Server Components Update

**Files:**
- Modify: `src/app/habits/page.tsx` (update copy, pass new fields)
- Modify: `src/app/page.tsx` (dashboard — update data shape)
- Modify: `src/app/journal/page.tsx` (pass habitsList with new shape)

**Interfaces:**
- Consumes: new habit columns

- [ ] **Step 1: Update habits page copy + types**

In `src/app/habits/page.tsx`, update the header:

```tsx
<h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
  Gestor de Hábitos
</h1>
<p className="text-sm text-stone-500 mt-1">
  Diseña tu comportamiento con el motor de hábitos inteligente: 
  <strong> Crecer, Sembrar, Cambiar, Preciso y Pilar</strong>.
</p>
```

- [ ] **Step 2: Update dashboard data mapping in page.tsx**

In `src/app/page.tsx`, ensure `initialHabits` mapping includes all new fields:

```tsx
const initialHabits = (res.habits || []).map(h => ({
  ...h,
  currentStrength: h.currentStrength ?? 0,
  lastStrengthDate: h.lastStrengthDate ?? null,
  activeAction: h.activeAction || h.rescueAction,
}));
```

- [ ] **Step 3: Commit**

```bash
git add src/app/habits/page.tsx src/app/page.tsx
git commit -m "feat: update server components for new habit shape"
```

---

### Task 10: Verify Everything Compiles

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```
Fix any type errors.

- [ ] **Step 2: Run existing tests**

```bash
npm test
```
Fix any test failures.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Fix any lint errors.

- [ ] **Step 4: Final commit for fixes**

```bash
git add -A
git commit -m "chore: fix type/lint issues after habit engine migration"
```
