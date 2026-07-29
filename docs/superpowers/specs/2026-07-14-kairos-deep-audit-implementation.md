# Kairos Deep Audit — Implementation Design

Fecha: 2026-07-14
Proyecto: journaling-integral
Basado en: Deep Audit (prioridades 1.3, 2.1, 4.1, 4.3)

---

## 1.3 — Rate Limiter Real via Turso

### Problema
Rate limiter actual usa `Map<String, {count, windowStart}>` en memoria. En serverless (Vercel) cada instancia tiene su propio Map, el rate limit es decorativo.

### Solución
Migrar el rate limiter a una tabla en Turso (ya existe soporte dual en `db.ts`). Turso free tier: 500 bases, 9GB, 1B lecturas/mes — suficiente para desarrollo.

### Cambios

**Nueva tabla en schema:**

```typescript
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start').notNull(),
  updatedAt: text('updated_at').notNull(),
});
```

**Modificar `src/lib/rate-limit.ts`:**

| Hoy | Nuevo |
|-----|-------|
| `Map<String, {count, windowStart}>` | `INSERT ... ON CONFLICT DO UPDATE` en Turso |
| `getClientIdentifier()` con fallback local | Igual (no cambia) |
| `setInterval` cleanup cada 5 min | Eliminar (Turso maneja TTL) |

**Firma pública igual:**

```typescript
export function rateLimit(key, limit, windowMs): { success, remaining }
export function getRateLimitInfo(key): { count, windowStart }
export function getClientIdentifier(req, userId?): string
```

### Config

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

### No cambia
- API routes que llaman `rateLimit()` — mismas firmas
- Validaciones, middleware, auth
- Costo: $0

---

## 2.1 — Challenge Engine Automático (sin niveles)

### Progresión de 8 escalones

| Días | Nombre | Lo que realmente lograste |
|------|--------|---------------------------|
| 7 | **Primer Paso** | Apareciste una semana |
| 14 | **Ritmo** | Encontraste tu ritmo |
| 30 | **Hábito** | Ya no lo piensas, lo haces |
| 60 | **Propósito** | Sabes para qué haces esto |
| 90 | **Maestría** | No eres principiante |
| 180 | **Constancia** | Medio año. Esto es quien eres |
| 270 | **Identidad** | No te imaginas sin esto |
| 365 | **Legado** | Un año completo. Lo lograste |

### Eliminación de niveles (no rompe nada)

| Campo | Acción |
|-------|--------|
| `users.currentLevel` | Ignorado. Se reemplaza por función `maxBadgeTier()` que retorna el nombre del badge más alto del usuario |
| `dailyEntries.levelAtEntry` | Se vuelve nullable. Si null, se calcula desde badges al momento de la consulta |
| `bibleVerses.recommendedLevel` | Se agrega `recommendedTier` como columna alternativa |
| `maybeLevelUp()` en challenges.ts | Se elimina. Reemplazado por `autoActivateChallenges()` |
| `api/admin/level` | Deprecado. No se borra. |

### Auto-activación (nuevo: `src/lib/challenge-auto-activate.ts`)

```typescript
export function autoActivateChallenges(userId: string, entry: DailyEntry): void {
  // 1. Áreas basadas en racha general
  const streak = getCurrentStreak(userId);
  const escalones = [7, 14, 30, 60, 90, 180, 270, 365];
  for (const dias of escalones) {
    if (streak >= dias && !hasBadge(userId, `escalon-${dias}`)) {
      unlockBadge(userId, { badgeId: `escalon-${dias}`, area: 'diario', mineral: 'escalon' });
    }
  }

  // 2. Áreas específicas (challenges verticales)
  // disciplina: streak de journaling (ya cubierto arriba)
  // fe: entry.tieneDevocional === true
  // negocio: entry.tieneVenta === true || entry.tieneProspecto === true
  // mente: entry.tieneAutoeducacion === true
  // relaciones: entry.tieneGratitud === true
  // cuerpo: entry.sleepRating >= 7 || entry.energyRating >= 7
  // identidad: entry.tieneIdentity === true
  // legado: entry.tieneLegacyReflection === true
  
  // Misma lógica de escalones por área
  for (const area of ['fe', 'negocio', 'mente', 'relaciones', 'cuerpo', 'identidad', 'legado']) {
    const areaStreak = getAreaStreak(userId, area, entry);
    for (const dias of [7, 14, 30, 60, 90]) {
      if (areaStreak >= dias && !hasBadge(userId, `${area}-${dias}`)) {
        unlockBadge(userId, { badgeId: `${area}-${dias}`, area, mineral: 'escalon' });
      }
    }
  }
}
```

### Notificaciones de progreso

**Dashboard (widget):**
```
🔥 Te faltan 3 días para "Ritmo" (14 días de journal)
🥇 Ya tienes "Primer Paso". Próximo: Ritmo (+7 días)
```

**Post-journal (modal):**
```
🎉 ¡Lograste "Primer Paso"!
7 días consecutivos de journaling.
Próximo: "Ritmo" en 7 días.
```

**Kairo:**
```
"7 días seguidos, Joel. Eso es tu Primer Paso. 
 Próxima parada: encontrar tu Ritmo en 14 días."
```

### Archivos

**Nuevos:**
- `src/lib/challenge-auto-activate.ts` — lógica de auto-activación
- `src/components/challenges/ChallengeNotify.tsx` — notificación post-journal

**Modificados:**
- `src/app/actions/challenges.ts` — reemplazar `maybeLevelUp` por `autoActivateChallenges`, eliminar botón "Activar" manual
- `src/app/actions/daily-journal.ts` — llamar `autoActivateChallenges` al final de `submitDailyEntry`
- `src/app/challenges/page.tsx` — mostrar progreso en lugar de "Activar"
- `src/app/page.tsx` (dashboard) — widget de progreso de escalones
- `src/db/schema.ts` — agregar columna `recommendedTier` a `bibleVerses` (opcional)

---

## 4.1 — Modo Voz (Tercer Modo)

### No reemplaza ni interfiere con Normal ni Día Difícil. Es un tercer modo independiente.

### Selector de modos en el diario

```
┌──────────────────────────────────────┐
│  ✍️ Normal    😥 Día Difícil         │
│  🎙️ Voz (nuevo)                      │
└──────────────────────────────────────┘
```

### Flujo

```
1. Usuario selecciona 🎙️ Voz
2. Se muestra guía visual con las 5 secciones una por una
3. En cada sección:
   - Usuario ve el prompt: "Di: Mi energía hoy fue..."
   - SpeechRecognition transcribe EN EL NAVEGADOR (local, sin llamada AI)
   - Usuario puede pausar/regrabar/saltar
4. Al completar las 5 secciones:
   - Las 5 transcripciones se concatenan en 1 solo texto
   - Se envía 1 única llamada a /api/smart-entry
5. **Edición de transcripción (VoiceReview):** Se muestra el texto completo transcrito de las 5 secciones en un área de texto editable. El usuario puede corregir errores de dictado (anglicismos, nombres técnicos, cifras) antes de enviar a la IA.
6. Al confirmar, se envía 1 única llamada a /api/smart-entry con el texto ya corregido
7. Se muestran los datos estructurados finales para confirmación
8. Si el devocional (Sección 4) no fue grabado, el sistema obliga a grabarlo antes de finalizar
```

### Las 5 secciones

| # | Sección | Prompt visual | Tiempo |
|---|---------|---------------|--------|
| 1 | **Energía** | "Mi energía hoy fue [__] del 1 al 10. Dormí [__] horas. Mi estrés es [__]." | ~30s |
| 2 | **Gratitud + Identidad** | "Agradezco por [__], [__], [__]. Hoy elijo ser [__]." | ~45s |
| 3 | **MIT + Negocio** | "Mi tarea más importante era [__] y la [completé/no]. En el negocio: [__]." | ~60s |
| 4 | **Devocional (obligatorio)** | "Mi reflexión espiritual hoy: [__]." | ~60s |
| 5 | **Cierre** | "Lo que funcionó: [__]. Lo que no: [__]. Mañana mejorar en: [__]." | ~30s |

**Total: ~3.5 min.** Latencia total post-grabación: 1 llamada AI (~2-4s) + render.

### SpeechRecognition en navegador (sin latencia de red)

Ya existe `SmartDictationButton.tsx` que usa `webkitSpeechRecognition` con español. Se reutiliza esa misma lógica:

```typescript
const recognition = new webkitSpeechRecognition();
recognition.lang = 'es-PE';
recognition.interimResults = false;
recognition.continuous = false; // 1 sección a la vez
```

**Fallback:** Si `webkitSpeechRecognition` no está disponible (Firefox, navegadores antiguos), mostrar mensaje: "Tu navegador no soporta dictado por voz. Usa los modos Normal o Día Difícil."

### Integración con Smart Entry existente

El endpoint `/api/smart-entry` ya acepta texto y devuelve JSON estructurado. El modo voz solo transcribe localmente y envía el texto concatenado — el mismo endpoint. **Zero cambios en el backend de AI.**

### Archivos

**Nuevos:**
- `src/components/journal/VoiceMode.tsx` — orquestador del modo (selector + flujo de 5 secciones)
- `src/components/journal/VoiceRecorder.tsx` — componente de grabación por sección con botones grabar/pausar/regrabar
- `src/components/journal/VoiceGuide.tsx` — guía visual con los prompts de cada sección
- `src/components/journal/VoiceReview.tsx` — pantalla de confirmación post-transcripción

**Modificados:**
- `src/app/journal/page.tsx` o `JournalForm.tsx` — agregar selector de 3 modos

---

## 4.3 — Círculos de Confianza (A + C)

### Modelo de datos

```typescript
export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Mi Círculo'),
  createdBy: text('created_by').notNull().references(() => users.id),
  visibilitySettings: text('visibility_settings').notNull().default('only_streak'),
  // valores: 'only_streak' | 'full_stats'
  createdAt: text('created_at').notNull(),
});

export const circleMembers = sqliteTable('circle_members', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id),
  userId: text('user_id').notNull().references(() => users.id),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'),
  // 'pending' | 'active' | 'removed'
  joinedAt: text('joined_at'),
  inviteCode: text('invite_code').unique().notNull(),
});
```

### Privacidad (blindaje por query)

Todas las server actions filtran por `userId === getCurrentUserId()`. Ejemplo:

```typescript
export async function getCircleMembers(circleId: string) {
  const userId = await getCurrentUserId();
  const circle = await db.query.circles.findFirst({
    where: and(eq(circles.id, circleId), eq(circles.createdBy, userId)),
  });
  if (!circle) throw new Error('Acceso denegado');
  return db.query.circleMembers.findMany({
    where: eq(circleMembers.circleId, circleId),
    with: { user: { columns: { id: true, name: true, streakCurrent: true, streakMax: true } } },
  });
}
```

### A — Muro de Consistencia (dashboard widget)

```
👥 Mi Círculo
────────────────────
🟢 Joel     🔥 racha 22  🥇 Hábito
🟢 María    🔥 racha 7   🥇 Primer Paso
🔴 Pedro    ❌ falló ayer

[Enviar 👏 Ánimo a Pedro]  (1 tap, 1 vez cada 24h)
```

### C — Ancla de Responsabilidad

```
Evento: un miembro rompe racha
→ Los otros 2 ven badge rojo en el widget
→ Pueden enviar 1 tap de "👏 Ánimo" (máx 1 cada 24h por persona)
→ Sin chat, sin presión social
→ Kairo al día siguiente al que falló: "Ayer fallaste. ¿Qué pasó?"
```

### Flujo de invitación

```
1. Usuario A genera link de invitación único (inviteCode)
2. Lo comparte con Usuario B (WhatsApp, Telegram, etc.)
3. Usuario B entra al link → se registra/inicia sesión → confirma unirse
4. Ambos ven el widget en su dashboard
5. Máximo 3 personas por círculo (el usuario + 2)
```

### Archivos

**Nuevos:**
- `src/app/actions/circles.ts` — CRUD completo: create, invite, join, leave, sendEncouragement, getMembers, getWidgetData
- `src/components/circles/CircleWidget.tsx` — widget de dashboard (A)
- `src/components/circles/CircleInvite.tsx` — página/flujo de invitación
- `src/lib/circle-notifications.ts` — lógica de notificaciones de racha rota + ánimo

**Modificados:**
- `src/db/schema.ts` — tablas `circles` + `circle_members`
- `src/app/page.tsx` (dashboard) — agregar widget "Mi Círculo" al final

---

## Orden de implementación sugerido

| Orden | Iniciativa | Dependencia | Archivos a modificar |
|-------|-----------|-------------|---------------------|
| 1 | **1.3 Turso** | Ninguna | 3 archivos |
| 2 | **2.1 Challenges** | Ninguna | 5-6 archivos |
| 3 | **4.3 Círculos** | Requiere auth multi-usuario funcional | 5-6 archivos |
| 4 | **4.1 Modo Voz** | Depende de smart-entry (ya existe) | 4-5 archivos |

---

## Lo que NO se toca

- Sistema Normal de journaling (intacto)
- Sistema Día Difícil (intacto)
- Navegación, layout, auth
- RAG, embeddings, Kairo Chat
- Módulo de negocio
- Módulo de finanzas personales
- PWA, manifest, service worker
