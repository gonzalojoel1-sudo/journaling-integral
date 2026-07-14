# Task 2: Cadena ⛓️ — Sequential Chain with Anchor

**Status:** DONE_WITH_CONCERNS

## Commits
- `bd7da36` feat: Cadena sequential chain with anchor block and step-by-step progress

## Files Changed
| File | Action |
|------|--------|
| `src/app/habits/cards/HabitCardCadena.tsx` | Created |
| `src/lib/cadena-store.ts` | Created |
| `src/app/habits/habitCards.tsx` | Modified — added Cadena routing, typeConfig, and ChainStep interface |
| `src/db/schema.ts` | Modified — added `name` column to `chain_items` table |

## What Was Done
- **HabitCardCadena**: Expandable card with anchor block (non-interactive), numbered steps with mini-checkboxes, vertical progress line that illuminates per tick, neon glow on all-steps-complete, and compact summary.
- **cadena-store.ts**: `getChainWithSteps(chainId)` function querying `chains` + `chain_items` via Drizzle ORM.
- **habitCards.tsx**: Added `cadena` → `HabitCardCadena` routing before `sembrar`. Added `ChainStep` interface and `chainSteps`/`chainId` to `HabitCardHabit`.
- **Schema**: Added optional `name` column to `chain_items` — steps are inline (name-only), not reliant on the `habitId` FK.

## TypeScript Verification
- `npx tsc --noEmit` — **No errors.**

## Concerns
1. **DB migration needed**: The `chain_items.name` column was added to the schema but no migration was run. The table in SQLite won't have the column until a migration (`drizzle-kit push` or similar) is executed. Without it, the app will error at runtime when trying to read/write `.name`.
2. **Inline vs FK**: The existing `chain_items.habitId` FK remains in the schema but isn't used by the Cadena component. This is intentional per the brief (steps are inline), but the FK reference might cause confusion. Consider either dropping it in a future migration or keeping it for legacy.
