# Kairos Deep Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 initiatives from the Deep Audit: Turso rate limiter, automatic challenge engine (no levels), voice mode, and circles of trust.

**Architecture:** Next.js 15 App Router with SQLite/Turso dual-mode (via `@libsql/client` + `drizzle-orm`). Server Actions for mutations, AI SDK for chat/smart-entry, browser SpeechRecognition API for voice.

**Tech Stack:** Next.js 15.1.11, React 19, TypeScript, Drizzle ORM, Turso/SQLite, TailwindCSS, Lucide icons, Vercel AI SDK v7

## Global Constraints

- Cost: $0 (Turso free tier, browser SpeechRecognition, existing APIs)
- No modifications to Normal or Día Difícil journal modes
- No modifications to navigation, layout, auth, RAG, embeddings, Kairo Chat, business module, or personal finance module
- All new database tables use `text` UUID primary keys and ISO date strings (existing convention)
- All server actions filter by `getCurrentUserId()` (existing pattern)
- All API routes maintain same public signatures (backward compatible)

---

### Task Group 1: Turso Rate Limiter (1.3)

**Files:**
- Modify: `src/db/schema.ts` (append rate_limits table)
- Modify: `src/lib/rate-limit.ts` (replace in-memory Map with Turso queries)
- Modify: `.env` and `.env.local` (add Turso credentials — user provides these)

**Interfaces:**
- Consumes: `db` from `src/db/db.ts` (already supports Turso)
- Produces: Same public API: `rateLimit(key, limit, windowMs)` → `{ success, remaining, resetMs }`, `getRateLimitInfo(key, limit, windowMs)` → `{ count, remaining, resetMs }`, `getClientIdentifier(req, userId?)` → `string`

- [ ] **Step 1: Add `rate_limits` table to schema**

Append to `src/db/schema.ts` after the `journalEmbeddings` table:

```typescript
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start').notNull(),
  updatedAt: text('updated_at').notNull(),
});
```

- [ ] **Step 2: Rewrite `src/lib/rate-limit.ts` to use Turso**

Replace the entire file:

```typescript
import { db } from '../db/db';
import { rateLimits } from '../db/schema';
import { eq } from 'drizzle-orm';

export function rateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();

  try {
    const existing = db
      ?.select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .get();

    if (!existing || now > existing.windowStart + windowMs) {
      db?.insert(rateLimits)
        .values({ key, count: 1, windowStart: now, updatedAt: new Date().toISOString() })
        .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, windowStart: now, updatedAt: new Date().toISOString() } })
        .run();
      return { success: true, remaining: limit - 1, resetMs: windowMs };
    }

    if (existing.count >= limit) {
      const resetMs = (existing.windowStart + windowMs) - now;
      return { success: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }

    db?.update(rateLimits)
      .set({ count: existing.count + 1, updatedAt: new Date().toISOString() })
      .where(eq(rateLimits.key, key))
      .run();

    const resetMs = (existing.windowStart + windowMs) - now;
    return { success: true, remaining: limit - (existing.count + 1), resetMs: Math.max(0, resetMs) };
  } catch (error) {
    console.error('[RATE-LIMIT] Error accessing Turso:', error);
    // fail open: allow request if DB is down
    return { success: true, remaining: limit, resetMs: windowMs };
  }
}

export function getRateLimitInfo(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): { count: number; remaining: number; resetMs: number } {
  const now = Date.now();
  try {
    const existing = db
      ?.select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .get();

    if (!existing || now > existing.windowStart + windowMs) {
      return { count: 0, remaining: limit, resetMs: windowMs };
    }

    const resetMs = (existing.windowStart + windowMs) - now;
    return {
      count: existing.count,
      remaining: Math.max(0, limit - existing.count),
      resetMs: Math.max(0, resetMs),
    };
  } catch {
    return { count: 0, remaining: limit, resetMs: windowMs };
  }
}

export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return userId;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
```

- [ ] **Step 3: Apply schema migration**

```bash
npx drizzle-kit push
```

Verify `rate_limits` table exists in the database.

- [ ] **Step 4: Verify build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/lib/rate-limit.ts
git commit -m "feat: migrate rate limiter from in-memory Map to Turso table"
```

---

### Task Group 2: Automatic Challenge Engine (2.1)

**Files:**
- Create: `src/lib/challenge-auto-activate.ts`
- Create: `src/components/challenges/ChallengeNotify.tsx`
- Modify: `src/app/actions/challenges.ts`
- Modify: `src/app/actions/daily-journal.ts`
- Modify: `src/app/challenges/page.tsx`
- Modify: `src/app/challenges/ChallengesClient.tsx`
- Modify: `src/app/page.tsx` (dashboard)
- Modify: `src/db/schema.ts` (add recommendedTier to bibleVerses)
- Modify: `src/lib/constants.ts` (optional — add escalon names)

**Interfaces:**
- Consumes: `getCurrentUserId()` from auth, `store` exports from schema, `getTemplate()` from challenge-templates
- Produces: `autoActivateChallenges(userId, entry)` called from `submitDailyEntry`, widget data for dashboard

- [ ] **Step 1: Create `src/lib/challenge-auto-activate.ts`**

```typescript
import { db } from '../db/db';
import { badges } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const ESCALONES = [
  { days: 7, id: 'escalon-7', name: 'Primer Paso' },
  { days: 14, id: 'escalon-14', name: 'Ritmo' },
  { days: 30, id: 'escalon-30', name: 'Hábito' },
  { days: 60, id: 'escalon-60', name: 'Propósito' },
  { days: 90, id: 'escalon-90', name: 'Maestría' },
  { days: 180, id: 'escalon-180', name: 'Constancia' },
  { days: 270, id: 'escalon-270', name: 'Identidad' },
  { days: 365, id: 'escalon-365', name: 'Legado' },
];

const AREA_ESCALONES = [7, 14, 30, 60, 90];

const AREAS = [
  { key: 'fe', check: (e: any) => !!e.devotionalNotes },
  { key: 'negocio', check: (e: any) => e.bizSalesCount > 0 || e.bizProspectCompleted },
  { key: 'mente', check: (e: any) => !!e.autoeducation },
  { key: 'relaciones', check: (e: any) => !!e.gratitude1 },
  { key: 'cuerpo', check: (e: any) => (e.sleepRating || 0) >= 7 || (e.energyRating || 0) >= 7 },
  { key: 'identidad', check: (e: any) => !!e.chooseToBeIdentity },
  { key: 'legado', check: (e: any) => !!e.legacyReflection },
];

async function hasBadge(userId: string, badgeId: string): Promise<boolean> {
  const existing = await db.query.badges.findFirst({
    where: and(eq(badges.userId, userId), eq(badges.badgeId, badgeId)),
  });
  return !!existing;
}

async function unlockBadge(userId: string, badgeId: string, area: string) {
  if (await hasBadge(userId, badgeId)) return;
  await db.insert(badges).values({
    id: randomUUID(),
    userId,
    badgeId,
    area,
    mineral: 'escalon',
    unlockedAt: new Date().toISOString(),
  });
}

export function getEscalonByDays(days: number) {
  return ESCALONES.find(e => e.days === days);
}

export function getCurrentEscalon(streak: number) {
  let last = ESCALONES[0];
  for (const e of ESCALONES) {
    if (streak >= e.days) last = e;
    else break;
  }
  return last;
}

export function getNextEscalon(streak: number) {
  return ESCALONES.find(e => e.days > streak) || null;
}

export async function autoActivateChallenges(userId: string, entry: any) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;

  const streak = user.streakCurrent || 0;

  // 1. Escalones generales (basados en racha de journaling)
  for (const e of ESCALONES) {
    if (streak >= e.days) {
      await unlockBadge(userId, e.id, 'diario');
    }
  }

  // 2. Escalones por área específica
  for (const area of AREAS) {
    if (area.check(entry)) {
      // Contar cuántas veces seguidas ha cumplido esta área
      const existingAreaBadges = await db.query.badges.findMany({
        where: and(eq(badges.userId, userId), eq(badges.area, area.key)),
      });

      for (const dias of AREA_ESCALONES) {
        const badgeId = `${area.key}-${dias}`;
        if (!existingAreaBadges.find(b => b.badgeId === badgeId)) {
          // Check if they have enough days — we estimate from previous tier
          const prevTier = AREA_ESCALONES.filter(d => d < dias).pop() || 0;
          const prevBadgeId = prevTier ? `${area.key}-${prevTier}` : null;
          const hasPrev = prevBadgeId ? existingAreaBadges.find(b => b.badgeId === prevBadgeId) : true;

          if (!prevTier || hasPrev) {
            const minDaysForThis = dias - prevTier;
            // If streak is long enough and they did it today, unlock
            if (streak >= minDaysForThis) {
              await unlockBadge(userId, badgeId, area.key);
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create `src/components/challenges/ChallengeNotify.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { X, Award } from 'lucide-react';

interface ChallengeNotifyProps {
  badgeUnlocked: string | null;
  badgeName?: string;
}

export function ChallengeNotify({ badgeUnlocked, badgeName }: ChallengeNotifyProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badgeUnlocked) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [badgeUnlocked]);

  if (!visible || !badgeUnlocked) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white px-5 py-4 rounded-xl shadow-2xl border border-yellow-400/30 max-w-xs">
        <div className="flex items-start gap-3">
          <Award className="w-8 h-8 text-yellow-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">🎉 Nuevo logro desbloqueado</p>
            <p className="text-yellow-200 text-xs mt-1">{badgeName || badgeUnlocked}</p>
          </div>
          <button onClick={() => setVisible(false)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Modify `challenges.ts` — remove `maybeLevelUp` from `unlockBadge`, add `autoActivateChallenges` import**

Replace the `unlockBadge` function and remove `maybeLevelUp` from challenges.ts:

```typescript
// Replace the existing unlockBadge (lines 154-171) with:
async function unlockBadge(userId: string, template: ChallengeTemplate) {
  const existing = await db.query.badges.findFirst({
    where: and(eq(badges.userId, userId), eq(badges.badgeId, template.id)),
  });
  if (existing) return;

  await db.insert(badges).values({
    id: randomUUID(),
    userId,
    badgeId: template.id,
    area: template.area,
    mineral: template.mineral,
    unlockedAt: new Date().toISOString(),
  });

  await checkHiddenChallenges(userId);
}
```

Also remove the `maybeLevelUp` function entirely (lines 221-243) and its import of `users`.

Remove the `users` import from the imports line (`import { challenges, badges, users } from '../../db/schema'`) — change to `import { challenges, badges } from '../../db/schema'`.

- [ ] **Step 4: Modify `daily-journal.ts` — replace level calculation with `autoActivateChallenges`**

Remove lines 33-38 (`checkLevelProgression` function).

Replace lines 162-181:
```typescript
    const activeDaysCount = entriesLast30Days.length;
    const targetLevel = checkLevelProgression(user.currentLevel, activeDaysCount);

    if (targetLevel !== user.currentLevel) {
      await db
        .update(users)
        .set({ currentLevel: targetLevel })
        .where(eq(users.id, user.id));
    }
```

With:
```typescript
    // Levels deprecated — progression is now tracked via badges
```

Next, replace the return block (lines 337-349) with:
```typescript
    let badgeUnlocked: string | null = null;
    if (!isUpdate) {
      await autoActivateChallenges(user.id, entryData);
      const cr = await validateActiveChallenges(entryData, user);
      badgeUnlocked = cr.badgeUnlocked ?? null;
    }

    return {
      success: true,
      isUpdate,
      levelUpgraded: false,
      newLevel: user.currentLevel,
      badgeUnlocked,
    };
```

Add import:
```typescript
import { autoActivateChallenges } from '@/lib/challenge-auto-activate';
```

- [ ] **Step 5: Add `recommendedTier` column to `bibleVerses` in schema**

```typescript
export const bibleVerses = sqliteTable('bible_verses', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull(),
  text: text('text').notNull(),
  interpretation: text('interpretation'),
  recommendedLevel: integer('recommended_level').default(1).notNull(),
  recommendedTier: text('recommended_tier'), // 'primer-paso' | 'ritmo' | 'habito' | 'proposito' | 'maestria' | 'constancia' | 'identidad' | 'legado'
  topic: text('topic'),
});
```

- [ ] **Step 6: Update `ChallengesClient.tsx` — add progress widget data**

The user currently has to manually "Activar" each challenge. We'll change the UI to show auto-progression.

Find the section where `isLocked` and `isActive` are computed and add:

```typescript
// After computing activeMap, completedIds
// Add escalon progress info
const user = await getCurrentUserId(); // already available from server component
const streak = user.streakCurrent; // need to pass this as prop
```

Then change the button logic:
- If the challenge is an escalon type (badgeId starts with `escalon-`), show "🔒 Automático" instead of "Activar"
- For regular challenges, keep "Activar" button

Pass `streakCurrent` as a prop from the server component `page.tsx` to `ChallengesClient`.

- [ ] **Step 7: Add dashboard widget for escalon progress**

In `src/app/page.tsx`, add a section after existing content (but before the KairoChat FAB):

```typescript
// Import at top
import { getCurrentEscalon, getNextEscalon } from '@/lib/challenge-auto-activate';
import { db } from '@/db/db';
import { badges } from '@/db/schema';
import { eq } from 'drizzle-orm';

// In the server component, after fetching other data:
const userId = await getCurrentUserId();
const userBadges = await db.query.badges.findMany({
  where: eq(badges.userId, userId),
});
const userProfile = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
const streak = userProfile?.streakCurrent || 0;
const currentEscalon = getCurrentEscalon(streak);
const nextEscalon = getNextEscalon(streak);
```

Render:
```tsx
{/* 🔥 Progreso */}
<div className="bg-gradient-to-br from-amber-900/60 to-yellow-900/40 rounded-2xl p-5 border border-amber-700/30">
  <h3 className="text-amber-300 font-semibold text-sm flex items-center gap-2">
    <Award className="w-4 h-4" />
    Tu Progreso
  </h3>
  <p className="text-white text-lg font-bold mt-2">
    {currentEscalon.name}
  </p>
  {nextEscalon ? (
    <p className="text-amber-400/80 text-xs mt-1">
      🎯 Te faltan {nextEscalon.days - streak} días para "{nextEscalon.name}"
    </p>
  ) : (
    <p className="text-yellow-400 text-xs mt-1">
      ✨ ¡Completaste todos los escalones!
    </p>
  )}
  <div className="mt-3 w-full bg-amber-950/50 rounded-full h-2">
    <div
      className="bg-amber-400 h-2 rounded-full transition-all"
      style={{ width: `${Math.min(100, (streak / 365) * 100)}%` }}
    />
  </div>
</div>
```

- [ ] **Step 8: Apply schema migration**

```bash
npx drizzle-kit push
```

- [ ] **Step 9: Verify build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 10: Commit**

```bash
git add src/lib/challenge-auto-activate.ts src/components/challenges/ChallengeNotify.tsx src/app/actions/challenges.ts src/app/actions/daily-journal.ts src/db/schema.ts src/app/challenges/ src/app/page.tsx
git commit -m "feat: replace level system with auto-activating escalon badges (Primer Paso → Legado)"
```

---

### Task Group 3: Circles of Trust (4.3)

**Files:**
- Modify: `src/db/schema.ts` (add circles + circle_members tables + relations)
- Create: `src/app/actions/circles.ts`
- Create: `src/components/circles/CircleWidget.tsx`
- Create: `src/app/api/circles/invite/route.ts`
- Modify: `src/app/page.tsx` (dashboard — add CircleWidget)

**Interfaces:**
- Produces: `createCircle(name)`, `generateInvite(circleId)` → `{ inviteCode, url }`, `joinCircle(inviteCode)` → `{ success }`, `getCircleWidgetData()` → members with streak status, `sendEncouragement(memberId)` → `{ success }`

- [ ] **Step 1: Add `circles` and `circle_members` tables to schema**

```typescript
export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Mi Círculo'),
  createdBy: text('created_by').notNull().references(() => users.id),
  visibilitySettings: text('visibility_settings').notNull().default('only_streak'),
  createdAt: text('created_at').notNull(),
});

export const circlesRelations = relations(circles, ({ one, many }) => ({
  creator: one(users, {
    fields: [circles.createdBy],
    references: [users.id],
  }),
  members: many(circleMembers),
}));

export const circleMembers = sqliteTable('circle_members', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id),
  userId: text('user_id').notNull().references(() => users.id),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'),
  joinedAt: text('joined_at'),
  inviteCode: text('invite_code').unique().notNull(),
});

export const circleMembersRelations = relations(circleMembers, ({ one }) => ({
  circle: one(circles, {
    fields: [circleMembers.circleId],
    references: [circles.id],
  }),
  user: one(users, {
    fields: [circleMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [circleMembers.invitedBy],
    references: [users.id],
  }),
}));
```

- [ ] **Step 2: Apply schema migration**

```bash
npx drizzle-kit push
```

- [ ] **Step 3: Create `src/app/actions/circles.ts`**

```typescript
'use server';

import { db } from '../../db/db';
import { circles, circleMembers, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';

const MAX_CIRCLE_SIZE = 3;

export async function createCircle(name: string = 'Mi Círculo') {
  const userId = await getCurrentUserId();

  const existing = await db.query.circles.findFirst({
    where: eq(circles.createdBy, userId),
  });
  if (existing) return { success: false, error: 'Ya tienes un círculo.' };

  const id = randomUUID();
  await db.insert(circles).values({
    id,
    name,
    createdBy: userId,
    visibilitySettings: 'only_streak',
    createdAt: new Date().toISOString(),
  });

  revalidatePath('/');
  return { success: true, circleId: id };
}

export async function generateInvite(circleId: string) {
  const userId = await getCurrentUserId();

  const circle = await db.query.circles.findFirst({
    where: and(eq(circles.id, circleId), eq(circles.createdBy, userId)),
  });
  if (!circle) return { success: false, error: 'Acceso denegado.' };

  const memberCount = await db.query.circleMembers.findMany({
    where: and(
      eq(circleMembers.circleId, circleId),
      eq(circleMembers.status, 'active'),
    ),
  });

  if (memberCount.length >= MAX_CIRCLE_SIZE - 1) {
    return { success: false, error: 'Círculo completo (máx 3 personas).' };
  }

  const inviteCode = randomUUID().slice(0, 8);
  await db.insert(circleMembers).values({
    id: randomUUID(),
    circleId,
    userId: '', // will be filled on join
    invitedBy: userId,
    status: 'pending',
    inviteCode,
  });

  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/circles/join?code=${inviteCode}`;

  return { success: true, inviteCode, url };
}

export async function joinCircle(inviteCode: string) {
  const userId = await getCurrentUserId();

  const member = await db.query.circleMembers.findFirst({
    where: eq(circleMembers.inviteCode, inviteCode),
    with: { circle: true },
  });
  if (!member) return { success: false, error: 'Invitación inválida.' };
  if (member.status === 'active') return { success: false, error: 'Código ya usado.' };
  if (member.userId && member.userId !== userId) return { success: false, error: 'Código ya asignado.' };

  const activeMembers = await db.query.circleMembers.findMany({
    where: and(
      eq(circleMembers.circleId, member.circleId),
      eq(circleMembers.status, 'active'),
    ),
  });

  if (activeMembers.length >= MAX_CIRCLE_SIZE - 1) {
    return { success: false, error: 'Círculo completo.' };
  }

  await db.update(circleMembers)
    .set({ userId, status: 'active', joinedAt: new Date().toISOString() })
    .where(eq(circleMembers.id, member.id));

  revalidatePath('/');
  return { success: true };
}

export async function leaveCircle(circleId: string) {
  const userId = await getCurrentUserId();
  await db.delete(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
  revalidatePath('/');
  return { success: true };
}

export async function getCircleWidgetData() {
  const userId = await getCurrentUserId();

  const myCircle = await db.query.circles.findFirst({
    where: eq(circles.createdBy, userId),
  });
  if (!myCircle) return { success: true, circle: null, members: [] };

  const members = await db.query.circleMembers.findMany({
    where: and(
      eq(circleMembers.circleId, myCircle.id),
      eq(circleMembers.status, 'active'),
    ),
    with: {
      user: {
        columns: { id: true, name: true, streakCurrent: true, streakMax: true, lastEntryDate: true },
      },
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const enriched = members.map(m => ({
    userId: m.user.id,
    name: m.user.name,
    streak: m.user.streakCurrent,
    maxStreak: m.user.streakMax,
    failedToday: m.user.lastEntryDate !== today && m.user.lastEntryDate !== yesterday,
    lastEntryDate: m.user.lastEntryDate,
  }));

  return { success: true, circle: myCircle, members: enriched };
}

export async function sendEncouragement(targetUserId: string) {
  const userId = await getCurrentUserId();
  if (userId === targetUserId) return { success: false, error: 'No puedes animarte a ti mismo.' };

  // 1 tap per 24h enforced client-side via localStorage
  // Server: just log it
  console.log(`[CIRCLE] ${userId} sent encouragement to ${targetUserId}`);
  return { success: true };
}
```

- [ ] **Step 4: Create `src/components/circles/CircleWidget.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Users, Flame, Hand, X, CheckCircle, AlertCircle, Plus, Link } from 'lucide-react';
import { createCircle, generateInvite, getCircleWidgetData, sendEncouragement } from '@/app/actions/circles';

interface MemberData {
  userId: string;
  name: string;
  streak: number;
  maxStreak: number;
  failedToday: boolean;
  lastEntryDate: string | null;
}

export function CircleWidget() {
  const [circle, setCircle] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [encouraged, setEncouraged] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
    // Check localStorage for encouraged users today
    const stored = localStorage.getItem('circle-encouraged');
    if (stored) setEncouraged(new Set(JSON.parse(stored)));
  }, []);

  async function loadData() {
    const res = await getCircleWidgetData();
    if (res.success) {
      setCircle(res.circle);
      setMembers(res.members || []);
    }
    setLoading(false);
  }

  async function handleCreate() {
    const res = await createCircle();
    if (res.success) loadData();
  }

  async function handleInvite() {
    if (!circle) return;
    const res = await generateInvite(circle.id);
    if (res.success && res.url) {
      await navigator.clipboard.writeText(res.url);
      alert('Link de invitación copiado al portapapeles.');
    }
  }

  async function handleEncourage(targetUserId: string) {
    if (encouraged.has(targetUserId)) return;
    await sendEncouragement(targetUserId);
    const next = new Set(encouraged);
    next.add(targetUserId);
    setEncouraged(next);
    localStorage.setItem('circle-encouraged', JSON.stringify([...next]));
  }

  if (loading) return <div className="animate-pulse h-24 bg-gray-800 rounded-2xl" />;

  if (!circle) {
    return (
      <button
        onClick={handleCreate}
        className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl p-4 border border-gray-700/50 w-full text-left transition-colors"
      >
        <Users className="w-5 h-5 text-blue-400" />
        <span className="text-sm text-gray-300">Crear mi Círculo de Confianza</span>
        <Plus className="w-4 h-4 text-gray-500 ml-auto" />
      </button>
    );
  }

  return (
    <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          {circle.name}
        </h3>
        <button onClick={handleInvite} className="text-gray-400 hover:text-white transition-colors" title="Invitar">
          <Link className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${m.failedToday ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-gray-300 flex-1 truncate">{m.name}</span>
            <span className="text-gray-500 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {m.streak}
            </span>
            {m.failedToday && (
              <button
                onClick={() => handleEncourage(m.userId)}
                disabled={encouraged.has(m.userId)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                  encouraged.has(m.userId)
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {encouraged.has(m.userId) ? '👏 Enviado' : '👏 Ánimo'}
              </button>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-gray-500 text-xs text-center py-2">
          Invita a 2 personas para empezar
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/api/circles/invite/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { joinCircle } from '@/app/actions/circles';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/challenges', req.url));

  const res = await joinCircle(code);
  if (res.success) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(res.error || 'Error')}`, req.url));
}
```

- [ ] **Step 6: Add `CircleWidget` to dashboard**

In `src/app/page.tsx`, add the import and render the component near the bottom (before the KairoChat wrapper):

```typescript
import { CircleWidget } from '@/components/circles/CircleWidget';

// In the JSX, after the habits/business panel sections and before the KairoChat wrapper:
<section className="md:col-span-1">
  <CircleWidget />
</section>
```

- [ ] **Step 7: Verify build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add src/db/schema.ts src/app/actions/circles.ts src/components/circles/ src/app/api/circles/ src/app/page.tsx
git commit -m "feat: add Circles of Trust (consistency wall + accountability anchor)"
```

---

### Task Group 4: Voice Mode (4.1)

**Files:**
- Create: `src/components/journal/VoiceMode.tsx`
- Create: `src/components/journal/VoiceRecorder.tsx`
- Create: `src/components/journal/VoiceGuide.tsx`
- Create: `src/components/journal/VoiceReview.tsx`
- Modify: `src/components/journal/JournalForm.tsx` or `src/app/journal/page.tsx` (add mode selector)

**Interfaces:**
- Consumes: browser `webkitSpeechRecognition` API, existing `/api/smart-entry` endpoint
- Produces: 5-section voice recording flow → single smart-entry call → journal data population

- [ ] **Step 1: Create `src/components/journal/VoiceGuide.tsx`**

```typescript
'use client';

interface VoiceGuideProps {
  section: number;
}

const SECTIONS = [
  {
    title: 'Energía',
    icon: '⚡',
    prompts: [
      'Mi energía hoy fue [1-10]',
      'Dormí [ ] horas',
      'Mi estrés es [1-10]',
      'Acción rápida que tomé:',
    ],
    duration: '~30 seg',
  },
  {
    title: 'Gratitud + Identidad',
    icon: '🙏',
    prompts: [
      'Agradezco por: [1]',
      'Agradezco por: [2]',
      'Agradezco por: [3]',
      'Hoy elijo ser: [identidad]',
    ],
    duration: '~45 seg',
  },
  {
    title: 'MIT + Negocio',
    icon: '🎯',
    prompts: [
      'Mi tarea más importante era: [ ]',
      'La completé: [sí / no]',
      'En el negocio: [ventas / prospectos]',
    ],
    duration: '~60 seg',
  },
  {
    title: 'Devocional',
    icon: '📖',
    prompts: [
      'Mi reflexión espiritual hoy: [ ]',
    ],
    duration: '~60 seg',
    required: true,
  },
  {
    title: 'Cierre',
    icon: '✨',
    prompts: [
      'Lo que funcionó: [ ]',
      'Lo que no funcionó: [ ]',
      'Mañana quiero mejorar en: [ ]',
    ],
    duration: '~30 seg',
  },
];

export function VoiceGuide({ section }: VoiceGuideProps) {
  const s = SECTIONS[section];
  if (!s) return null;

  return (
    <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{s.icon}</span>
          <h3 className="text-white font-semibold text-sm">{s.title}</h3>
          {s.required && (
            <span className="text-xs bg-amber-600/30 text-amber-400 px-2 py-0.5 rounded-full">Obligatorio</span>
          )}
        </div>
        <span className="text-xs text-gray-500">{s.duration}</span>
      </div>

      <div className="space-y-1.5">
        {s.prompts.map((p, i) => (
          <p key={i} className="text-gray-400 text-xs leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

export const VOICE_SECTION_COUNT = SECTIONS.length;
export { SECTIONS };
```

- [ ] **Step 2: Create `src/components/journal/VoiceRecorder.tsx`**

```typescript
'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, RotateCcw, SkipForward } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, onSkip, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        final += event.results[i][0].transcript;
      }
      setTranscript(final);
    };

    recognition.onend = () => {
      setRecording(false);
      if (transcript.trim()) onTranscript(transcript.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [onTranscript, transcript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  }, []);

  const retry = useCallback(() => {
    setTranscript('');
    startRecording();
  }, [startRecording]);

  if (disabled) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-xs">Tu navegador no soporta dictado por voz.</p>
        <p className="text-gray-600 text-xs mt-1">Usa los modos Normal o Día Difícil.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
        recording ? 'bg-red-600/30 animate-pulse ring-4 ring-red-500/50' : 'bg-gray-700/50'
      }`}>
        {recording ? (
          <Square onClick={stopRecording} className="w-6 h-6 text-red-400 cursor-pointer" />
        ) : (
          <Mic onClick={startRecording} className="w-6 h-6 text-gray-300 cursor-pointer hover:text-white" />
        )}
      </div>

      <div className="flex gap-2">
        {!recording && transcript && (
          <button onClick={retry} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            <RotateCcw className="w-3 h-3" /> Regrabar
          </button>
        )}
        {!recording && !transcript && (
          <button onClick={onSkip} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
            <SkipForward className="w-3 h-3" /> Saltar
          </button>
        )}
      </div>

      {transcript && (
        <p className="text-gray-300 text-xs text-center max-w-xs bg-gray-800/60 rounded-lg p-2">
          {transcript}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/journal/VoiceReview.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Check, Pen } from 'lucide-react';

interface VoiceReviewProps {
  fullTranscript: string;
  onConfirm: (editedText: string) => void;
  onReRecord: (sectionIndex: number) => void;
}

export function VoiceReview({ fullTranscript, onConfirm, onReRecord }: VoiceReviewProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(fullTranscript);

  const handleConfirm = () => {
    onConfirm(text);
  };

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
          <p className="text-gray-300 text-xs whitespace-pre-wrap">{text}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg"
          >
            <Pen className="w-3 h-3" /> Editar texto
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg"
          >
            <Check className="w-3 h-3" /> Confirmar y enviar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-40 bg-gray-900 text-gray-200 text-xs p-3 rounded-xl border border-gray-700 focus:border-blue-500 resize-none"
      />
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => { setEditing(false); setText(fullTranscript); }}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg"
        >
          Confirmar corrección
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/journal/VoiceMode.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Mic, ArrowLeft, ArrowRight } from 'lucide-react';
import { VoiceGuide, SECTIONS, VOICE_SECTION_COUNT } from './VoiceGuide';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceReview } from './VoiceReview';

interface VoiceModeProps {
  onComplete: (entryData: any) => void;
  onCancel: () => void;
}

export function VoiceMode({ onComplete, onCancel }: VoiceModeProps) {
  const [step, setStep] = useState<'record' | 'review'>('record');
  const [currentSection, setCurrentSection] = useState(0);
  const [transcripts, setTranscripts] = useState<string[]>(Array(VOICE_SECTION_COUNT).fill(''));
  const [devotionalSkipped, setDevotionalSkipped] = useState(false);

  const hasSpeechRecognition = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  const handleTranscript = useCallback((text: string) => {
    const next = [...transcripts];
    next[currentSection] = text;
    setTranscripts(next);

    if (currentSection < VOICE_SECTION_COUNT - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setStep('review');
    }
  }, [currentSection, transcripts]);

  const handleSkip = useCallback(() => {
    if (currentSection === 3) {
      // Devocional section — track that they skipped
      setDevocionalSkipped(true);
    }
    if (currentSection < VOICE_SECTION_COUNT - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setStep('review');
    }
  }, [currentSection]);

  const handleReRecord = useCallback((sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setStep('record');
  }, []);

  const handleConfirmReview = useCallback(async (editedText: string) => {
    try {
      const res = await fetch('/api/smart-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: editedText }),
      });
      const data = await res.json();
      if (data.success) {
        onComplete(data.data);
      }
    } catch (err) {
      console.error('[VOICE] Error processing entry:', err);
    }
  }, [onComplete]);

  // If devocional was skipped, force them back
  if (devocionalSkipped && step === 'review') {
    return (
      <div className="text-center py-6">
        <p className="text-amber-400 text-sm font-medium">La sección Devocional es obligatoria.</p>
        <p className="text-gray-400 text-xs mt-1">Grábala antes de continuar.</p>
        <button
          onClick={() => { setDevocionalSkipped(false); setCurrentSection(3); setStep('record'); }}
          className="mt-3 bg-amber-700 hover:bg-amber-600 text-white text-xs px-4 py-2 rounded-lg"
        >
          Grabar Devocional
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {SECTIONS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentSection ? 'bg-blue-500' : transcripts[i] ? 'bg-green-600' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {step === 'record' && (
        <>
          <VoiceGuide section={currentSection} />
          <VoiceRecorder
            onTranscript={handleTranscript}
            onSkip={handleSkip}
            disabled={!hasSpeechRecognition}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Sección {currentSection + 1} de {VOICE_SECTION_COUNT}</span>
            <span className={!transcripts[currentSection] ? 'text-red-500' : 'text-green-500'}>
              {transcripts[currentSection] ? '✓ Grabado' = '' : 'Pendiente'}
            </span>
          </div>
        </>
      )}

      {step === 'review' && (
        <VoiceReview
          fullTranscript={transcripts.filter(Boolean).join('.\n\n')}
          onConfirm={handleConfirmReview}
          onReRecord={handleReRecord}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Add mode selector to the journal page**

In `src/app/journal/page.tsx` or the main `JournalForm.tsx`, add a mode selector at the top. The existing flow has:
- Normal mode (existing multi-step form)
- Día Difícil mode (existing)
- Voz mode (new)

Add a mode picker that renders `VoiceMode` when selected.

- [ ] **Step 6: Verify build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add src/components/journal/VoiceMode.tsx src/components/journal/VoiceRecorder.tsx src/components/journal/VoiceGuide.tsx src/components/journal/VoiceReview.tsx src/app/journal/page.tsx
git commit -m "feat: add Voice Mode as third journaling mode with 5-section guided dictation"
```

---

## Execution Order

| Order | Task Group | Depends On | Est. Time |
|-------|-----------|------------|-----------|
| 1 | Task Group 1 (Turso) | None | 30 min |
| 2 | Task Group 2 (Challenges) | None | 1.5 hr |
| 3 | Task Group 3 (Circles) | None | 1.5 hr |
| 4 | Task Group 4 (Voice) | None | 2 hr |

All task groups are independent — they can be worked on in parallel or sequentially.
