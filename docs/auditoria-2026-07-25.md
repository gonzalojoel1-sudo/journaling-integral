# Auditoría Extrema de Código — Journaling Integral

**Fecha:** 2026-07-25
**Proyecto:** journaling-integral (Next.js 15 + SQLite/Turso + Drizzle ORM)
**Estado del codebase:** Tests 55/55 passing, TypeScript clean

---

## Resumen Ejecutivo

El proyecto está bien estructurado conceptualmente y la mayoría del código es limpio y tipado. Sin embargo, se encontraron **3 problemas de seguridad CRÍTICOS** que requieren atención inmediata, además de varios problemas de robustez y calidad.

---

## CRÍTICO — Seguridad

### 1. API Keys Expuestas en Variables de Entorno [CRÍTICO]

**Archivos:** `.env`, `.env.local`

Las siguientes claves API están en texto plano:
- `GOOGLE_AI_STUDIO_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENCODE_API_KEY`

**Mitigación actual:** Los archivos están en `.gitignore`, pero esto NO protege las claves si alguna vez fueron commiteadas al historial de git.

**Acción requerida:**
- Rotar todas las claves inmediatamente
- Usar un secrets manager (Vault, AWS Secrets Manager, etc.)
- Considerar no usar `.env.local` con claves de producción

---

### 2. `/api/admin/level` No Verifica Permisos de Admin [CRÍTICO]

**Archivo:** `src/app/api/admin/level/route.ts`

```typescript
export async function POST(req: Request) {
  const { level } = await req.json();  // ← Sin validación de admin
  const result = await updateUserLevel(level);
  return Response.json(result);
}
```

**Problema:** Cualquier usuario autenticado puede elevarse a cualquier nivel arbitrario.

**Dato positivo:** `updateUserLevel` en `auth.ts` línea 75 usa `getCurrentUserId()` que sí valida sesión, pero no valida que el usuario sea admin.对比 `admin.ts` que SÍ tiene `checkAdmin()`.

**Acción requerida:** Agregar verificación de admin antes de procesar.

---

### 3. Salt de Password Hardcodeado [CRÍTICO]

**Archivos:**
- `src/app/api/auth/[...nextauth]/options.ts` línea 9
- `src/app/api/register/route.ts` línea 9

```typescript
function hashPassword(password: string): string {
  const salt = 'journaling-integral-salt-key';  // ← Salt estático hardcodeado
  return scryptSync(password, salt, 64).toString('hex');
}
```

**Problema:** El salt es igual para todos los usuarios y está en el código fuente. Si el código es comprometido, todos los hashes son crackeables con rainbow tables del salt conocido.

**Acción requerida:**
- Generar salt único por usuario (recomendado)
- O al menos mover el salt a variable de entorno

---

## ALTO — Robustez

### 4. `AutoSaveBizField` Permite Actualizar Cualquier Campo [ALTO]

**Archivo:** `src/app/actions/business.ts` líneas 59-64

```typescript
const updateData: Record<string, any> = {};
updateData[field] = value;  // ← field viene del cliente, sin whitelist
await db.update(dailyEntries)
  .set(updateData)
  .where(eq(dailyEntries.id, existing.id));
```

**Problema:** El schema `AutoSaveBizFieldSchema` valida que `field` sea string non-empty, pero NO valida que sea un campo permitido. Un atacante podría enviar `field: "userId"` o `field: "createdAt"`.

**Acción requerida:** Whitelist de campos permitidos:
```typescript
const ALLOWED_FIELDS = ['bizProspectCompleted', 'bizFollowUpCompleted', ...];
if (!ALLOWED_FIELDS.includes(field)) return { success: false, error: 'Campo no permitido' };
```

---

### 5. Posible Crash por JSON.parse de Null/Undefined [ALTO]

**Archivo:** `src/app/page.tsx`

```typescript
// Línea 68-70
const prepTomorrowTasks: string[] = yesterdayEntry?.prepTomorrowJson
  ? JSON.parse(yesterdayEntry.prepTomorrowJson)  // Si es "null" string, crash
  : [];

// Línea 159-165
const parsed = JSON.parse(todayEntry.bizActionsSpecific);  // Sin verificación null
```

**Problema:** Si `prepTomorrowJson` o `bizActionsSpecific` es la string `"null"` o `""`, `JSON.parse()` lanza error.

**Acción requerida:** Verificar antes de parsear:
```typescript
const prepTomorrowTasks: string[] = yesterdayEntry?.prepTomorrowJson
  ? JSON.parse(yesterdayEntry.prepTomorrowJson || '[]')
  : [];
```

---

### 6. Zod Schema Usa `z.any()` en Múltiples Campos [ALTO]

**Archivo:** `src/lib/validations.ts`

```typescript
// Líneas 59-60, 81, 110, 343, 367-368
autoeducation: z.any().nullable().optional(),
implementationIntentions: z.any().nullable().optional(),
achievementsTop3: z.any().nullable().optional(),
prepTomorrow: z.any().nullable().optional(),
smartObjectives: z.any().nullable().optional(),
actionsPlan: z.any().nullable().optional(),
tasks: z.any().optional(),
```

**Problema:** `z.any()` acepta cualquier cosa, defeats el propósito de la validación. Campos JSON que acepta el diario deben tener schemas específicos.

**Acción requerida:** Definir schemas Zod apropiados para cada campo.

---

## MEDIO — Calidad

### 7. Rate Limiting Grave Si DB Falla [MEDIO]

**Archivo:** `src/lib/rate-limit.ts` líneas 34-36

```typescript
} catch (error) {
  console.error('[RATE-LIMIT] Error accessing Turso:', error);
  return { success: true, remaining: limit, resetMs: windowMs };  // ← Permitir todo en error
}
```

**Problema:** Si la DB falla, se permite TODO el tráfico sin rate limit (retorna `success: true`).

**Acción requerida:** En caso de error de DB, denegar o usar failover a memoria local.

---

### 8. `register/route.ts` No Valida Nombre ni Email [MEDIO]

**Archivo:** `src/app/api/register/route.ts` líneas 17-19

```typescript
if (!name || !email || !password) {
  return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
}
```

**Problema:** No valida formato de email ni longitud mínima de password (la UI sugiere "Mínimo 6 caracteres" pero no se valida en server).

**Acción requerida:** Agregar validación de formato.

---

### 9. Constantes Demo en Constants.ts Expuestas [MEDIO]

**Archivo:** `src/lib/constants.ts`

```typescript
export const DEMO_USER_PASSWORD_HASH = '7d2143c548907019260ce52552eab73d...';
```

**Problema:** El hash de la password demo está en código fuente. Si alguien crea una cuenta con ese hash (o si el hash es reversible), podría usar la cuenta demo.

**Acción requerida:** No hardcodear hashes de producción.

---

### 10. No Hay Tests de Integración para Server Actions [MEDIO]

Solo existen tests unitarios para `validations.test.ts` y `habit-strength.test.ts`. No hay tests para:
- Server actions (auth, daily-journal, business)
- API routes
- Permisos RBAC

---

### 11. `useAutosave` Mock No Persiste Datos [MEDIO]

**Archivo:** `src/app/journal/JournalForm.tsx` líneas 110-113

```typescript
const mockSave = useCallback(async (data: Record<string, unknown>) => {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Autosave] Borrador guardado:', data);  // ← Solo log, no persiste
}, []);
```

**Problema:** El autosave está desconectado (mockeado), no persiste drafts entre sesiones.

**Nota:** Parece intencional para MVP pero debe implementarse antes de producción.

---

## BAJO — Notas

### 12. ESLint No Configurado

El proyecto no tiene ESLint configurado (solo se ejecuta `next lint` pero sin config). Recomendable agregar `.eslintrc.json` con reglas strict.

### 13. `getRandomVerse` Carga TODOS los Versículos a Memoria [BAJO]

**Archivo:** `src/app/actions/bible.ts` línea 10

```typescript
const list = await db.select().from(bibleVerses);  // Sin LIMIT
```

Si la tabla crece, esto traería todos los registros. Usar `LIMIT` o filtrar en DB.

---

## Hallazgos Positivos

1. **TypeScript limpio** — `tsc --noEmit` sin errores
2. **Tests passing** — 55/55 tests pasando
3. **Middleware bien estructurado** — Auth con NextAuth, callbacks JWT correctos
4. **Zod validation en la mayoría de inputs** — Buena práctica
5. **Separación de concerns** — actions, components, pages bien organizados
6. **RAG implementation** — Bien pensada con fallbacks a múltiples providers
7. **Rate limiting presente** — 5 requests/min en smart-entry
8. **No SQL injection** — Uso de Drizzle ORM con parameterized queries

---

## Priorización de Fixes

| Prioridad | Issue | Tiempo estimado |
|-----------|-------|----------------|
| P0 | Rotar API keys y mover a secrets manager | 30 min |
| P0 | Fix `/api/admin/level` sin verificación admin | 5 min |
| P0 | Salt de password hardcodeado | 30 min |
| P1 | Whitelist campos `autoSaveBizField` | 15 min |
| P1 | Fix `JSON.parse` de null/undefined | 10 min |
| P2 | Reemplazar `z.any()` con schemas específicos | 2 hr |
| P2 | Rate limit fail-closed | 15 min |
| P2 | Validación registro email/password | 10 min |
| P3 | Tests de integración | 4+ hr |
| P3 | ESLint config | 30 min |
