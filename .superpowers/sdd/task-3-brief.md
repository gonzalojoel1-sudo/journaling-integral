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

