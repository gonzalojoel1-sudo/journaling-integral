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

