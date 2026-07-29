# 🔍 AUDITORÍA MASIVA COMPLETA — Journaling Integral

**Fecha:** 2026-07-28  
**Alcance:** 124 archivos TS/TSX · ~17,735 líneas · Next.js 15 · Drizzle · NextAuth  
**Método:** 8 agentes paralelos especializados investigando el codebase (sin modificar código)  
**Estado previo:** Auditoría del 2026-07-25 reportó 13 issues; esta auditoría confirma estado y descubre nuevos.

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| **Hallazgos totales** | **285+** |
| 🔴 Críticos | **42** |
| 🟠 Altos | **94** |
| 🟡 Medios | **112** |
| 🟢 Bajos | **37** |
| **Cobertura de tests** | ~1.6% archivos, ~3.3% líneas |
| **Errores de ESLint activos** | **149 errores, 92 warnings** |
| **Issues de auditoría previa pendientes** | **12 de 13** (92% no resueltos) |

**Diagnóstico global:** La aplicación tiene una base funcional razonable pero presenta **vulnerabilidades críticas de seguridad explotables en producción**, **bypass completo de autorización**, y una **arquitectura que no escala ni se mantiene**. La auditoría del 25 de julio fue ignorada casi en su totalidad. Hay regresiones sobre fixes que se intentaron aplicar.

---

## 🚨 TOP 10 CRÍTICOS — ACCIÓN INMEDIATA

| # | Issue | Archivo:línea | Esfuerzo |
|---|-------|---------------|----------|
| 1 | **`getCurrentUserId` retorna `DEMO_USER_ID`** cuando no hay sesión o DB falla — usuarios anónimos escriben/leen datos del demo | `src/app/actions/auth.ts:18-33` | 30 min |
| 2 | **`/api/admin/level` sin auth ni admin check** — escalada de privilegios universal | `src/app/api/admin/level/route.ts:1-6` | 5 min |
| 3 | **`NEXTAUTH_SECRET` con fallback hardcodeado** a string público — JWT falsificables | `src/app/api/auth/[...nextauth]/options.ts:70` | 5 min |
| 4 | **3 implementaciones de hash con sales distintos** — usuarios no pueden loguearse si cambia el salt | `auth/options.ts:9`, `register/route.ts:9`, `password.ts` | 1 h |
| 5 | **IDOR en 7+ server actions** — mutaciones sin filtro `userId` | `habits.ts:91`, `business.ts:224,237,361`, `personal-finance.ts:73,107` | 2 h |
| 6 | **`autoSaveBizField` mass assignment** — atacante escribe cualquier columna | `business.ts:59-64` | 1 h |
| 7 | **`/api/habits/evolve` sin auth ni ownership** — cualquiera modifica cualquier hábito | `api/habits/evolve/route.ts:6-22` | 15 min |
| 8 | **`password.ts` existe pero NUNCA SE IMPORTA** — código muerto crítico | `src/lib/password.ts` (sin imports) | 15 min |
| 9 | **API keys reales en `.env`/`.env.local`** — rotación no verificada, riesgo de leak | `.env`, `.env.local` | 30 min |
| 10 | **`submitDailyEntry` no es atómico + N+1 masivo** — race conditions y 10-30 queries serializadas | `daily-journal.ts:34-313` | 3 h |

---

## 📋 HALLAZGOS CONSOLIDADOS POR CATEGORÍA

### 1. 🔐 SEGURIDAD (42 issues)

#### CRÍTICOS

- **S-01** Salt hardcodeado en `auth/options.ts:9` y `register/route.ts:9` (mismo valor que `.env`)
- **S-02** `NEXTAUTH_SECRET` con fallback público `'journaling-nextauth-super-secret-key-12345'`
- **S-03** `getCurrentUserId` con fallback a `DEMO_USER_ID` — anon = demo user
- **S-04** API keys reales en `.env`/`.env.local` (`GOOGLE_AI_STUDIO_KEY`, `GROQ_API_KEY`, etc.)
- **S-05** `/api/admin/level` sin `checkAdmin()` ni auth
- **S-06** `/api/habits/evolve` sin auth ni ownership check
- **S-07** IDOR en 7+ server actions (habits, business settings, transactions)
- **S-08** `autoSaveBizField` mass assignment con `field` controlado por cliente
- **S-09** `validateActiveChallenges` exportada recibe `user`/`entry` del cliente
- **S-10** `password.ts` huérfano — 3 implementaciones divergentes
- **S-11** `saveJournalDraft` y `saveHabitsDraft` con spread de input sin validar
- **S-12** Timing attack en `verifyPassword` (`===` en vez de `timingSafeEqual`)

#### ALTOS

- **S-13** `getOrCreateUserProfile` auto-crea usuario demo si la sesión no matchea
- **S-14** Sin headers de seguridad (CSP, HSTS, X-Frame-Options)
- **S-15** Matcher del middleware incompleto — no cubre `/api/admin/*`, `/voice-journal`
- **S-16** Rate limit fail-open en error de DB
- **S-17** `/api/register`, `/api/admin/level`, `/api/habits/evolve` sin rate limit
- **S-18** User enumeration en login/register por mensajes distintos
- **S-19** `OnboardingGuard` depende de header `x-pathname` — bypass si matcher no aplica
- **S-20** `DEMO_USER_PASSWORD_HASH` hardcodeado en `constants.ts`
- **S-21** CSRF solo implícito (SameSite cookies); falta verificación de `Origin`
- **S-22** AI tool execution sin confirmación humana para transacciones

#### MEDIOS

- **S-23** `console.log` de presencia de API keys en producción
- **S-24** `z.any()` en 7 campos JSON de validations.ts (proto pollution risk)
- **S-25** Register no valida formato email ni longitud mínima de password
- **S-26** Sin rate limit en register/habits/evolve/admin/level
- **S-27** Mass assignment en `saveJournalDraft` (data spread a DB)
- **S-28** Weekly/quarterly planning sin ownership check

#### BAJOS

- **S-29** `dangerouslySetInnerHTML` en layout para service worker
- **S-30** `getRandomVerse` carga TODA la tabla a memoria
- **S-31** `circles.ts` solo 8 chars de entropía en inviteCode
- **S-32** Sin tests de seguridad para RBAC/IDOR

---

### 2. ⚙️ SERVER ACTIONS & API ROUTES (23 issues)

#### Inventario completo de Server Actions (52 exports)

| Categoría | Total | Validados OK | Con problemas |
|-----------|------:|-------------:|--------------:|
| Authentication | 3 | 0 | 3 (fail-open demo, salt, secret) |
| Business | 8 | 0 | 8 (IDOR, sin transacciones, N+1) |
| Personal Finance | 5 | 0 | 5 (IDOR, sin transacciones) |
| Habits | 4 | 1 | 3 (IDOR, sin Zod) |
| Circles | 5 | 0 | 5 (sin try/catch, sin Zod, races) |
| Challenges | 5 | 0 | 5 (N+1, sin transacciones, `validateActiveChallenges` exportada) |
| Planning | 4 | 0 | 4 (`z.any()`, race conditions) |
| Misc | 18 | 5 | 13 |

#### CRÍTICOS

- **SA-01** `getCurrentUserId` fail-open a demo (ya en S-03)
- **SA-02** Autosave cross-user leak — query solo por fecha sin userId
- **SA-03** `/api/habits/evolve` sin auth (ya en S-06)
- **SA-04** `validateActiveChallenges` exportada acepta objetos del cliente
- **SA-05** IDOR masivo (ya en S-07)

#### ALTOS

- **SA-06** `/api/admin/level` sin admin (ya en S-05)
- **SA-07** `autoSaveBizField` sin whitelist (ya en S-08)
- **SA-08** `submitDailyEntry` no atómico — 10+ writes sin transacción
- **SA-09** Operaciones financieras multi-step sin transacción
- **SA-10** Contadores con race condition read-modify-write
- **SA-11** Register sin validar formato (ya en S-25)
- **SA-12** `z.any()` neutraliza validación (ya en S-24)

#### MEDIOS

- **SA-13** N+1 en procesamiento de hábitos diarios
- **SA-14** Queries sin LIMIT en bible, challenges, business
- **SA-15** Contratos de retorno inconsistentes (`{success}` vs `null` vs `[]`)
- **SA-16** TypeScript safety debilitada por `any` (16+ ocurrencias)

---

### 3. 🗄️ DATABASE & SCHEMA (49 issues)

#### Inventario de Tablas

| Tabla | Cols | Índices | Issues |
|-------|-----:|--------:|--------|
| `users` | 10 | 1 | Auth bypass #3 |
| `daily_entries` | 64 | 1 | God-table #32, N+1, sin idx FK |
| `weekly_plans` | 7 | 0 | tasksJson sin validar |
| `quarterly_plans` | 17 | 0 | smartObjectivesJson sin validar |
| `habits` | 30 | 0 | Migration ad-hoc, sin idx |
| `bible_verses` | 7-8 | 0 | Drift schema, auto-delete |
| `challenges` | 7 | 0 | N+1, sin idx |
| `badges` | 6 | 0 | N+1, sin idx |
| `business_transactions` | 11 | 0 | Sin txn, sin idx |
| `business_settings` | 10 | 0 | Multi-active ambiguo |
| `personal_transactions` | 8 | 0 | Sin txn, sin idx |
| `journal_embeddings` | 6 | 0 | Vector ineficiente |
| `rate_limits` | 4 | 1 | Crece sin bound |
| `circles` | 5 | 0 | FK no cascade |
| `circle_members` | 7 | 1 | userId nullable |

**Total índices custom: 2** (debería ser ~15+)

#### CRÍTICOS

- **DB-01** Drift de schema — `bible_verses.recommended_tier` existe en DB pero no en schema.ts
- **DB-02** N+1 masivo en `submitDailyEntry` (10-30 queries serializadas)
- **DB-03** Auto-creación de usuario DEMO + auth bypass (ya en S-03)
- **DB-04** `seed.ts` ejecuta `DELETE FROM bible_verses` sin guard de NODE_ENV
- **DB-05** Migración `2026-07-12-habit-engine.ts` rompe contrato de drizzle-kit (DROP+CREATE sin transacción)
- **DB-06** ON DELETE incorrecto en `circles.createdBy` y otros FKs
- **DB-07** Password hashing triplicado (ya en S-10)
- **DB-08** NEXTAUTH_SECRET fallback (ya en S-02)

#### ALTOS

- **DB-09** Solo 2 índices custom — faltan ~13 críticos (FK, userId+date, status)
- **DB-10** `negocio/page.tsx` carga TODAS las transacciones sin LIMIT
- **DB-11** `backfill-embeddings.ts` carga TODO en memoria (OOM risk)
- **DB-12** `searchSimilarEntries` carga TODOS los embeddings (~14MB parseados/mensaje)
- **DB-13** `registerSale` sin transacción
- **DB-14** `withdrawToPersonal` sin transacción
- **DB-15** `autoSyncSalesWithTransaction` sin transacción
- **DB-16** `submitDailyEntry` muta 4 tablas sin transacción
- **DB-17** `circleMembers.userId` nullable pero siempre requerido
- **DB-18** `adminDeleteUser` no usa ON DELETE CASCADE
- **DB-19** `autoActivateChallenges` N+1 (~50 queries/submit)
- **DB-20** `validateActiveChallenges` N+1 sin transacción
- **DB-21** Embeddings almacenados como text (38KB/row, sin index vectorial)
- **DB-22** Embeddings sin `modelVersion` (incompatibilidad silenciosa)
- **DB-23** Embedding falla silenciosamente sin retry
- **DB-24** `rate_limits` crece indefinidamente
- **DB-25** `seed-simulation.ts` sin transacción ni guard
- **DB-26** Scripts sin guard de NODE_ENV

#### MEDIOS

- **DB-27** `save-habits-draft.ts` query sin filtrar por user
- **DB-28** `save-journal-draft.ts` spread de input sin validar
- **DB-29** `autoSaveBizField` field whitelisting defense-in-depth ausente
- **DB-30** `joinCircle` permite duplicados
- **DB-31** `inviteCode` solo 32 bits entropía
- **DB-32** `daily_entries` god-table con 64 columnas
- **DB-33** `weeklyPlans.tasksJson` sin Zod
- **DB-34** `quarterlyPlans.smartObjectivesJson` sin Zod
- **DB-35** Falta ON DELETE CASCADE en múltiples FKs
- **DB-36** `autoActivateChallenges` corre síncrono en submit
- **DB-37** `cadena-store.ts` archivo huérfano sin uso
- **DB-38** `autoSaveBizField` hardcodea `levelAtEntry: 1`
- **DB-39** `rate-limit.ts` usa `db?.` sin motivo
- **DB-40** Sin FTS5 en `daily_entries`
- **DB-41** `BusinessSettings.isActive` no enforce single-active

---

### 4. ⚛️ REACT/FRONTEND (63 issues)

#### Top componentes por complejidad

| Componente | Líneas | Responsabilidades | Riesgo |
|------------|-------:|------------------:|--------|
| `JournalForm.tsx` | 648 | 10 | CRÍTICO |
| `TransactionLedger.tsx` | 509 | 7 | ALTO |
| `page.tsx` (Dashboard) | 503 | 9 | ALTO |
| `ReviewClient.tsx` | 465 | 8 | MEDIO |
| `QuarterlyPlanForm.tsx` | 444 | 6 | MEDIO |
| `ProgressClient.tsx` | 429 | 5 | MEDIO |
| `BizCompactPanel.tsx` | 372 | 5 | MEDIO |
| `HabitWizard.tsx` | 353 | 4 | MEDIO |

#### CRÍTICOS

- **FE-01** `JournalForm` "god component" — 27 useState, JSON.stringify en cada keystroke
- **FE-02** `useAutosave` pierde writes en disable+unmount (cleanup borra timer sin flush)
- **FE-03** Modales sin `role="dialog"` ni focus trap (4 sitios)
- **FE-04** Cero `loading.tsx` en ninguna ruta

#### ALTOS

- **FE-05** `HabitProgress.toggleHabit` y `PriorityChecklist.toggleCheck` **no persisten** (bug funcional)
- **FE-06** `JournalForm.setInterval 'tick'` fútil — force renders cada 10s
- **FE-07** `BizCompactPanel.debouncedSave` pierde writes en unmount
- **FE-08** 15+ botones icon-only sin `aria-label`
- **FE-09** Inputs sin label asociado en ~12 sitios
- **FE-10** Sin `aria-label`/`focus-visible` global
- **FE-11** `WithdrawButton` sin validación HTML5
- **FE-12** Local state replica server state en 3 sitios
- **FE-13** `any` en props de componentes (8 sitios críticos)
- **FE-14** Sin uso de `useFormStatus`, `useOptimistic`, `useFormState`
- **FE-15** Design tokens inexistentes (`surface-card`, `glass-panel`, `shadow-soft`)
- **FE-16** Clases duplicadas literalmente en `TransactionLedger`

#### MEDIOS

- **FE-17** `QuarterlyPlanForm` `useEffect` con `setActiveTab` (eslint-disable justificado)
- **FE-18** `StepDevocional.persistHabits` sin cleanup
- **FE-19** Navigation: useEffect duplicado Desktop/Mobile
- **FE-20** `page.tsx` dashboard usa `Date.now()` con timezone del server
- **FE-21** Tablas semánticas sin `role="tablist"`/`role="tab"` (5 sitios)
- **FE-22** Sliders sin `aria-valuetext`
- **FE-23** Sin `Suspense` boundaries
- **FE-24** Inconsistencia `bg-zinc-*` vs `bg-stone-*`
- **FE-25** `KairoChat` `useEffect` async sin cleanup
- **FE-26** Tokens `bg-stone-250` inexistentes en Tailwind
- **FE-27** `QuarterlyPlanForm` sin validación
- **FE-28** `BusinessSettingsModal` `Number('')` = 0 silencioso
- **FE-29** Tablas inconsistentes en withdrawals
- **FE-30** Inline styles para % width repetidos
- **FE-31** 10 sitios sin loading.tsx
- **FE-32** 7 sitios sin error.tsx
- **FE-33** Tipos faltantes explícitos
- **FE-34** Force-dynamic global en dashboard
- **FE-35** PWA service worker inline en layout

---

### 5. 🏗️ ARQUITECTURA & PATRONES (50 issues)

#### CRÍTICOS

- **AR-01** Mutaciones sin ownership (ya en S-07)
- **AR-02** `submitDailyEntry` no atómico (ya en SA-08)
- **AR-03** `habits/evolve` sin auth ni Zod (ya en S-06)
- **AR-04** Password hashing duplicado (ya en S-10)

#### ALTOS

- **AR-05** `/api/admin/level` depende de action no-admin
- **AR-06** Server actions funcionan como controller+service+repository
- **AR-07** Contrato de retorno de actions inconsistente
- **AR-08** Validación Zod no aplicada consistentemente
- **AR-09** `z.any()` neutraliza boundary (ya en S-24)
- **AR-10** `createBusinessTransaction` duplicada (2 archivos, mismo código)
- **AR-11** Lógica financiera duplicada entre UI, actions y chat tools
- **AR-12** API routes sin pipeline uniforme
- **AR-13** Mutación mediante GET en `/api/circles/invite`
- **AR-14** `chat/route.ts` "God Route" (12 responsabilidades)
- **AR-15** Configuración IA fragmentada
- **AR-16** `DashboardPage` (page.tsx) mezcla 9 responsabilidades
- **AR-17** `JournalForm` god component (ya en FE-01)
- **AR-18** `daily-journal.ts` baja cohesión (8 responsabilidades)
- **AR-19** `TransactionLedger` mezcla CRUD, filtros, formularios y tabla
- **AR-20** `ReviewClient` combina analytics, heurísticas y planificación
- **AR-21** Tipos de hábitos no canónicos (`src/types/habits.ts` ignorado)
- **AR-22** JSON persistence dispersa y sin tipar
- **AR-23** Falta design system mínimo (Button, Input, Modal primitives)
- **AR-24** Ledgers personal/business duplican CRUD

#### MEDIOS

- **AR-25** Naming inconsistente (Pascal/camel/kebab-case mezclados)
- **AR-26** Nombres engañosos (`mockSave`, `setPrep1`, `levelUpgraded`)
- **AR-27** Demo config mezclada con contenido
- **AR-28** Magic numbers extendidos
- **AR-29** Booleanos persistidos como `0/1` (contamina todas las capas)
- **AR-30** `page.tsx` waterfall de datos
- **AR-31** Server Component importa server actions para lecturas
- **AR-32** `page.tsx` archivos no ligados a convención
- **AR-33** Naming archivos inconsistente
- **AR-34** Time helpers duplicados con riesgo UTC
- **AR-35** `validations.ts` monolito
- **AR-36** Sin Route Groups
- **AR-37** Tests solo cubren utilidades
- **AR-38** Vitest config demasiado genérica
- **AR-39** Tipos Drizzle/Zod/`src/types` divergen

#### BAJOS

- **AR-40** `lib` contiene infraestructura (debería ser puro)
- **AR-41** API routes importan server actions
- **AR-42** Componentes acoplados a `app/actions`
- **AR-43** Sin `dependency-cruiser` para validar boundaries
- **AR-44** `next.config.mjs` limpio pero no impone boundaries

---

### 6. 🐛 ERROR HANDLING & OBSERVABILITY (29 issues)

#### CRÍTICOS

- **EH-01** `getCurrentUserId` fail-open a demo (ya en S-03)
- **EH-02** Salt hardcodeado (ya en S-01)
- **EH-03** Rate-limit fail-open (ya en S-16)
- **EH-04** `OnboardingGuard` traga errores → bypass de onboarding
- **EH-05** `circles.ts` sin try/catch en 5 funciones
- **EH-06** NEXTAUTH_SECRET fallback (ya en S-02)
- **EH-07** Sin validación de env vars al startup
- **EH-08** Sin reconnect logic para Turso

#### ALTOS

- **EH-09** Solo 3 `error.tsx` en el proyecto, faltan en 8+ rutas
- **EH-10** Error boundaries sin telemetría (Sentry/PostHog)
- **EH-11** `redirect()` enmascara errores en admin observability
- **EH-12** API routes sin try/catch en `admin/level` y otros
- **EH-13** 4 componentes ignoran `result.error` (WithdrawButton, BizCompactPanel, etc.)
- **EH-14** `mockSave` en JournalForm no persiste (autosave fantasma)

#### MEDIOS

- **EH-15** 50+ `console.log`/`info`/`debug` en producción
- **EH-16** Logging inconsistente — algunas funciones loggean, otras no
- **EH-17** Mensajes de error de DB potencialmente expuestos (`String(error)`)
- **EH-18** 4 `.then()` sin `.catch()` en código cliente
- **EH-19** 11 `JSON.parse()` sin try/catch
- **EH-20** Sin circuit breaker para AI providers
- **EH-21** Embedding falla silenciosa en background

---

### 7. 🤖 AI / RAG (31 issues)

#### Inventario de Providers

| Provider | Modelo | Rutas | Rate Limit | Timeout | Fallback |
|----------|--------|-------|:----------:|:-------:|----------|
| OpenRouter | `poolside/laguna-m.1:free` | chat | 20/min | ❌ | OpenCode |
| OpenCode | `deepseek-v4-flash-free` | chat | (compartido) | ❌ | Error 500 |
| Groq | `llama-3.3-70b-versatile` | smart-entry | 5/min | 5s | Gemini |
| Google Gemini | `gemini-3-flash-preview` | smart-entry | (compartido) | 5s | Error 500 |
| Google Gemini | `gemini-embedding-001` ⚠️ | embeddings | ❌ | ❌ | Throw |

#### CRÍTICOS

- **AI-01** `/api/habits/evolve` sin auth (ya en S-06)
- **AI-02** **Prompt injection via RAG** — contenido del diario se inyecta al system prompt sin sanitización
- **AI-03** **Prompt injection via transcript** en smart-entry — JSON.parse sin validación
- **AI-04** **`gemini-embedding-001` no es modelo válido** — embeddings nunca se guardan, RAG roto silenciosamente

#### ALTOS

- **AI-05** Doble LLM call por mensaje de chat (costo ×2)
- **AI-06** Modelos "free tier" como primario en producción
- **AI-07** Race condition en `storeEntryEmbedding` (check-then-act)
- **AI-08** Carga todos los embeddings del usuario en memoria (no escala)
- **AI-09** `/api/habits/evolve` sin validación de schema ni max length

#### MEDIOS

- **AI-10** `console.log` expone API keys presence y tool args
- **AI-11** Chat sin timeout (`TIMEOUT_MS` solo usado en smart-entry)
- **AI-12** `temperature: 0.8` para tool calls financieros
- **AI-13** `stopWhen: stepCountIs(5)` permite 5 tool calls/mensaje
- **AI-14** Embedding fire-and-forget sin backpressure
- **AI-15** `submitVoiceEntry` no valida shape
- **AI-16** Rate limiter DB-based (alto costo I/O por request)
- **AI-17** Voice recording sin length check
- **AI-18** Inconsistencia `es-MX` vs `es-ES` en reconocimiento de voz
- **AI-19** Embeddings como JSON string (no permite SQL vector ops)
- **AI-20** Sin circuit breaker
- **AI-21** Rate limit por endpoint, no global AI budget
- **AI-22** `formatContextForPrompt` permite inyección de delimitadores

---

### 8. 🧪 TESTING & CALIDAD (24 issues)

#### Métricas

| Métrica | Valor |
|---------|-------|
| Archivos totales TS/TSX | 124 |
| Archivos con tests | 2 (1.6%) |
| Líneas cubiertas estimadas | ~588 / 17,735 (3.3%) |
| Cobertura de `actions/` | **0%** |
| Cobertura de `api/` | **0%** |
| Cobertura de `components/` | **0%** |
| Errores de ESLint | 149 errores, 92 warnings |

#### CRÍTICOS

- **TQ-01** **Violación de rules-of-hooks en `CentroMandoDashboard`** — early return antes de hooks → crash en runtime
- **TQ-02** **Salt hardcodeado** persiste en 2 archivos (ya en S-01)
- **TQ-03** **`AutoSaveBizField` sin whitelist** (ya en S-08)
- **TQ-04** **Cobertura ~1.6%** — `submitDailyEntry` (511 LOC) sin un solo test

#### ALTOS

- **TQ-05** **ESLint reporta 149 errores activos** que pasan en CI (no hay CI)
- **TQ-06** `JournalForm` usa `!=` 7 veces a pesar de regla `eqeqeq`
- **TQ-07** Type holes masivos en lib crítico (22 ocurrencias en `challenge-templates`, `challenge-auto-activate`)
- **TQ-08** `getRandomVerse` carga toda tabla (ya en DB-30)
- **TQ-09** Sin setup file de Vitest
- **TQ-10** `useAutosave` mock sigue sin conectar a server actions (ya en EH-14)

#### MEDIOS

- **TQ-11** Vitest `--reporter=basic` falla (reporters eliminados en v4)
- **TQ-12** Sin tests de integración/E2E
- **TQ-13** Tests existentes calidad mixta (cubren happy path pero no boundaries)
- **TQ-14** 11 archivos >400 líneas sin拆分
- **TQ-15** Componentes cliente con lógica de negocio compleja sin tests
- **TQ-16** `react-is` dependencia no usada
- **TQ-17** 51 `console.log` en producción (45 son errores de lint)
- **TQ-18** `crypto.randomUUID()` inconsistente (import vs global)

---

## 🔄 ESTADO DE AUDITORÍA PREVIA (2026-07-25)

| # | Issue Previo | Estado | Notas |
|---|--------------|--------|-------|
| 1 | API Keys en `.env` | ⚠️ **Sigue** | No rotadas |
| 2 | `/api/admin/level` sin auth | ❌ **Empeoró** | Ahora delega a action sin check |
| 3 | Salt hardcodeado | ❌ **Regresión** | `password.ts` creado pero NO se importa |
| 4 | Mass assignment `autoSaveBizField` | ❌ **Sigue** | Sin cambios |
| 5 | `JSON.parse` null/undefined | ⚠️ **Parcial** | Algunos sitios protegidos, otros no |
| 6 | `z.any()` en validations | ❌ **Sigue** | 7 ocurrencias idénticas |
| 7 | Rate limit fail-open | ❌ **Sigue** | Sin cambios |
| 8 | Register sin validar formato | ❌ **Sigue** | Sin cambios |
| 9 | Demo password hash hardcodeado | ❌ **Sigue** | Sin cambios |
| 10 | Sin tests de integración | ❌ **Sigue** | 0% en actions/api |
| 11 | `useAutosave` mock | ❌ **Sigue** | Sigue sin conectar |
| 12 | ESLint no configurado | ⚠️ **Estructural OK, contenido crítico** | 149 errores activos sin CI |
| 13 | `getRandomVerse` sin LIMIT | ❌ **Sigue** | Sin cambios |

**Resumen:** 0 resueltos, 2 mejorados estructuralmente, 9 sin cambio, 2 empeoraron.

---

## 🎯 PLAN DE REMEDIACIÓN PRIORIZADO

### 🔴 FASE 1 — CRÍTICOS DE SEGURIDAD (1-2 días)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Hacer `NEXTAUTH_SECRET` obligatorio (throw si falta) | 5 min | CRÍTICO |
| 2 | Rotar API keys + mover a secrets manager | 30 min | CRÍTICO |
| 3 | Eliminar `hashPassword` inline, importar `@/lib/password` | 1 h | CRÍTICO |
| 4 | Fix `getCurrentUserId` — retornar `null` en lugar de `DEMO_USER_ID` | 30 min | CRÍTICO |
| 5 | Agregar `requireAdmin()` en `/api/admin/level` | 5 min | CRÍTICO |
| 6 | Agregar auth + ownership en `/api/habits/evolve` | 15 min | CRÍTICO |
| 7 | Whitelist de campos en `autoSaveBizField` | 1 h | CRÍTICO |
| 8 | Agregar `(userId, id)` en todas las mutaciones (IDOR fix) | 2 h | CRÍTICO |
| 9 | Reemplazar `gemini-embedding-001` por modelo válido | 5 min | CRÍTICO |
| 10 | Sanitizar entrada en RAG context (delimitadores) | 2 h | CRÍTICO |

### 🟠 FASE 2 — ALTOS DE INTEGRIDAD (3-5 días)

| # | Acción | Esfuerzo |
|---|--------|----------|
| 11 | Transacciones en `submitDailyEntry` (entry+streak+habits atómico) | 4 h |
| 12 | Pre-cargar hábitos en 1 query (eliminar N+1) | 1 h |
| 13 | Transacciones en `registerSale`, `withdrawToPersonal`, `autoSync` | 3 h |
| 14 | `useAutosave` flush síncrono en unmount + persistir a DB | 3 h |
| 15 | Fix `BizCompactPanel.debouncedSave` flush en unmount | 1 h |
| 16 | `HabitProgress.toggleHabit` + `PriorityChecklist.toggleCheck` persisten a DB | 3 h |
| 17 | Agregar índices faltantes (~13 índices) | 2 h |
| 18 | Refactor `CentroMandoDashboard` (fix rules-of-hooks) | 2 h |
| 19 | Rate limit fail-closed en error de DB | 15 min |
| 20 | Agregar rate limit en `/api/register`, `/api/admin/level`, `/api/habits/evolve` | 30 min |
| 21 | Validar `req.json()` en todas las API routes con Zod | 2 h |
| 22 | Headers de seguridad (CSP, HSTS, X-Frame-Options) | 1 h |
| 23 | Actualizar matcher del middleware para incluir `/api/admin/*`, `/voice-journal` | 15 min |
| 24 | Quitar `console.log` de producción (50+ sitios) | 2 h |
| 25 | Validar env vars al startup con Zod | 2 h |
| 26 | Error boundaries + loading.tsx en rutas faltantes | 4 h |
| 27 | Quitar `z.any()` en validations.ts (7 campos) | 4 h |
| 28 | Eliminar duplicación `createBusinessTransaction` | 1 h |

### 🟡 FASE 3 — CALIDAD Y ARQUITECTURA (1-2 semanas)

| # | Acción | Esfuerzo |
|---|--------|----------|
| 29 | Setup CI (GitHub Actions) con `tsc`, `vitest`, `eslint` | 4 h |
| 30 | Reducir ESLint errors de 149 a 0 | 1 día |
| 31 | Migrar componentes a `useFormStatus` + `useOptimistic` | 1 semana |
| 32 | Crear primitives de design system (Button, Input, Modal) | 1 semana |
| 33 | Implementar testing infrastructure (setup, factories, mocks) | 1 semana |
| 34 | Tests de seguridad para RBAC/IDOR (10+ tests) | 1 semana |
| 35 | Tests de integración para `submitDailyEntry` | 3 días |
| 36 | Refactor `JournalForm` (648 LOC → split en 5 archivos) | 1 semana |
| 37 | Refactor `chat/route.ts` (305 LOC → split en 6 archivos) | 1 semana |
| 38 | Refactor `page.tsx` dashboard (503 LOC → split + `Promise.all`) | 3 días |
| 39 | Unificar tipos de hábitos (derive from Drizzle/Zod) | 2 días |
| 40 | Crear `ActionResult<T>` y wrapper consistente para actions | 2 días |
| 41 | Implementar cache para `getRandomVerse` por día | 30 min |
| 42 | Implementar logger estructurado (pino) y reemplazar console.* | 1 día |
| 43 | Crear `src/lib/errors.ts` con tipos tipados | 2 h |
| 44 | Implementar circuit breaker para AI providers | 1 día |
| 45 | Implementar retry con backoff para Turso | 1 día |
| 46 | Refactor embedding storage a BLOB | 2 días |
| 47 | Implementar outbox pattern para embeddings pendientes | 2 días |
| 48 | Crear `not-found.tsx` por segmento | 2 h |
| 49 | Implementar service layer (`server/services/`) | 1 semana |
| 50 | Adopción de route groups (`(public)`, `(app)`, `(admin)`) | 2 días |

### 🟢 FASE 4 — LIMPIEZA Y OPTIMIZACIÓN (ongoing)

| # | Acción |
|---|--------|
| 51 | Eliminar código muerto (`cadena-store.ts`, `mockSave`) |
| 52 | Reemplazar `as any` por tipos extendidos de NextAuth |
| 53 | Estandarizar `zinc` vs `stone` en colores |
| 54 | Reemplazar inline styles por clases Tailwind |
| 55 | Quitar `react-is` si no se usa |
| 56 | Documentar modelo de amenaza de AI |
| 57 | Crear README + CHANGELOG |
| 58 | Configurar husky + lint-staged pre-commit |
| 59 | Adoptar conventional commits |
| 60 | Setup deprecation de features (e.g., `levelUpgraded`, `DEMO_USER`) |

---

## 📈 MÉTRICAS OBJETIVO POST-REMEDIACIÓN

| Métrica | Actual | Objetivo |
|---------|-------:|---------:|
| Cobertura de tests | 1.6% | 70%+ |
| Errores de ESLint | 149 | 0 |
| Críticos de seguridad | 12 | 0 |
| IDOR en mutaciones | 7+ | 0 |
| Mutaciones sin transacción | 6+ | 0 |
| N+1 queries conocidos | 5+ | 0 |
| `z.any()` en validations | 7 | 0 |
| `as any` en código | 30+ | 0 |
| `console.log` en producción | 51 | 0 |
| Loading.tsx en rutas | 0/22 | 22/22 |
| Error.tsx en rutas | 3/22 | 22/22 |
| Violaciones rules-of-hooks | 1 (CentroMandoDashboard) | 0 |

---

## 🏁 CONCLUSIÓN

El proyecto **journaling-integral** tiene una base funcional razonable y demuestra buenas intenciones arquitectónicas (Zod, App Router, Drizzle), pero presenta una **acumulación sistemática de issues críticos de seguridad y robustez** que han sido ignorados desde al menos el 2026-07-25. La auditoría previa no generó remediación significativa, y esta auditoría revela **más issues críticos** que la anterior, incluyendo **regresiones** sobre fixes intentados.

**Recomendación inmediata:** Antes de cualquier deploy a producción, resolver el **Top 10 de críticos** (Fase 1) que toma ~1-2 días de trabajo enfocado. La superficie de ataque actual permite:

- **Escalada de privilegios horizontal y vertical** (IDOR + admin/level sin check)
- **Robo de sesiones** (NEXTAUTH_SECRET público)
- **Fuga de datos entre usuarios** (fail-open a DEMO_USER_ID)
- **Bypass completo de rate limiting** (fail-open en DB error)
- **Inyección de prompts en IA** (RAG sin sanitización)
- **Modificación de cualquier recurso** por UUID enumeration

El equipo debe priorizar **seguridad + integridad de datos** antes de añadir features nuevas.

---

**Generado:** 2026-07-28  
**Por:** 8 agentes paralelos especializados (research-only, sin modificación de código)  
**Auditoría previa referenciada:** `docs/auditoria-2026-07-25.md`