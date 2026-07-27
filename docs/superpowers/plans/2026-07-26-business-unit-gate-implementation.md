# Business Unit Gate + Enhanced Unit Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add business unit creation gate to Centro de Mando, enrich unit form with category/monthlyGoal/isRecurring, and show unit stats in breakdown.

**Architecture:** Add 3 columns to businessSettings schema, create a full-page gate component, enrich BusinessSettingsModal form, update CentroMandoDashboard header with prominent CTA, and update UnitPerformanceBreakdown to show new fields.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, SQLite, React 'use client'

---

## Task 1: Schema - Add 3 new columns to businessSettings

**Files:**
- Modify: `src/db/schema.ts:343-353`

**Interfaces:**
- Produces: `businessSettings.category`, `businessSettings.monthlyGoal`, `businessSettings.isRecurring`

- [ ] **Step 1: Modify schema**

In `src/db/schema.ts`, find the `businessSettings` table definition (around line 343) and add 3 new columns after `isActive`:

```typescript
category: text('category').default('Servicio').notNull(),
monthlyGoal: real('monthly_goal').default(0).notNull(),
isRecurring: integer('is_recurring').default(0).notNull(),
```

The columns should be: `category` (text, default 'Servicio'), `monthlyGoal` (real, default 0), `isRecurring` (integer, default 0).

- [ ] **Step 2: Run drizzle migration**

Generate and apply the migration:
```bash
cd /Users/joelpacheco/PROYECTOS/journaling-integral && npx drizzle-kit push
```

Expected: Migration applied successfully, 3 new columns created.

- [ ] **Step 3: Commit**
```bash
git add src/db/schema.ts drizzle.config.ts
git commit -m "feat(business): add category, monthlyGoal, isRecurring to businessSettings"
```

---

## Task 2: upsertBusinessSetting action - accept new fields

**Files:**
- Modify: `src/app/actions/business.ts` — find `upsertBusinessSetting` function

**Interfaces:**
- Consumes: `category`, `monthlyGoal`, `isRecurring` from caller
- Produces: upsertBusinessSetting now accepts and stores these 3 new fields

- [ ] **Step 1: Read current upsertBusinessSetting**

Find the `upsertBusinessSetting` function in `src/app/actions/business.ts`. It currently takes `{ id, name, defaultSaleAmount, defaultSaleCost, isActive }`.

- [ ] **Step 2: Add new fields to the action**

In `upsertBusinessSetting`, add 3 new params and include them in the upsert:
```typescript
await db.insert(businessSettings).values({
  id: data.id || randomUUID(),
  userId,
  name: data.name,
  defaultSaleAmount: data.defaultSaleAmount ?? 0,
  defaultSaleCost: data.defaultSaleCost ?? 0,
  isActive: data.isActive ?? 1,
  category: data.category ?? 'Servicio',
  monthlyGoal: data.monthlyGoal ?? 0,
  isRecurring: data.isRecurring ?? 0,
  createdAt: new Date().toISOString(),
}).onConflictDoUpdate({ target: businessSettings.id, set: { ... } });
```

Make sure the `onConflictDoUpdate` set also updates the 3 new fields.

- [ ] **Step 3: Commit**
```bash
git add src/app/actions/business.ts
git commit -m "feat(business): upsertBusinessSetting accepts category, monthlyGoal, isRecurring"
```

---

## Task 3: BusinessSettingsModal - add 3 new fields to form

**Files:**
- Modify: `src/components/business/BusinessSettingsModal.tsx`

**Interfaces:**
- Produces: BusinessSettingsModal form now includes category select, monthlyGoal input, isRecurring toggle

- [ ] **Step 1: Add new state fields**

In `BusinessSettingsModal`, add state for the 3 new fields:
```typescript
const [newCategory, setNewCategory] = useState('Servicio');
const [newMonthlyGoal, setNewMonthlyGoal] = useState('');
const [newIsRecurring, setNewIsRecurring] = useState(false);
```

- [ ] **Step 2: Add category select to new unit form**

In the `showNew` form (around line 152-175), add after the name input:
```tsx
<select
  value={newCategory}
  onChange={(e) => setNewCategory(e.target.value)}
  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-emerald-500/50"
>
  <option value="Servicio">Servicio</option>
  <option value="Producto">Producto</option>
  <option value="Curso">Curso</option>
  <option value="Mentoría">Mentoría</option>
</select>
```

- [ ] **Step 3: Add monthlyGoal input**

Add after the cost input:
```tsx
<input
  type="number"
  value={newMonthlyGoal}
  onChange={(e) => setNewMonthlyGoal(e.target.value)}
  placeholder="Meta mensual ($)"
  className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
/>
```

- [ ] **Step 4: Add isRecurring toggle**

Add a toggle after the form fields:
```tsx
<label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
  <input
    type="checkbox"
    checked={newIsRecurring}
    onChange={(e) => setNewIsRecurring(e.target.checked)}
    className="rounded border-zinc-300 dark:border-zinc-600"
  />
  ¿Es recurrente? (ingresos mensuales/suscripciones)
</label>
```

- [ ] **Step 5: Update handleCreate to pass new fields**

In `handleCreate`, add the 3 new fields to the upsert call:
```typescript
await upsertBusinessSetting({
  name: newName,
  defaultSaleAmount: Number(newAmount) || 0,
  defaultSaleCost: Number(newCost) || 0,
  category: newCategory,
  monthlyGoal: Number(newMonthlyGoal) || 0,
  isRecurring: newIsRecurring ? 1 : 0,
  isActive: true,
});
```

Also reset the new fields after creation:
```typescript
setNewCategory('Servicio');
setNewMonthlyGoal('');
setNewIsRecurring(false);
```

- [ ] **Step 6: Add fields to existing unit editing**

In the `handleSaveItem` function and the per-unit editing UI (inside the `items.map`), add the same 3 fields so existing units can be updated. This requires:
- Update the `handleUpdateField` to handle 'category', 'monthlyGoal', 'isRecurring'
- Add category select, monthlyGoal input, and recurring toggle to each existing unit card

- [ ] **Step 7: Commit**
```bash
git add src/components/business/BusinessSettingsModal.tsx
git commit -m "feat(business): add category, monthlyGoal, isRecurring to unit form"
```

---

## Task 4: CreateFirstUnitGate component

**Files:**
- Create: `src/components/business/CreateFirstUnitGate.tsx`

**Interfaces:**
- Consumes: `onCreated: () => void` callback
- Produces: `CreateFirstUnitGate` component

- [ ] **Step 1: Create the component**

Create `src/components/business/CreateFirstUnitGate.tsx` with a full-page centered layout:

```tsx
'use client';

import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { upsertBusinessSetting } from '@/app/actions/business';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Servicio', 'Producto', 'Curso', 'Mentoría'];

export function CreateFirstUnitGate() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Servicio');
  const [saleAmount, setSaleAmount] = useState('');
  const [cost, setCost] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await upsertBusinessSetting({
      name,
      defaultSaleAmount: Number(saleAmount) || 0,
      defaultSaleCost: Number(cost) || 0,
      category,
      monthlyGoal: Number(monthlyGoal) || 0,
      isRecurring: isRecurring ? 1 : 0,
      isActive: true,
    });
    router.refresh();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-lg w-full p-8 space-y-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-emerald-500/10 items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Crea tu primera unidad de negocio
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Define qué vendes para empezar a trackear tu negocio. Puedes agregar más después.
        </p>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 space-y-4 text-left">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sesión de Coaching, Curso de Marketing"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Precio de venta ($)</label>
              <input
                type="number"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Costo ($)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Meta mensual ($)</label>
            <input
              type="number"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              placeholder="Ingreso objetivo mensual"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600 w-4 h-4"
            />
            ¿Es recurrente? (ingresos mensuales o suscripciones)
          </label>

          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold px-6 py-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            {saving ? 'Creando...' : 'Crear mi primera unidad'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/business/CreateFirstUnitGate.tsx
git commit -m "feat(business): add CreateFirstUnitGate full-page component"
```

---

## Task 5: CentroMandoDashboard - add gate + prominent CTA button

**Files:**
- Modify: `src/app/negocio/CentroMandoDashboard.tsx`

**Interfaces:**
- Consumes: `settingsList` prop
- Produces: Gate renders when no units, new "CREAR UNIDAD" button in header

- [ ] **Step 1: Add gate logic**

In `CentroMandoDashboard`, add check at the top of render:
```tsx
if (settingsList.length === 0) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">Panel Financiero</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">Centro de Mando</h1>
        </div>
      </header>
      <CreateFirstUnitGate />
    </div>
  );
}
```

Import `CreateFirstUnitGate`:
```tsx
import { CreateFirstUnitGate } from '@/components/business/CreateFirstUnitGate';
```

- [ ] **Step 2: Replace gear icon with prominent button**

In the header, replace the `<BusinessSettings initialSettings={settingsList} />` button with:

```tsx
<div className="flex items-center gap-2">
  {settingsList.length > 0 && (
    <button
      onClick={() => {/* open modal to create new unit */}}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
    >
      <Plus className="h-4 w-4" />
      CREAR UNIDAD DE NEGOCIO
    </button>
  )}
  <BusinessSettings initialSettings={settingsList} />
</div>
```

Wait — `BusinessSettings` is a button that opens a modal. We need to expose its internal toggle state OR create a new approach. Look at `BusinessSettings.tsx` — it has internal `show` state.

Better approach: Make `BusinessSettings` expose an `onCreateNew` prop, OR just render the button directly in `CentroMandoDashboard` and call a server action to create.

Actually, the simplest approach: keep `BusinessSettings` as-is for managing existing units. Add a separate "CREAR UNIDAD DE NEGOCIO" button that directly calls `upsertBusinessSetting` with minimal fields OR opens a dedicated modal.

**Simpler approach**: Add `showNew={true}` prop to `BusinessSettingsModal` when creating from the CTA. But `BusinessSettingsModal` starts with `showNew=false`.

Actually the cleanest approach: Extract the modal opening state from `BusinessSettings` or just open `BusinessSettingsModal` directly. Let me check if we can pass an initial `showNew` prop.

Looking at the current `BusinessSettings` component:
```tsx
export function BusinessSettings({ initialSettings }: BusinessSettingsProps) {
  const [show, setShow] = useState(false);
  ...
  {show && <BusinessSettingsModal settings={initialSettings} onClose={() => setShow(false)} />}
}
```

We can modify `BusinessSettings` to accept an optional `openOnMount` prop:
```tsx
export function BusinessSettings({ initialSettings, openOnMount = false }: BusinessSettingsProps) {
  const [show, setShow] = useState(openOnMount);
```

Then in `CentroMandoDashboard`, add the button:
```tsx
<button
  onClick={() => {/* open modal with new unit form visible */}}
  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
>
  <Plus className="h-4 w-4" />
  CREAR UNIDAD DE NEGOCIO
</button>
```

But we still need to open the modal. Let me use a simpler approach: wrap the button in a state that controls the modal.

**Simpler approach**: Create a local `showModal` state in `CentroMandoDashboard` and render `BusinessSettingsModal` directly with `showNew={true}` for the CTA click:

```tsx
const [showCreateModal, setShowCreateModal] = useState(false);
...
<button
  onClick={() => setShowCreateModal(true)}
  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
>
  <Plus className="h-4 w-4" />
  CREAR UNIDAD DE NEGOCIO
</button>
...
{showCreateModal && (
  <BusinessSettingsModal
    settings={settingsList}
    onClose={() => setShowCreateModal(false)}
    initialShowNew={true}
  />
)}
```

Modify `BusinessSettingsModal` to accept `initialShowNew` prop:
```tsx
interface BusinessSettingsModalProps {
  settings: BusinessSetting[];
  onClose: () => void;
  initialShowNew?: boolean;
}

export function BusinessSettingsModal({ settings, onClose, initialShowNew = false }: BusinessSettingsModalProps) {
  const [showNew, setShowNew] = useState(initialShowNew);
```

- [ ] **Step 3: Add Plus import if not present**
Add `Plus` to lucide-react imports.

- [ ] **Step 4: Commit**
```bash
git add src/app/negocio/CentroMandoDashboard.tsx
git commit -m "feat(business): add unit creation gate and prominent CTA in CentroMandoDashboard"
```

---

## Task 6: UnitPerformanceBreakdown - show category/recurring badges

**Files:**
- Modify: `src/components/business/UnitPerformanceBreakdown.tsx`

**Interfaces:**
- Consumes: `data[].category`, `data[].isRecurring`, `data[].monthlyGoal` (need to add these to interface)
- Produces: Category badge, recurring badge, and monthly goal progress bar

- [ ] **Step 1: Update UnitPerformance interface**

Add 3 new fields to `UnitPerformance`:
```tsx
export interface UnitPerformance {
  id: string;
  name: string;
  income: number;
  expenses: number;
  net: number;
  margin: number;
  count: number;
  category?: string;       // NEW
  isRecurring?: number;   // NEW
  monthlyGoal?: number;    // NEW
}
```

- [ ] **Step 2: Update CentroMandoDashboard to pass new fields**

In `CentroMandoDashboard`, when building `unitPerformance`, include the new fields from `settingsList`:
```tsx
buckets.set(sourceName, {
  ...initial,
  income,
  expenses,
  net: income - expenses,
  margin: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
  count: initial.count + 1,
  category: existing?.category ?? s.category,
  isRecurring: existing?.isRecurring ?? s.isRecurring,
  monthlyGoal: existing?.monthlyGoal ?? s.monthlyGoal,
});
```

Wait, `settingsList` items have `category`, `monthlyGoal`, `isRecurring` from DB. So we need to map from `settingsList` into the bucket. Since we're iterating `settingsList.forEach`, we can access the settings values directly.

Actually the logic needs to be: for each unit in settingsList, get its category/isRecurring/monthlyGoal. And for "Sin clasificar" bucket, those are null/undefined.

Update the `unitPerformance` useMemo to include:
```tsx
const unitMap = new Map(settingsList.map(s => [s.name, s]));
...
const settings = unitMap.get(sourceName);
const unitPerf = buckets.get(sourceName)!;
unitPerf.category = settings?.category ?? 'Servicio';
unitPerf.isRecurring = settings?.isRecurring ?? 0;
unitPerf.monthlyGoal = settings?.monthlyGoal ?? 0;
```

- [ ] **Step 3: Add category badge next to name**

In the unit row, after the briefcase icon:
```tsx
<div className="flex items-center gap-2">
  <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center shrink-0">
    <Briefcase className="h-4 w-4 text-zinc-500" />
  </div>
  <div>
    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{unit.name}</span>
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
        {unit.category ?? 'Servicio'}
      </span>
      {unit.isRecurring === 1 && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          Recurrente
        </span>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add monthly goal progress bar (if monthlyGoal > 0)**

Add after the net/trend row:
```tsx
{unit.monthlyGoal && unit.monthlyGoal > 0 && (
  <div className="mt-2">
    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mb-1">
      <span>Meta mensual</span>
      <span>{formatCurrency(unit.income)} / {formatCurrency(unit.monthlyGoal)}</span>
    </div>
    <div className="relative h-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-emerald-500/70 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, (unit.income / unit.monthlyGoal) * 100)}%` }}
      />
    </div>
  </div>
)}
```

- [ ] **Step 5: Commit**
```bash
git add src/components/business/UnitPerformanceBreakdown.tsx src/app/negocio/CentroMandoDashboard.tsx
git commit -m "feat(business): show category/recurring badges and monthly goal progress in breakdown"
```

---

## Task 7: Update BusinessSettings to accept openOnMount prop

**Files:**
- Modify: `src/app/negocio/BusinessSettings.tsx`

- [ ] **Step 1: Add openOnMount prop**

```tsx
interface BusinessSettingsProps {
  initialSettings: BusinessSetting[];
  openOnMount?: boolean;
}

export function BusinessSettings({ initialSettings, openOnMount = false }: BusinessSettingsProps) {
  const [show, setShow] = useState(openOnMount);
```

- [ ] **Step 2: Pass initialShowNew to BusinessSettingsModal**

In the modal render:
```tsx
<BusinessSettingsModal
  settings={initialSettings}
  onClose={() => setShow(false)}
  initialShowNew={openOnMount}
/>
```

- [ ] **Step 3: Commit**
```bash
git add src/app/negocio/BusinessSettings.tsx
git commit -m "feat(business): BusinessSettings accepts openOnMount prop"
```

---

## Verification

After all tasks, verify:
1. Fresh user with no business units sees the gate page
2. After creating first unit, sees full dashboard
3. "CREAR UNIDAD DE NEGOCIO" button visible in header
4. Unit breakdown shows category badge, recurring badge, and monthly goal progress bar
5. Can edit existing units with new fields
