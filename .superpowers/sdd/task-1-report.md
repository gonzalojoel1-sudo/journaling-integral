# Task 1: Sembrar 🌱 — Evolution Cycles

## Status: DONE

## Files Created/Modified
- **Created** `src/app/habits/cards/HabitCardSembrar.tsx` — Sembrar card with evolution bar, expandable details, and upgrade modal
- **Created** `src/app/api/habits/evolve/route.ts` — POST endpoint that increments `evolutionCycle`, resets `daysInCurrentCycle`, updates `activeAction`/`rescueAction` with new evolution targets
- **Modified** `src/app/actions/daily-journal.ts` — Inside habit loop, after strength update, increments `daysInCurrentCycle` when a Sembrar habit is completed (capped at 15)
- **Modified** `src/app/habits/habitCards.tsx` — Added import and early return `if (habit.habitType === 'sembrar')` to render `HabitCardSembrar`

## Verification
- `npx tsc --noEmit` — passed with zero errors

## Commit
- `bc07964` — `feat: Sembrar evolution mechanic with 15-day cycles and upgrade modal`

## Concerns
None.
