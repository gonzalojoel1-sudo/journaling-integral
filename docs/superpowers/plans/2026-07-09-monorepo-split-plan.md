# Monorepo Front/Back Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar el frontend Next.js y el backend en procesos independientes via monorepo npm workspaces con 3 packages: shared (tipos/schema), api (Hono REST), web (Next.js).

**Architecture:** npm workspaces con `@journaling/shared`, `@journaling/api` (Hono en :3001), `@journaling/web` (Next.js en :3000). El front llama al back via fetch() con JWT de NextAuth. Tipos y schema Drizzle compartidos en el package shared.

**Tech Stack:** npm workspaces, Hono, Next.js 15, Drizzle ORM, @libsql/client, next-auth, Zod, tsx

## Global Constraints

- Cero imports rotos en consumidores existentes
- Build de Next.js debe pasar sin errores
- `tsc --noEmit` debe pasar en los 3 packages
- El seed de versiculos (120) debe preservarse integro
- Las rutas de API usan prefijo `/api` para compatibilidad
- JWT de NextAuth validado en middleware de Hono con misma secret
- CORS configurado para localhost:3000 en dev

## File Structure Map

```
journaling-integral/
├── package.json                        ← [MOD] workspaces root
├── .env                                ← [MOD] agregar NEXTAUTH_SECRET
├── drizzle.config.ts                   ← [MOD] schema path → shared
├── tsconfig.json                       ← [MOD] remover paths que se van
│
├── packages/
│   ├── shared/
│   │   ├── package.json                ← [NEW]
│   │   ├── tsconfig.json              ← [NEW]
│   │   └── src/
│   │       ├── index.ts                ← [NEW] barrel
│   │       ├── types.ts                ← [NEW]
│   │       ├── constants.ts            ← [NEW] movido de src/lib/
│   │       ├── validation.ts           ← [NEW] Zod schemas
│   │       ├── utils.ts                ← [NEW] calculateStreak, etc.
│   │       └── db/
│   │           ├── schema.ts           ← [NEW] movido de src/db/
│   │           └── seed-data/
│   │               └── bible-verses.ts ← [NEW] movido de src/db/seed/data/
│   │
│   ├── api/
│   │   ├── package.json                ← [NEW]
│   │   ├── tsconfig.json              ← [NEW]
│   │   └── src/
│   │       ├── index.ts                ← [NEW] entrypoint
│   │       ├── app.ts                  ← [NEW] Hono app
│   │       ├── db.ts                   ← [NEW] movido de src/db/db.ts
│   │       ├── seed.ts                 ← [NEW] movido de src/db/seed.ts
│   │       ├── middleware/
│   │       │   └── auth.ts             ← [NEW]
│   │       └── routes/
│   │           ├── auth.ts             ← [NEW]
│   │           ├── journal.ts          ← [NEW]
│   │           ├── habits.ts           ← [NEW]
│   │           ├── planning.ts         ← [NEW]
│   │           └── bible.ts            ← [NEW]
│   │
│   └── web/
│       ├── package.json                ← [NEW] hereda de root
│       ├── next.config.js              ← [NEW] hereda
│       ├── tsconfig.json              ← [NEW]
│       ├── tailwind.config.ts          ← [NEW] hereda
│       ├── postcss.config.js           ← [NEW] hereda
│       ├── .env.local                  ← [NEW]
│       └── src/
│           ├── app/
│           │   ├── layout.tsx          ← [MOV] desde src/app/
│           │   ├── page.tsx            ← [MOD] server fetch
│           │   ├── providers.tsx       ← [MOV]
│           │   ├── login/page.tsx      ← [MOV]
│           │   ├── journal/
│           │   │   ├── page.tsx        ← [MOD] server fetch
│           │   │   └── JournalForm.tsx  ← [MOD] api.post
│           │   ├── habits/
│           │   │   ├── page.tsx        ← [MOD]
│           │   │   └── HabitsClient.tsx← [MOD] api.post
│           │   ├── review/
│           │   │   ├── page.tsx        ← [MOD]
│           │   │   └── ReviewClient.tsx← [MOD] api.post
│           │   ├── quarterly/
│           │   │   ├── page.tsx        ← [MOD]
│           │   │   └── QuarterlyPlanForm.tsx ← [MOD] api.post
│           │   ├── history/page.tsx    ← [MOD]
│           │   ├── progress/page.tsx   ← [MOD]
│           │   ├── admin/users/
│           │   │   ├── page.tsx        ← [MOD]
│           │   │   └── AdminUsersClient.tsx ← [MOV]
│           │   └── api/auth/[...nextauth]/
│           │       ├── options.ts      ← [MOV]
│           │       └── route.ts        ← [MOV]
│           ├── components/
│           │   ├── Navigation.tsx      ← [MOV]
│           │   ├── Navigation/         ← [MOV] completo
│           │   └── ThemeToggle.tsx     ← [MOV]
│           ├── lib/
│           │   └── api-client.ts       ← [NEW]
│           └── globals.css             ← [MOV]

├── src/                                ← [DEL] se vacia
│   ├── app/actions/                    ← [DEL]
│   ├── app/api/register/              ← [DEL]
│   ├── db/                            ← [DEL]
│   └── lib/                           ← [DEL]
```

---

### Task 8: Web package — API client

**Files:**
- Create: `packages/web/src/lib/api-client.ts`
- Modify: `packages/web/src/app/api/auth/[...nextauth]/options.ts` (add httpOnly: false for client token access)

- [ ] **Step 1: Update NextAuth options to expose token to client JS**

Edit `packages/web/src/app/api/auth/[...nextauth]/options.ts`, add cookies config:

```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: false,
    },
  },
},
```

- [ ] **Step 2: Create api-client.ts**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    /(?:^|;\s*)next-auth\.session-token=([^;]*)/
  );
  return match ? match[1] : null;
}

export const api = {
  get: async <T = unknown>(path: string): Promise<{ success: boolean; data?: T; error?: string }> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getTokenFromCookie();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { headers });
    return res.json();
  },

  post: async <T = unknown>(path: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getTokenFromCookie();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return res.json();
  },

  patch: async <T = unknown>(path: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getTokenFromCookie();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    return res.json();
  },

  del: async <T = unknown>(path: string): Promise<{ success: boolean; data?: T; error?: string }> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getTokenFromCookie();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers });
    return res.json();
  },

  rawGet: async (path: string): Promise<unknown> => {
    const headers: Record<string, string> = {};
    const token = getTokenFromCookie();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { headers });
    return res.json();
  },
};

export async function serverFetch<T = unknown>(path: string): Promise<{ success: boolean; data?: T; error?: string }> {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  const token = cookieStore.get('next-auth.session-token')?.value
    || cookieStore.get('__Secure-next-auth.session-token')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers });
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/lib/api-client.ts packages/web/src/app/api/auth/
git commit -m "feat: api-client with client/server token support"
```

### Task 9: Web package — Update server components (page.tsx files)

**Files:**
- Modify: `packages/web/src/app/page.tsx`
- Modify: `packages/web/src/app/journal/page.tsx`
- Modify: `packages/web/src/app/habits/page.tsx`
- Modify: `packages/web/src/app/history/page.tsx`
- Modify: `packages/web/src/app/review/page.tsx`
- Modify: `packages/web/src/app/quarterly/page.tsx`
- Modify: `packages/web/src/app/progress/page.tsx`
- Modify: `packages/web/src/app/admin/users/page.tsx`

- [ ] **Step 1: Replace imports in each server component**

For each file, replace:
```typescript
import { getOrCreateUserProfile, ... } from '../actions/journal';
import { db } from '../../db/db';
import { dailyEntries, users } from '../../db/schema';
import { eq, and, gte } from 'drizzle-orm';
```

With:
```typescript
import { serverFetch } from '@/lib/api-client';
```

Then replace action calls:
- `getOrCreateUserProfile()` → `serverFetch('/api/auth/me')`
- `getActiveHabits()` → `serverFetch('/api/habits')`
- `getRandomVerse(level)` → `serverFetch('/api/bible/random?level=' + level)`
- `getActiveWeeklyPlan()` → `serverFetch('/api/planning/weekly')`
- `getActiveQuarterlyPlan()` → `serverFetch('/api/planning/quarterly')`
- `getAnalyticsData()` → `serverFetch('/api/journal/analytics')`

Replace direct DB queries. Example for `page.tsx` lines 36-93:
```typescript
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Instead of db.query.dailyEntries, fetch from API
const todayEntryRes = await serverFetch(`/api/journal/analytics`);
const entries = todayEntryRes.data || [];
const todayStr = new Date().toISOString().split('T')[0];
const todayEntry = entries.find((e: any) => e.date === todayStr) || null;

// Instead of yesterday's entry direct query
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];
const yesterdayEntry = entries.find((e: any) => e.date === yesterdayStr) || null;
```

For `journal/page.tsx`: existingEntry check uses `serverFetch('/api/journal/analytics')` and filters today.

For `admin/users/page.tsx`: keep `getServerSession` + `redirect` (NextAuth stays), but replace DB queries. Since there's no `/api/admin/users` endpoint yet, either add it to the api routes or keep direct DB for admin only. **Simpler: admin stays with direct DB** using `@/db/db` import (need to keep drizzle as web dependency).

- [ ] **Step 2: Run build to verify**

```bash
cd packages/web && npx next build 2>&1 | tail -30
```

Expected: builds without errors (SQLITE errors during static gen OK).

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/app/page.tsx packages/web/src/app/journal/ packages/web/src/app/habits/ packages/web/src/app/history/ packages/web/src/app/review/ packages/web/src/app/quarterly/ packages/web/src/app/progress/
git commit -m "feat: server components now fetch from API backend"
```

### Task 10: Web package — Update client components

**Files:**
- Modify: `packages/web/src/app/journal/JournalForm.tsx`
- Modify: `packages/web/src/app/habits/HabitsClient.tsx`
- Modify: `packages/web/src/app/review/ReviewClient.tsx`
- Modify: `packages/web/src/app/quarterly/QuarterlyPlanForm.tsx`
- Modify: `packages/web/src/components/Navigation/AdminControls.tsx`

- [ ] **Step 1: Update JournalForm.tsx**

Replace line 5:
```typescript
import { submitDailyEntry, getVersesByTopic } from '../actions/journal';
```
With:
```typescript
import { api } from '@/lib/api-client';
```

Replace `refreshVerse` function (line 55-60):
```typescript
const refreshVerse = async () => {
  setLoadingVerse(true);
  const res = await api.rawGet(`/api/bible/topic?topic=${devotionalTopic}`);
  setGuidedVerse(res);
  setLoadingVerse(false);
};
```

Replace `submitDailyEntry(payload)` call (line 251):
```typescript
const res = await api.post<{ levelUpgraded: boolean; newLevel: number }>('/api/journal/entries', payload);
setLoading(false);

if (res.success) {
  setSuccess(true);
  setTimeout(() => { router.push('/'); router.refresh(); }, 1500);
} else {
  setError(res.error || 'No se pudo guardar la entrada.');
}
```

- [ ] **Step 2: Update HabitsClient.tsx**

Replace line 4:
```typescript
import { createHabit, archiveHabit } from '../actions/journal';
```
With:
```typescript
import { api } from '@/lib/api-client';
```

Replace `createHabit(name, type, strategyDetails)` calls:
```typescript
const res = await api.post('/api/habits', { name, type, strategyDetails });
if (res.success) { ... } else { ... }
```

Replace `archiveHabit(habitId)` calls:
```typescript
const res = await api.del(`/api/habits/${habitId}`);
```

- [ ] **Step 3: Update ReviewClient.tsx**

Replace line 5:
```typescript
import { saveWeeklyPlan } from '../actions/journal';
```
With:
```typescript
import { api } from '@/lib/api-client';
```

Replace `saveWeeklyPlan(payload)`:
```typescript
const res = await api.post('/api/planning/weekly', payload);
```

- [ ] **Step 4: Update QuarterlyPlanForm.tsx**

Replace line 5:
```typescript
import { saveQuarterlyPlan } from '../actions/journal';
```
With:
```typescript
import { api } from '@/lib/api-client';
```

Replace `saveQuarterlyPlan(payload)`:
```typescript
const res = await api.post('/api/planning/quarterly', payload);
```

- [ ] **Step 5: Update AdminControls.tsx**

Replace line 5:
```typescript
import { updateUserLevel } from '../../app/actions/journal';
```
With:
```typescript
import { api } from '@/lib/api-client';
```

Replace `updateUserLevel(level)`:
```typescript
const res = await api.patch('/api/auth/level', { level });
```

- [ ] **Step 6: Build web to verify**

```bash
cd packages/web && npx next build 2>&1 | tail -30
```

- [ ] **Step 7: Commit**

```bash
git add packages/web/src/app/journal/JournalForm.tsx packages/web/src/app/habits/HabitsClient.tsx packages/web/src/app/review/ReviewClient.tsx packages/web/src/app/quarterly/QuarterlyPlanForm.tsx packages/web/src/components/Navigation/AdminControls.tsx
git commit -m "feat: client components now call API via api-client"
```

### Task 11: Cleanup — Remove old src/ and sync root config

**Files:**
- Modify: `drizzle.config.ts` (root) — update schema path
- Modify: `tsconfig.json` (root) — clean up
- Delete: leftover files in old `src/` dirs

- [ ] **Step 1: Update drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  schema: './packages/shared/src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:local.db',
  },
});
```

- [ ] **Step 2: Clean up old files**

```bash
rm -rf src/ next.config.js tailwind.config.ts postcss.config.js tsconfig.json 2>/dev/null
# But keep tsconfig.json if it has useful config. Actually, with the web package moved,
# these root files are no longer needed. Only keep .env, package.json, drizzle.config.ts
```

Check which files remain at root:
```bash
ls -la
```

Only keep: `.env`, `package.json`, `drizzle.config.ts`, `.gitignore`, `.env.example` (if exists), `packages/`, `docs/`

- [ ] **Step 3: Rebuild from root**

```bash
npm install
npm run db:push
npm run db:seed
npm run build
```

- [ ] **Step 4: Final verification**

Start API standalone:
```bash
npm run dev:api
```
Expected: `API server running on http://localhost:3001`

Start Web standalone (new terminal):
```bash
npm run dev:web
```
Expected: Next.js on http://localhost:3000

Or both at once:
```bash
npm run dev
```
Expected: concurrently runs both

Test flows:
- Login with `joel@journalingintegral.demo` / `admin123`
- Submit journal entry
- View habits, create/archive
- Weekly/quarterly planning
- Bible verses
- Admin panel

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: cleanup old src/, update root config, finalize monorepo"
```

---
