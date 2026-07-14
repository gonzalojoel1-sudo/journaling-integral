# Task 4: Cambiar 🔄 — New Neural Path Builder — Report

## Status: DONE

## Changes

### 1. Created `src/app/habits/cards/HabitCardCambiar.tsx`
- Single victory bar (new path only — no old habit/shaming UI)
- Victory count X/30 with amber progress bar
- Expanded view shows new routine, execution rate, and completion message at 30
- Uses `StrengthBar` for strength display
- No reference to oldRoutine in the UI (only in backend for user reference)

### 2. Modified `src/app/actions/daily-journal.ts`
- Added cambiar victory tracking block after the crecer block (line 267)
- On completion: `victoryCount + 1` (no penalty for miss)
- On temptation appeared + not completed: `temptationCount + 1` (internal only, no UI display)
- Follows existing pattern of `sembrar` and `crecer` type-specific blocks

### 3. Modified `src/app/habits/HabitWizard.tsx`
- Added `cue`, `oldRoutine`, `newRoutine` to `WizardData` type and state
- Step 2 "cambiar" button now routes to new step 8 (cambiar details)
- Step 8 collects: cue ("¿Qué disparador desencadena ese hábito?"), oldRoutine ("¿Qué haces exactamente?"), newRoutine ("¿Qué harás en su lugar?")
- Step 8 → step 4 (anchor) on completion
- `handleSubmit` passes `cue`, `oldRoutine`, `newRoutine` to `createHabit`
- `Step` type expanded to include `8`

### 4. Modified `src/app/habits/habitCards.tsx`
- Imported `HabitCardCambiar`
- Added routing: `habit.habitType === 'cambiar'` returns `<HabitCardCambiar />`

## Verification
- `npx tsc --noEmit` — **0 errors**

## Commit
- `dea3f1a` — `feat: Cambiar positive-only substitution with victory tracking and no-shame UI`

## Artifacts
- Report file: `/Users/joelpacheco/PROYECTOS/journaling-integral/.superpowers/sdd/task-4-report.md`
