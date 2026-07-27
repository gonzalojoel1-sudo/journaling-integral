# Debug: CreateFirstUnitGate se queda en "Creando..." para siempre

## Estado actual

**Síntoma:** Al crear primera unidad de negocio desde `CreateFirstUnitGate`, el botón queda en "Creando..." infinitamente. No redirige, no crea nada, no hay mensaje de error visible.

## Lo que sabemos

- El fix anterior (`router.push('/negocio')` después de `result.success`) no funcionó
- Las variables de entorno de Turso YA están configuradas en Vercel (usuario confirmó)
- El usuario YA ejecutó `drizzle-kit push` hace días
- El flujo funcionaba antes de la última actualización de git
- El build en Vercel usa `next build` (no corre migraciones automáticamente)

## Commits relevantes en main

```
8de15c1 debug: agregar logs de diagnóstico al crear unidad de negocio  ← ÚLTIMO
f0397eb fix(business): redirigir a /negocio tras crear primera unidad
47d7918 fix(business): type fixes - validation schema, interfaces, userId nullable
5b0ba99 feat(business): show category/recurring badges + monthly goal progress
e57034b feat(business): unit creation gate + prominent CTA
cfdd759 feat(business): CreateFirstUnitGate full-page component
6251608 feat(business): category, monthlyGoal, isRecurring en unit form
ccff224 feat(business): upsertBusinessSetting accepts new fields
e284acf feat(business): add category, monthlyGoal, isRecurring to businessSettings
```

## Flujo de datos

```
CreateFirstUnitGate.tsx
  └── handleCreate() → upsertBusinessSetting()
                        ├── validate(UpsertBusinessSettingSchema)
                        ├── getCurrentUserId()
                        ├── db.insert(businessSettings).values(...).onConflictDoUpdate()
                        ├── revalidatePath('/negocio')
                        └── return { success: true }

Si success → router.replace('/negocio')
Si no → setSaving(false) (queda en "Creando...")
```

## Archivos clave

- `src/components/business/CreateFirstUnitGate.tsx` — UI del gate, handleCreate()
- `src/app/actions/business.ts` — upsertBusinessSetting() server action
- `src/lib/validations.ts:258` — UpsertBusinessSettingSchema
- `src/db/schema.ts:343` — businessSettings table definition
- `drizzle/0003_add_business_settings_columns.sql` — migración de las 3 columnas nuevas

## Logs agregados (para capturar en Vercel Logs)

```
[GATE] Creating unit: { name, category, saleAmount, cost, monthlyGoal, isRecurring }
[GATE] Result: { success, error? }
[GATE] Server returned error: ...
[GATE] Client exception: ...
[SETTINGS] Validation failed: ...
[SETTINGS] Creating/updating: { userId, data }
[SETTINGS] Insert result: ...
[SETTINGS] Error: ...
```

## Próximo paso

1. Capturar los logs de Vercel Runtime Logs después de intentar crear unidad
2. Identificar en qué punto del flujo se corta:
   - ¿No llega nunca al server? → problema de red/cliente
   - ¿Llega pero falla validación? → schema no matchea
   - ¿Llega y pasa validación pero falla DB? → credenciales o schema
   - ¿DB responde pero algo falla después? → race condition o revalidatePath

## Cosas que NO son el problema (ya descartadas)

- Variables de entorno no configuradas en Vercel
- Falta de `await` en rateLimit (era otro archivo)
- Falta de redirect post-creación (se agregó)
- Schema de validación mal definido (validaba correctamente)
