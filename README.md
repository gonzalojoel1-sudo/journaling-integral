# Journaling Integral

Aplicación de journaling integral con hábitos, finanzas personales, negocio, círculos, devocionales, y asistente IA. Construida con Next.js 15 (App Router) y React 19, persistencia en SQLite (local o Turso) vía Drizzle ORM, autenticación con NextAuth v4, y un asistente conversacional powered por **MiniMax** (M3 + M2.7-highspeed) con búsqueda semántica local.

## Stack

- **Framework:** Next.js 15.1 (App Router) + React 19.2
- **Lenguaje:** TypeScript 5.7 (modo `strict`)
- **ORM / DB:** Drizzle ORM 0.38 + libSQL / SQLite (Turso en prod, archivo local en dev)
- **Auth:** NextAuth v4 (Credentials provider)
- **IA:** Vercel AI SDK + MiniMax (M3 + M2.7-highspeed) vía API OpenAI-compatible
- **RAG:** TF-IDF local (`local-tfidf-v1`) — sin API externa
- **Estilos:** Tailwind CSS 3
- **Charts:** Recharts
- **Validación:** Zod
- **Tests:** Vitest 4 + Testing Library (jsdom)
- **Lint:** ESLint 10 + typescript-eslint

## Setup

```bash
# 1. Instalar dependencias
pnpm install   # o npm install

# 2. Crear archivo de entorno
cp .env.example .env

# 3. Editar .env con tus claves API:
#    - DATABASE_URL (sqlite local o libsql Turso)
#    - NEXTAUTH_SECRET + PASSWORD_SALT
#    - MINIMAX_API_KEY (obtener en platform.minimax.io)

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
| `MINIMAX_API_KEY` | API key de MiniMax Token Plan | sí (para chat) |

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

- **285 tests** distribuidos en 21 archivos (todos pasando).
- Entorno: `jsdom` para componentes React; Node para lógica pura.
- Mocks: Drizzle ORM (queries + insert + update), NextAuth, `next/cache`.

### Áreas cubiertas

- Lógica pura: `auth`, `password`, `habit-engine`, `habit-strength`, `validations`, `rag`, `chat-context`
- Server actions: `auth`, `save-journal-draft`, `toggle-habit`, `voice-entry`
- Helpers: `constants-domain`, `dates`, `json`, `logger`, `rate-limit`
- Estructurales: `CentroMandoDashboard`, `useDashboardData`

### Limitaciones conocidas

- **No hay tests de render React.** La infraestructura actual (`jsx: "preserve"` + Vitest 4) no permite renderizar JSX en jsdom sin `@vitejs/plugin-react`. Los tests estructurales validan el contrato del source en su lugar.
- **Cobertura aproximada:** ~20-25% de líneas (lib + actions principalmente). Componentes UI y rutas de página no están cubiertos por tests de integración.

## Lint

```bash
npm run lint
```

> **Nota:** `eslint.config.js` no usa `eslint-config-next` (que arrastra `eslint-plugin-react@7.37.5`, incompatible con `eslint@10`). En su lugar, importa `@next/eslint-plugin-next` directamente y los plugins individuales (`eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`).

## Auditorías de código

- [`docs/auditoria-2026-07-25.md`](docs/auditoria-2026-07-25.md) — primera auditoría (3 críticos + varios medios).
- [`docs/auditoria-2026-07-28-full.md`](docs/auditoria-2026-07-28-full.md) — auditoría masiva (8 agentes paralelos, 285+ hallazgos).
- [`docs/MINIMAX_SETUP.md`](docs/MINIMAX_SETUP.md) — guía operativa de la integración MiniMax.
- [`docs/debug-session-2026-07-27-create-first-unit-hangs.md`](docs/debug-session-2026-07-27-create-first-unit-hangs.md) — sesión de debug sobre `CreateFirstUnitGate`.

Los reportes de batches previos viven en `.superpowers/sdd/`.

## Migración reciente: MiniMax (2026-07-29)

Toda la IA del proyecto corre sobre MiniMax Token Plan:
- **Chat:** `MiniMax-M3` (primary) → `MiniMax-M2.7-highspeed` (fallback), thinking desactivado
- **Smart-entry:** `MiniMax-M2.7-highspeed` (fast) → `MiniMax-M3` (primary)
- **RAG:** TF-IDF local (sin API externa)
- 1 sola API key: `MINIMAX_API_KEY`
- 4 dependencias eliminadas (`@ai-sdk/google`, `@ai-sdk/openai-compatible`, `@google/generative-ai`, `groq-sdk`)

Ver [MINIMAX_SETUP.md](docs/MINIMAX_SETUP.md) para detalles operativos.

## Licencia

Privado / sin licencia pública. Todos los derechos reservados.