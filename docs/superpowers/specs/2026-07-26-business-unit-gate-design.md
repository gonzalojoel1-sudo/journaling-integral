# Spec: Business Unit Creation Gate + Enhanced Unit Form

## Context

Currently the Centro de Mando (business dashboard) is accessible even without any business units, and the "create unit" functionality is hidden behind a small gear icon. Business units only have: name, default sale price, and cost.

**Goal**: Make business unit creation a prerequisite for entering the panel, and enrich the unit form with more useful fields.

## Changes

### 1. Schema Enhancement (`business_settings` table)

Add 3 new columns to `businessSettings`:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `category` | text | 'Servicio' | Enum: Servicio, Producto, Curso, Mentoría |
| `monthlyGoal` | real | 0 | Target monthly revenue in $ |
| `isRecurring` | integer | 0 | 1 = recurring revenue (subscriptions/retreats) |

Migration needed.

### 2. CentroMandoDashboard Gate

In `CentroMandoDashboard`, check `settingsList.length === 0`:

- **If 0 units**: Render a full-page "primer paso" component (`CreateFirstUnitGate`) instead of the dashboard. This gate has:
  - Title: "Crea tu primera unidad de negocio"
  - Subtitle: "Define qué vendes para empezar a trackear tu negocio"
  - The enhanced unit creation form (inline, no modal)
  - After creation → refresh → show full dashboard

- **If > 0 units**: Show normal dashboard with prominent "CREAR UNIDAD DE NEGOCIO" button replacing the gear icon

### 3. Header Button: "CREAR UNIDAD DE NEGOCIO"

In `CentroMandoDashboard` header, replace `BusinessSettings` icon button with:

```
[CREAR UNIDAD DE NEGOCIO] button
```

- Large, prominent, green gradient button (like "Iniciar Registro Diario" on dashboard)
- Opens the `BusinessSettingsModal` with `showNew=true` by default (creating new unit)

Also keep a smaller settings icon for managing existing units.

### 4. Enhanced BusinessSettingsModal

New unit form fields (when `showNew=true`):

| Field | Type | Placeholder |
|-------|------|-------------|
| Nombre | text | "Ej. Sesión de Coaching" |
| Categoría | select | "Tipo de unidad" |
| Precio de venta ($) | number | "Monto por venta" |
| Costo ($) | number | "Costo del servicio" |
| Meta mensual ($) | number | "Ingreso objetivo mensual" |
| ¿Es recurrente? | toggle | "Genera ingresos mensuales/recurrentes" |

For existing units: show all fields with save button per unit.

**Category options**: Servicio, Producto, Curso, Mentoría

**IsRecurring** toggle: When ON, indicates the unit generates recurring/subscription revenue. Shown in breakdown with a small badge.

### 5. UnitPerformanceBreakdown Updates

- Show category badge next to unit name (e.g., "Curso", "Mentoría")
- Show recurring indicator (small icon/badge) if `isRecurring === 1`
- If `monthlyGoal > 0`, show progress bar: `currentMonthIncome / monthlyGoal * 100%`

### 6. Data Flow

- `page.tsx` fetches all settings and passes to `CentroMandoDashboard`
- `CentroMandoDashboard` computes `hasUnits = settingsList.length > 0`
- Gate renders `CreateFirstUnitGate` if no units
- `BusinessSettingsModal` handles upsert with new fields
- After first creation, `router.refresh()` makes settings available

## Files to Modify

1. `src/db/schema.ts` — add 3 columns
2. `src/components/business/BusinessSettingsModal.tsx` — add 3 new fields
3. `src/components/business/UnitPerformanceBreakdown.tsx` — show category/recurring badges
4. `src/app/negocio/CentroMandoDashboard.tsx` — add gate logic + new header button
5. `src/app/actions/business.ts` — update upsertBusinessSetting action
6. `drizzle.config.ts` or manual migration for schema change

## Files to Create

1. `src/components/business/CreateFirstUnitGate.tsx` — full-page gate component
