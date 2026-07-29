# Journaling Integral

Aplicación de journaling integral con hábitos, finanzas personales, negocio, círculos, devocionales, y asistente IA. Construida con Next.js 15 (App Router) y React 19, persistencia en SQLite (local o Turso) vía Drizzle ORM, autenticación con NextAuth v4, y un asistente conversacional multi-provider (OpenAI, Google AI, Groq, OpenRouter, OpenCode).

## Stack

- **Framework:** Next.js 15.1 (App Router) + React 19.2
- **Lenguaje:** TypeScript 5.7 (modo `strict`)
- **ORM / DB:** Drizzle ORM 0.38 + libSQL / SQLite (Turso en prod, archivo local en dev)
- **Auth:** NextAuth v4 (Credentials provider)
- **IA:** Vercel AI SDK + Google AI, OpenAI, Groq, OpenRouter, OpenCode
- **Estilos:** Tailwind CSS 3
- **Charts:** Recharts
- **Validación:** Zod
- **Tests:** Vitest 4 + Testing Library (jsdom)
- **Lint:** ESLint 10 + typescript-eslint

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de entorno
cp .env.example .env

# 3. Editar .env con tus claves API (mínimo DATABASE_URL + NEXTAUTH_SECRET + PASSWORD_SALT)
#    Si vas a usar Turso: DATABASE_URL=libsql://... y DATABASE_AUTH_TOKEN=...

# 4. Aplicar schema a la base de datos
npm run db:push

# 5. (Opcional) Sembrar datos de demo
npm run db:seed

# 6. Levantar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

### Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | `file:local.db` o `libsql://<db>.turso.io` | sí |
| `DATABASE_AUTH_TOKEN` | Token de Turso (vacío para SQLite local) | solo prod |
| `NEXTAUTH_SECRET` | Secreto para JWT/sesión | sí |
| `NEXTAUTH_URL` | URL pública de la app | sí en prod |
| `PASSWORD_SALT` | Salt para hashing de passwords (scrypt) | sí |
| `GOOGLE_AI_STUDIO_KEY` | Google AI Studio | opcional |
| `GROQ_API_KEY` | Groq | opcional |
| `OPENROUTER_API_KEY` | OpenRouter | opcional |
| `OPENCODE_API_KEY` | OpenCode | opcional |

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (Next.js + Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint sobre `src/` |
| `npm run test` | Vitest en modo watch |
| `npm run test:run` | Vitest single-run (CI) |
| `npm run test:coverage` | Vitest con reporte de cobertura (v8) |
| `npm run db:push` | Aplica el schema Drizzle a la DB |
| `npm run db:studio` | Abre Drizzle Studio (GUI de la DB) |
| `npm run db:seed` | Puebla la DB con datos de demo |
| `npm run db:backfill-embeddings` | Regenera embeddings del journal |

## Estructura del proyecto

```
journaling-integral/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── actions/               # Server actions (mutaciones)
│   │   │   ├── auth.ts
│   │   │   ├── daily-journal.ts
│   │   │   ├── habits.ts
│   │   │   ├── business.ts
│   │   │   ├── personal-finance.ts
│   │   │   ├── bible.ts
│   │   │   ├── circles.ts
│   │   │   ├── challenges.ts
│   │   │   ├── quarterly-planning.ts
│   │   │   ├── weekly-planning.ts
│   │   │   ├── voice-entry.ts
│   │   │   ├── save-habits-draft.ts
│   │   │   ├── save-journal-draft.ts
│   │   │   ├── toggle-habit.ts
│   │   │   ├── update-user-level.ts
│   │   │   └── admin.ts
│   │   ├── api/                   # API routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── chat/
│   │   │   ├── register/
│   │   │   ├── smart-entry/
│   │   │   ├── habits/evolve/
│   │   │   ├── circles/invite/
│   │   │   └── admin/level/
│   │   ├── dashboard/             # Panel principal
│   │   ├── journal/               # Flujo de journaling multi-step
│   │   ├── habits/                # Tarjetas de hábitos + wizard
│   │   ├── finances/              # Finanzas personales
│   │   ├── business/              # Centro de mando del negocio
│   │   ├── challenges/            # Challenges y notificaciones
│   │   ├── circles/               # Círculos sociales
│   │   ├── progress/              # Vistas de progreso
│   │   ├── history/               # Historial de entradas
│   │   ├── review/                # Review semanal / trimestral
│   │   ├── onboarding/
│   │   ├── login/
│   │   ├── admin/                 # Panel admin (observabilidad, users)
│   │   ├── configuracion/         # Settings
│   │   ├── voice-journal/
│   │   ├── layout.tsx
│   │   ├── providers.tsx
│   │   └── page.tsx
│   ├── components/                # Componentes compartidos
│   │   ├── Navigation.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── KairoChat.tsx
│   │   ├── ChatAssistant.tsx
│   │   ├── OnboardingGuard.tsx
│   │   ├── SmartDictationButton.tsx
│   │   ├── StrengthBar.tsx
│   │   ├── business/              # Métricas, ledger, settings, modales
│   │   ├── challenges/
│   │   ├── circles/
│   │   ├── personal/              # CategoryBreakdown, DonutChart, Ledger
│   │   └── voice/                 # VoiceRecorder, VoiceJournal
│   ├── lib/                       # Lógica de negocio (server-side, puro)
│   │   ├── auth.ts                # Sesión y roles
│   │   ├── password.ts            # Hash con scrypt
│   │   ├── habit-engine.ts        # Lógica diaria de hábitos
│   │   ├── habit-strength.ts      # Decay / bonus / streaks
│   │   ├── constants-domain.ts    # Constantes del dominio
│   │   ├── constants-demo.ts      # Datos del usuario demo
│   │   ├── constants-bible.ts     # Versículos y rutas bíblicas
│   │   ├── dates.ts
│   │   ├── devotionalGuide.ts
│   │   ├── json.ts
│   │   ├── logger.ts
│   │   ├── rag.ts                 # Búsqueda semántica sobre embeddings
│   │   ├── rate-limit.ts
│   │   ├── validations.ts         # Schemas Zod
│   │   ├── challenge-auto-activate.ts
│   │   └── challenge-templates.ts
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema (users, habits, entries, ...)
│   │   ├── db.ts                  # Singleton del cliente libSQL
│   │   ├── seed.ts                # Datos iniciales
│   │   ├── seed-simulation.ts     # Generador de datos sintéticos
│   │   ├── backfill-embeddings.ts # Regenera embeddings
│   │   ├── migrations/
│   │   │   └── 2026-07-12-habit-engine.ts
│   │   └── seed/data/bible-verses.ts
│   ├── config/
│   │   └── ai.ts                  # Configuración de proveedores IA
│   ├── middleware.ts
│   └── types/
│       ├── habits.ts
│       └── next-auth.d.ts
├── docs/
│   ├── auditoria-2026-07-25.md
│   ├── auditoria-2026-07-28-full.md
│   └── debug-session-2026-07-27-create-first-unit-hangs.md
├── drizzle/                       # Snapshots de migraciones Drizzle
├── scripts/                       # Scripts de utilidad
├── bruno/                         # Colección de requests (Bruno)
├── public/                        # Assets estáticos
├── drizzle.config.ts
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vitest.config.ts
└── eslint.config.js
```

## Tests

- **262+ tests** distribuidos en 21 archivos.
- Entorno: `jsdom` para componentes React; Node para lógica pura.
- Mocks: Drizzle ORM (queries + insert + update), NextAuth, `next/cache`.

### Áreas cubiertas

| Archivo | Tests | Notas |
|---------|------:|-------|
| `src/lib/auth.test.ts` | 11 | `getSessionUser`, `getUserRole`, `requireAdmin` |
| `src/lib/password.test.ts` | 8 | `hashPassword`, `verifyPassword` (incluyendo salt faltante) |
| `src/lib/habit-engine.test.ts` | 9 | Pilar, precisar, sembrar, crecer, cambiar; caminos vacíos y unknown ids |
| `src/lib/habit-strength.test.ts` | 14 | `applyDecayAndBonus`, `getRealTimeStrength` |
| `src/lib/constants-*.test.ts` | 18 | Constantes del dominio y demo |
| `src/lib/dates.test.ts` | — | Helpers de fechas |
| `src/lib/json.test.ts` | — | Serialización segura |
| `src/lib/logger.test.ts` | — | Logger estructurado |
| `src/lib/rag.test.ts` | — | Búsqueda semántica |
| `src/lib/rate-limit.test.ts` | 4 | `cleanupRateLimits` |
| `src/lib/validations.test.ts` | — | Schemas Zod |
| `src/lib/chat-context.test.ts` | — | Contexto para el asistente |
| `src/app/actions/auth.test.ts` | 4 | `getOrCreateUserProfile` |
| `src/app/actions/save-journal-draft.test.ts` | — | Autosave del journal |
| `src/app/actions/toggle-habit.test.ts` | 11 | `toggleHabitCompleted` |
| `src/app/actions/toggle-habit-schema.test.ts` | 6 | Schema del toggle |
| `src/app/actions/voice-entry.test.ts` | 3 | Wrapper de voz |
| `src/app/negocio/CentroMandoDashboard.hooks.test.ts` | — | Estructural |
| `src/app/negocio/centro-mando/CentroMandoDashboard.structure.test.ts` | 6 | Estructural |
| `src/app/negocio/centro-mando/useDashboardData.test.ts` | 10 | Hook puro |
| `src/lib/chat-context.test.ts` | — | Contexto |

### Limitaciones conocidas

- **No hay tests de render React.** La infraestructura actual (`jsx: "preserve"` + Vite 8 + oxc sin `@vitejs/plugin-react`) no permite renderizar JSX en jsdom. Los tests estructurales validan el contrato del source en su lugar.
- **Cobertura aproximada:** ~20% de líneas en `src/lib/` y `src/app/actions/`. Los componentes y rutas de página no están cubiertos.

## Lint

```bash
npm run lint
```

> **Nota:** `eslint.config.js` no usa `eslint-config-next` (que arrastra `eslint-plugin-react@7.37.5`, incompatible con `eslint@10`). En su lugar, importa `@next/eslint-plugin-next` directamente y los plugins individuales (`eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`).

## Auditorías de código

- [`docs/auditoria-2026-07-25.md`](docs/auditoria-2026-07-25.md) — primera auditoría (3 críticos + varios medios).
- [`docs/auditoria-2026-07-28-full.md`](docs/auditoria-2026-07-28-full.md) — auditoría masiva (8 agentes paralelos, 285+ hallazgos).
- [`docs/debug-session-2026-07-27-create-first-unit-hangs.md`](docs/debug-session-2026-07-27-create-first-unit-hangs.md) — sesión de debug sobre `CreateFirstUnitGate`.

Los reportes de batches previos viven en `.superpowers/sdd/`.

## Licencia

Privado / sin licencia pública. Todos los derechos reservados.