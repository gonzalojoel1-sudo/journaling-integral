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

