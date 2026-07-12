# Task 3 Report: Server Actions

**Status:** DONE

**Changes made:**
- Rewrote `src/app/actions/habits.ts` to work with the new schema
- `createHabit()` now accepts an object parameter with all new fields (`habitType`, `domain`, `rescueAction`, `activeAction`, `celebration`, `anchor`, `ifTrigger`, `ifAction`, `cue`, `oldRoutine`, `newRoutine`, `identityLabel`, `belongsToChainId`, `nextHabitId`)
- Added `defaultCelebration` mapping per habit type
- `activeAction` defaults to `rescueAction` if not provided
- `archiveHabit()` now revalidates `/journal` and `/` in addition to `/habits`
- Added `triggerAutoRescue()` action that finds the habit and resets `activeAction` to `rescueAction`
- Added `getActiveHabits()` (preserved from previously existing)

**Verification:**
- `npx tsc --noEmit --pretty` — no errors in `habits.ts`

**Commit:**
- `43bb6eb` feat: rewrite habit actions with new type system and auto-rescue
