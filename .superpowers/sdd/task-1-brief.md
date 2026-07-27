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

