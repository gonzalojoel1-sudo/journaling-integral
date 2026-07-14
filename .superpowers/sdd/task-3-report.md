# Task 3 Report: Crecer ⚡ — Momentum Streak with Shield

**Status:** DONE

## Changes Made

### 1. Created `src/app/habits/cards/HabitCardCrecer.tsx`
- New card component for Crecer habits
- Displays flame tier icons based on streak length (0-6: 🔥 Empezando, 7-13: 🔥 Consistente, 14-20: 🔥🔥 Disciplinado, 21-29: 🔥🔥🔥 Imparable, 30+: 👑 Maestro)
- Shows shield icons (max 2) using lucide-react Shield
- Expandable section shows anchor link and shield count

### 2. Added shield earn/consume logic to `daily-journal.ts`
- Inside the habit loop, after all existing blocks (Sembrar evolution, auto-rescue), added Crecer shield block
- On completion: increments streak, earns 1 shield every 7 days (capped at 2)
- On miss with shields > 0: consumes 1 shield, streak preserved
- On miss with shields = 0: resets streak to 0
- Imported `applyStreakShield` from habit-strength (though block uses inline logic per brief)

### 3. Added `applyStreakShield` to `src/lib/habit-strength.ts`
- Pure function calculating new streak and shields
- Completed: streak+1, shield if newStreak % 7 === 0 (max 2)
- Missed with shields: shields-1, streak preserved
- Missed without shields: streak=0, shields=0

### 4. Routed Crecer in `habitCards.tsx`
- Imported `HabitCardCrecer`
- Added early return for `habit.habitType === 'crecer'` before other type checks

### 5. TypeScript verification
- `npx tsc --noEmit` passes with no errors

## Commit
`1c94d1e` feat: Crecer momentum streak with shield system (earn 1 per 7 days, max 2)

## Files modified
| File | Action |
|------|--------|
| `src/app/habits/cards/HabitCardCrecer.tsx` | Created |
| `src/app/actions/daily-journal.ts` | Modified (Crecer shield block in habit loop) |
| `src/lib/habit-strength.ts` | Modified (added `applyStreakShield`) |
| `src/app/habits/habitCards.tsx` | Modified (added Crecer routing) |
