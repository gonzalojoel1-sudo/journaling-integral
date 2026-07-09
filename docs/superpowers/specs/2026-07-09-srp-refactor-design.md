# SRP Refactor — Single Responsibility Principle 10/10

**Date:** 2026-07-09
**Status:** Approved
**Principle:** Every file and function must answer exactly one question: "What does this do?" with a single answer.

---

## Problem

The codebase has accumulated SRP violations across several key files:

| File | Lines | Severity | Issue |
|---|---|---|---|
| `src/app/actions/journal.ts` | 538 | Critical | 6 domains in 1 file |
| `src/components/Navigation.tsx` | 216 | High | 5 responsibilities in 1 component |
| `src/db/seed.ts` | 1082 | Medium | Data + logic + dead code mixed |
| `src/db/schema.ts` | 178 | Low | 6 tables in 1 file |
| Hardcoded constants | — | Medium | Duplicated across 3+ files |

---

## Design: Flat Domain Split

### 1. Server Actions (`src/app/actions/`)

Split the monolithic `journal.ts` into domain-specific files with a barrel export.

```
src/app/actions/
├── auth.ts              # getCurrentUserId, getOrCreateUserProfile, updateUserLevel
├── journal.ts           # submitDailyEntry, getAnalyticsData
│                         # + calculateStreak(), checkLevelProgression() (extracted pure functions)
├── weekly-plan.ts       # getActiveWeeklyPlan, saveWeeklyPlan, getISOWeekLabel
├── quarterly-plan.ts    # getActiveQuarterlyPlan, saveQuarterlyPlan
├── habits.ts            # getActiveHabits, createHabit, archiveHabit
├── bible.ts             # getRandomVerse, getVersesByTopic
├── constants.ts         # DEMO_USER_ID, DEMO_USER_EMAIL, DEMO_USER_NAME, FALLBACK_VERSES
└── index.ts             # barrel re-export (same names, zero consumer changes)
```

**Key refactor in `submitDailyEntry`:**
- `calculateStreak(entries, today)` — pure function, no DB access. Returns `{ currentStreak, maxStreak }`.
- `checkLevelProgression(user, activeDaysInLast30)` — pure function. Returns `{ shouldUpgrade, newLevel }`.
- `submitDailyEntry` orchestrates: upsert entry -> call calculateStreak -> call checkLevelProgression -> revalidate.

### 2. Navigation Component (`src/components/Navigation/`)

```
src/components/
├── Navigation/
│   ├── index.tsx           # Orchestrator: renders Desktop or Mobile, manages session state
│   ├── DesktopSidebar.tsx  # Sidebar with branding, nav links, user info (props-driven)
│   ├── MobileNav.tsx       # Bottom tab bar with ThemeToggle (props-driven)
│   └── AdminControls.tsx   # Admin level simulation panel (1/2/3 buttons)
├── ThemeToggle.tsx          # No changes
```

- Admin email check becomes `isAdmin` prop, eliminating hardcoded string duplication.
- Each subcomponent is pure UI driven by props.

### 3. Database Schema (`src/db/schema/`)

```
src/db/schema/
├── users.ts
├── daily-entries.ts
├── weekly-plans.ts
├── quarterly-plans.ts
├── habits.ts
├── bible-verses.ts
└── index.ts           # barrel: re-exports all tables and relations
```

`db.ts` imports from `./schema` (the barrel) — no change needed.

### 4. Seed Script (`src/db/seed/`)

```
src/db/seed/
├── index.ts               # Seed logic only (~120 lines)
└── data/
    └── bible-verses.ts    # Pure data array (~970 lines, 120 verses)
```

- Dead `hashPassword` function removed.
- `DEMO_USER_EMAIL` imported from `src/app/actions/constants.ts`.

### 5. Shared Constants (`src/lib/constants.ts`)

Single source of truth for all hardcoded data:

```typescript
export const DEMO_USER_ID = 'demo-user-id';
export const DEMO_USER_EMAIL = 'joel@journalingintegral.demo';
export const DEMO_USER_NAME = 'Joel Pacheco';
export const FALLBACK_VERSES = [...];
```

Imported by: `actions/auth.ts`, `actions/bible.ts`, `db/seed/index.ts`, `Navigation/index.tsx`.

---

## Compatibility Guarantee

All barrel `index.ts` files re-export with the exact same names. **Zero changes to consumer imports.** The following imports remain identical:

- `import { getOrCreateUserProfile } from '@/app/actions/journal'` — now resolves through the barrel.
- `import { Navigation } from '@/components/Navigation'` — unchanged.
- `import * as schema from '@/db/schema'` — unchanged.

---

## Validation

- `npm run build` must pass with zero errors.
- `npm run lint` must pass with zero warnings.
- `npm run dev` must load all pages: `/`, `/journal`, `/quarterly`, `/review`, `/habits`, `/history`, `/progress`, `/admin/users`.
- Seed: `npm run db:seed` must complete without errors.
- All existing functionality preserved — no behavioral changes, pure structural refactor.
