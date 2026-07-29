# Spec: Filtro por Rango de Fechas en History

## 1. Concepto & Visión

La pantalla "Bitácora de Legado" (History) actualmente muestra los últimos 30 días de entradas de forma hardcodeada. Este feature agrega un filtro por rango de fechas para que el usuario pueda explorar devocionales de cualquier periodo — un mes específico, los últimos 3 meses, o un rango personalizado.

El filtro es visible, accesible, y la transición entre rangos es fluida sin recargar la página.

---

## 2. Arquitectura

### Data Flow

```
URL (?from=&to=)          HistoryPage (server)
       │                        │
       │                  passes to HistoryClient
       │                        │
       ▼                        ▼
getAnalyticsDataByRange   DateRangeFilter
(from, to)                     │
   │                           │ onFilterChange
   │◄──────────────────────────┘
   │
   ▼
db.query.dailyEntries.findMany({
  where: and(gte(date, from), lte(date, to)),
  orderBy: desc(date),
})
```

### Server Action

```typescript
// src/app/actions/daily-journal.ts

export async function getAnalyticsDataByRange(from: string, to: string) {
  // from/to: "YYYY-MM-DD" ISO date strings
  // Returns: { success: true, entries: DailyEntry[] } | { success: false, error: string }
}
```

### URL as State

- `HistoryPage` es un **Server Component** que lee `searchParams.from` y `searchParams.to`
- Los valores se pasan como props a `HistoryClient`
- Cuando el usuario cambia el filtro, se navega a la URL con los nuevos params (`router.push`)
- Esto hace el filtro shareable via URL (podes mandar link a un mes específico)

### Initial Load (Server)

- `HistoryPage` calcula `from/to` de los searchParams
- Si no hay params, usa `to = today`, `from = today - 30 days`
- Pasa `initialEntries` a `HistoryClient` (renderizado server-side de la primera query)

---

## 3. UI del Filtro — DateRangeFilter

### Preset Buttons (row of pill buttons)

| Label | Range |
|-------|-------|
| Últimos 30 días | today - 30d → today |
| Este mes | 1st of current month → today |
| Mes anterior | 1st of prev month → last day of prev month |
| Últimos 3 meses | today - 90d → today |
| Personalizado | (reveals date pickers) |

- El button activo tiene estilo distinctivo (filled bg, ring, etc.)
- Default: "Últimos 30 días"

### Custom Range (revealed on "Personalizado" click)

- Two `<input type="date">` side by side: "Desde" y "Hasta"
- Validación: `from <= to`, no fechas futuras
- Botón "Aplicar" explícito

### Layout en HistoryClient

```
┌─────────────────────────────────────┐
│ Bitácora de Legado                   │
│ Filtro: [30d] [Mes] [Prev] [3m] [✕] │
│ (si personalizado: [Desde] → [Hasta])│
├─────────────────────────────────────┤
│ Timeline scrollable                  │
│ ...entries...                        │
└─────────────────────────────────────┘
```

---

## 4. Cambios en Código

### src/app/actions/daily-journal.ts

- Crear `getAnalyticsDataByRange(from: string, to: string)`
- `getAnalyticsData` (existente) se mantiene por ahora para no romper otros consumers

### src/app/history/page.tsx

- Leer `searchParams.from` y `searchParams.to`
- Calcular defaults si no existen
- Llamar `getAnalyticsDataByRange` en vez de `getAnalyticsData`
- Pasar `initialEntries` + `initialFrom` + `initialTo` a `HistoryClient`

### src/app/history/HistoryClient.tsx

- Nuevos props: `initialFrom: string`, `initialTo: string`
- Agregar estado local `entries`, `from`, `to`
- Crear subcomponente `<DateRangeFilter>` con presets + date pickers
- `handleFilterChange(from, to)`: router.push con nuevos params
- Mostrar `entries` del estado local (no `initialEntries`)

---

## 5. Edge Cases

| Case | Behavior |
|------|----------|
| Rango sin resultados | Mostrar mensaje: "No hay entradas para este periodo" |
| `from > to` | Invalidar, no hacer query |
| Fechas futuras | No permitir, el picker de fecha no debería aceptarlas (`max` attr) |
| Primera carga sin params | Defaults: last 30 days |
| Rango muy largo (>365d) | Permitir pero sin warning (el query traería muchos rows) |

---

## 6. Out of Scope

- No se toca Review, Admin Users, Challenges, Habits
- No se cambia el diseño visual del timeline existente
- No se agrega paginación offset/limit (solo filtro por rango)
