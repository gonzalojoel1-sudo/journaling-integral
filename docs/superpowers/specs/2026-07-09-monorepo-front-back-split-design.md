# Monorepo Front/Back Split — Design Spec

**Date**: 2026-07-09
**Status**: Approved
**Goal**: Separar frontend y backend en procesos independientes para debug y deploy aislado.

## Decisions

| Decision | Choice |
|---|---|
| Monorepo tool | npm workspaces (sin herramientas extras) |
| Backend framework | Hono (ligero, tipado, corre con tsx) |
| Front-back communication | REST + fetch() con tipos compartidos |
| Auth | NextAuth en front emite JWT, back lo valida con misma secret |
| Shared types | `@journaling/shared` package (tipos, constantes, schema Drizzle, utils) |
| DB | SQLite local (`local.db`), Drizzle ORM, misma DB compartida |

## Package Structure

```
journaling-integral/
├── package.json                    ← npm workspaces root
├── .env                            ← DATABASE_URL, NEXTAUTH_SECRET
├── drizzle.config.ts               ← apunta a shared/src/db/schema.ts
├── packages/
│   ├── shared/                     ← @journaling/shared
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                ← barrel re-export
│   │       ├── types.ts                ← ApiResponse<T>, payloads, DTOs
│   │       ├── constants.ts            ← DEMO_USER_ID, FALLBACK_VERSES
│   │       ├── validation.ts           ← Zod schemas compartidos
│   │       ├── utils.ts                ← calculateStreak, checkLevelProgression, getISOWeekLabel
│   │       └── db/
│   │           ├── schema.ts           ← Drizzle schema (movido de src/db/)
│   │           └── seed-data/
│   │               └── bible-verses.ts ← 120 versiculos (sin IDs)
│   │
│   ├── api/                        ← @journaling/api (Hono, puerto 3001)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                ← entrypoint: serve() en puerto 3001
│   │       ├── app.ts                  ← nueva Hono() + CORS + auth middleware
│   │       ├── db.ts                   ← drizzle(client, { schema })
│   │       ├── middleware/
│   │       │   └── auth.ts             ← valida JWT, inyecta userId en ctx
│   │       ├── routes/
│   │       │   ├── auth.ts             ← GET /me, POST /register, PATCH /level
│   │       │   ├── journal.ts          ← POST /entries, GET /analytics
│   │       │   ├── habits.ts           ← GET /, POST /, DELETE /:id
│   │       │   ├── planning.ts         ← GET/POST /weekly, GET/POST /quarterly
│   │       │   └── bible.ts            ← GET /random, GET /topic
│   │       └── seed.ts                 ← seed script (importa shared/db/schema + seed-data)
│   │
│   └── web/                        ← @journaling/web (Next.js 15, puerto 3000)
│       ├── package.json
│       ├── next.config.js
│       ├── tsconfig.json
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   ├── providers.tsx
│           │   ├── login/
│           │   ├── journal/
│           │   │   ├── page.tsx          ← server component: fetch al back
│           │   │   └── JournalForm.tsx   ← client: api.post()
│           │   ├── habits/
│           │   ├── history/
│           │   ├── review/
│           │   ├── quarterly/
│           │   ├── progress/
│           │   ├── admin/users/
│           │   └── api/auth/[...nextauth]/   ← solo NextAuth (se mantiene)
│           ├── components/
│           │   ├── Navigation/
│           │   └── ThemeToggle.tsx
│           └── lib/
│               └── api-client.ts         ← fetch wrapper (baseURL, JWT header)
```

## REST API Endpoints (packages/api)

| Method | Path | Auth | Description | Old server action |
|---|---|---|---|---|
| GET | `/api/auth/me` | JWT | Obtener/crear perfil | `getOrCreateUserProfile` |
| PATCH | `/api/auth/level` | JWT | Cambiar nivel usuario | `updateUserLevel` |
| POST | `/api/auth/register` | — | Registrar nuevo usuario | `api/register/route.ts` |
| GET | `/api/bible/random?level=1` | JWT | Versiculo aleatorio | `getRandomVerse` |
| GET | `/api/bible/topic?topic=Finanzas` | JWT | Versiculo por topico | `getVersesByTopic` |
| POST | `/api/journal/entries` | JWT | Guardar entrada diaria | `submitDailyEntry` |
| GET | `/api/journal/analytics` | JWT | Ultimas 30 entradas | `getAnalyticsData` |
| GET | `/api/planning/weekly` | JWT | Plan semanal activo | `getActiveWeeklyPlan` |
| POST | `/api/planning/weekly` | JWT | Guardar plan semanal | `saveWeeklyPlan` |
| GET | `/api/planning/quarterly` | JWT | Plan trimestral activo | `getActiveQuarterlyPlan` |
| POST | `/api/planning/quarterly` | JWT | Guardar plan trimestral | `saveQuarterlyPlan` |
| GET | `/api/habits` | JWT | Habitos activos | `getActiveHabits` |
| POST | `/api/habits` | JWT | Crear habito | `createHabit` |
| DELETE | `/api/habits/:id` | JWT | Archivar habito | `archiveHabit` |

## Auth Flow

1. Usuario hace login en Next.js (`signIn('credentials')`)
2. NextAuth emite JWT con `{ id, name, email }`
3. Frontend obtiene el token via `getSession()` / `useSession()`
4. `api-client.ts` adjunta `Authorization: Bearer <token>` en cada request al back
5. Middleware `auth.ts` en Hono valida el JWT con `NEXTAUTH_SECRET`, extrae `userId`
6. Las rutas usan `c.get('userId')` del context

## Data Flow (ejemplo: submitDailyEntry)

```
JournalForm.tsx (client)
  → api.post('/api/journal/entries', payload)
    → api-client.ts: fetch('http://localhost:3001/api/journal/entries', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer <jwt>', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      → Hono app.ts → auth middleware (valida JWT)
        → routes/journal.ts: POST /entries
          → calcula streak, level progression (utils del shared)
          → db.insert/update (Drizzle via shared schema)
          → responde { success: true, data: { levelUpgraded, newLevel } }
      ← JSON response
  ← JournalForm.tsx maneja la respuesta
```

## Shared Package (`@journaling/shared`)

Exporta:
- **types.ts**: `ApiResponse<T>`, `UserProfile`, `DailyEntryPayload`, `HabitPayload`, `WeeklyPlanPayload`, `QuarterlyPlanPayload`, `BibleVerse`
- **constants.ts**: `DEMO_USER_ID`, `DEMO_USER_EMAIL`, `DEMO_USER_NAME`, `DEMO_USER_PASSWORD_HASH`, `FALLBACK_VERSES`
- **validation.ts**: Zod schemas para validar payloads de cada endpoint
- **utils.ts**: `calculateStreak()`, `checkLevelProgression()`, `getISOWeekLabel()`
- **db/schema.ts**: Drizzle ORM schema (tablas: users, dailyEntries, habits, weeklyPlans, quarterlyPlans, bibleVerses)
- **db/seed-data/bible-verses.ts**: 120 versiculos

## Package Dependencies

```
@journaling/shared  ← sin dependencias externas (solo drizzle-orm, zod)
@journaling/api     ← depende de @journaling/shared, hono, @libsql/client, drizzle-orm
@journaling/web     ← depende de @journaling/shared (tipos), next, next-auth, react
```

Cada package referencia al shared via npm workspaces:
```json
// packages/api/package.json
{ "dependencies": { "@journaling/shared": "*" } }
// packages/web/package.json
{ "dependencies": { "@journaling/shared": "*" } }
```

## tsconfig paths

Cada package resuelve `@journaling/shared` a su directorio fuente:

```json
// packages/api/tsconfig.json y packages/web/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@journaling/shared": ["../shared/src"],
      "@journaling/shared/*": ["../shared/src/*"]
    }
  }
}
```

## drizzle.config.ts

Al mover el schema, se actualiza la ruta:

```typescript
// drizzle.config.ts (raiz)
export default defineConfig({
  schema: './packages/shared/src/db/schema.ts',  // antes: './src/db/schema.ts'
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:local.db',
  },
});
```

## Variables de entorno

```bash
# .env (raiz) — usado por drizzle-kit, api, y seed
DATABASE_URL=file:local.db
DATABASE_AUTH_TOKEN=         # opcional, solo para Turso en prod
NEXTAUTH_SECRET=journaling-nextauth-super-secret-key-12345

# packages/web/.env.local — usado por Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=journaling-nextauth-super-secret-key-12345

# packages/api/.env — opcional, el puerto default es 3001
PORT=3001
```

## CORS

Hono acepta `http://localhost:3000` en desarrollo. En produccion, el origin del front desplegado:

```typescript
// packages/api/src/app.ts
app.use('*', cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://journaling-integral.vercel.app'
    : 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
```

## Scripts (root package.json)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "npm -w @journaling/api run dev",
    "dev:web": "npm -w @journaling/web run dev",
    "build": "npm -w @journaling/web run build",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx packages/api/src/seed.ts"
  }
}
```

## Migracion Checklist

### Paso 1: Crear estructura del monorepo
- [ ] Root `package.json` con `workspaces`
- [ ] `packages/shared/` — package, tsconfig, barrel
- [ ] `packages/api/` — package, tsconfig, Hono setup
- [ ] `packages/web/` — mover src/ actual aca

### Paso 2: Shared package
- [ ] Mover `src/db/schema.ts` → `packages/shared/src/db/schema.ts`
- [ ] Mover `src/lib/constants.ts` → `packages/shared/src/constants.ts`
- [ ] Mover `src/db/seed/data/bible-verses.ts` → `packages/shared/src/db/seed-data/`
- [ ] Extraer `calculateStreak`, `checkLevelProgression`, `getISOWeekLabel` → `shared/src/utils.ts`
- [ ] Crear `shared/src/types.ts` con interfaces de request/response
- [ ] Crear `shared/src/validation.ts` con Zod schemas

### Paso 3: API package (Hono)
- [ ] Setup Hono app con CORS y auth middleware
- [ ] `db.ts` con Drizzle + libsql client
- [ ] Implementar 14 endpoints (mapeo 1:1 de server actions)
- [ ] `seed.ts` — mover de `src/db/seed.ts`, importar de shared

### Paso 4: Web package (Next.js)
- [ ] Mover todo `src/` actual a `packages/web/src/`
- [ ] Actualizar `next.config.js`, `tsconfig.json`
- [ ] Crear `src/lib/api-client.ts`
- [ ] Reemplazar server action imports → `api.get/post()`
- [ ] Server components: fetch al back en vez de DB directa
- [ ] Eliminar `src/app/actions/` entero
- [ ] Eliminar API routes excepto `auth/[...nextauth]`
- [ ] Mantener `providers.tsx` (SessionProvider)

### Paso 5: Root config
- [ ] `.env` con `DATABASE_URL`, `NEXTAUTH_SECRET`
- [ ] `drizzle.config.ts` → apuntar schema a shared
- [ ] Scripts `dev`, `dev:api`, `dev:web`, `db:push`, `db:seed`

### Paso 6: Verificacion
- [ ] `npm run dev:api` → Hono en :3001 responde
- [ ] `npm run dev:web` → Next.js en :3000 carga
- [ ] Login → JWT → backend valida
- [ ] Flujo completo: journal entry, habits, planning, bible verses
- [ ] `npm run build` en web sin errores

## Archivos que desaparecen

- `src/app/actions/` (7 archivos) → logica va a `packages/api/src/routes/`
- `src/db/seed.ts` → `packages/api/src/seed.ts`
- `src/db/db.ts` → `packages/api/src/db.ts`
- `src/db/schema.ts` → `packages/shared/src/db/schema.ts`
- `src/lib/constants.ts` → `packages/shared/src/constants.ts`
- `src/db/seed/data/bible-verses.ts` → `packages/shared/src/db/seed-data/`

## Archivos que se mantienen intactos

- Todos los componentes UI (`src/components/`, `src/app/*/page.tsx`, `*Client.tsx`, `*Form.tsx`)
- Estilos (`globals.css`, Tailwind config)
- NextAuth (`api/auth/[...nextauth]`)
- PWA (`manifest.json`, `sw.js`)
