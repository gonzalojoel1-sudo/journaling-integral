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

