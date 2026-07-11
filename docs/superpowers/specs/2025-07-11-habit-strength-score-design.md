# Especificacion: Puntuacion de Fuerza para Habitos

## Resumen

Sistema de puntuacion de fuerza para habitos con formula de decaimiento exponencial `Nueva Fuerza = (Fuerza Anterior * 0.90^n) + (Completado ? 1.0 : 0.0)`. Enfoque hibrido: escritura al enviar diario + lectura en tiempo real para UI.

## 1. Schema de Base de Datos

Modificar tabla `habits` en `src/db/schema.ts`:

| Columna | Tipo | Default | Descripcion |
|---|---|---|---|
| `currentStrength` | `real` | `0.0` | Fuerza acumulada (rango 0-~10) |
| `lastStrengthDate` | `text` (nullable) | `null` | Fecha ultimo calculo (YYYY-MM-DD) |

Los habitos nuevos arrancan en 0.0 con `lastStrengthDate = null`.

## 2. Logica de Calculo

### Archivo: `src/lib/habit-strength.ts`

Funciones puras compartidas:

```typescript
applyDecayAndBonus(
  currentStrength: number,
  lastStrengthDate: string | null,
  todayStr: string,
  completedToday: boolean
): { newStrength: number; newDate: string }
```
- `n = dias desde lastStrengthDate hasta hoy` (0 si es mismo dia o null)
- `strength = currentStrength * 0.90^n`
- Si `completedToday`: `strength += 1.0`
- Redondea a 2 decimales

```typescript
getRealTimeStrength(
  currentStrength: number,
  lastStrengthDate: string | null
): number
```
- Solo aplica decaimiento `0.90^n` sin bonus (para UI sin submit nuevo)

### Detalle del decaimiento:
```
Dia 0: 1.0, Dia 1: 0.9, Dia 2: 0.81, Dia 3: 0.73, Dia 5: 0.59, Dia 7: 0.48
```
- Convergencia al equilibrio en 10.0 (cuando `s = 0.9s + 1`)
- Si `completedToday = false`, la fuerza decae 10% por dia

## 3. Integracion en submitDailyEntry

En `src/app/actions/daily-journal.ts`, al final de `submitDailyEntry`, despues de guardar la entrada:
1. Parsea `formData.dailyHabits` (si existe)
2. Itera sobre cada habito del JSON
3. Lee `currentStrength` y `lastStrengthDate` actuales de la BD
4. Llama `applyDecayAndBonus(...)` con `completed = habit.completed`
5. Actualiza las 2 columnas con `db.update(habits).set({...}).where(...)`

Los habitos activos que NO aparecen en `dailyHabits` (porque se crearon despues de cargar la pagina) se ignoran en este ciclo.

## 4. UI - Componente StrengthBar

### Archivo: `src/components/StrengthBar.tsx`

Componente reutilizable minimalista:

- **Props**: `strength: number` (0-10), `className?: string`
- **Render**: `<div>` de 2px de alto con ancho `(strength / 10) * 100%` (max 100%)
- **Paleta metalica/silver**:
  - 0-2: `bg-zinc-400/30`
  - 2-5: `bg-zinc-500` a `bg-slate-400` (gradiente sutil)
  - 5-8: `bg-slate-500` con shimmer/brillo
  - 8+: `bg-zinc-300` con efecto glow sutil
- Sin texto, sin numeros, sin etiquetas

### Integracion en HabitProgress.tsx (Dashboard)

Debajo del nombre de cada habito, entre el nombre y el checkbox, insertar `<StrengthBar strength={strength} />`. Pasar `strength` como propiedad en la interfaz `Habit`.

### Integracion en HabitsClient.tsx (Pagina de Habitos)

En cada tarjeta de habito (columnas Estandarizar/Optimizar/Reemplazar), debajo del nombre y arriba de la estrategia, insertar `<StrengthBar />`.

## 5. Archivos a modificar/crear

| Archivo | Accion |
|---|---|
| `src/lib/habit-strength.ts` | **CREAR** - funciones de calculo |
| `src/components/StrengthBar.tsx` | **CREAR** - componente UI |
| `src/db/schema.ts` | **MODIFICAR** - agregar 2 columnas a habits |
| `src/app/actions/habits.ts` | **MODIFICAR** - devolver strength en queries, inicializar en createHabit |
| `src/app/actions/daily-journal.ts` | **MODIFICAR** - integrar calculo en submitDailyEntry |
| `src/app/dashboard/HabitProgress.tsx` | **MODIFICAR** - agregar StrengthBar |
| `src/app/habits/HabitsClient.tsx` | **MODIFICAR** - agregar StrengthBar |
| `src/app/habits/page.tsx` | **MODIFICAR** - pasar strength al cliente |
| `src/app/page.tsx` | **MODIFICAR** - pasar strength al HabitProgress |

## 6. Migracion de BD

Se ejecuta `npm run db:push` para aplicar el schema actualizado. Esto agrega las 2 columnas con defaults. No se requieren migraciones manuales. Datos existentes: todos los habitos arrancan con `currentStrength = 0.0` y `lastStrengthDate = null`.

## 7. Consideraciones

- La fuerza maxima teorica es 10.0 (equilibrio matematico con la formula dada)
- Habitos recien creados: fuerza 0 hasta su primer submit
- Si un habito se completa consistentemente: se estabiliza en ~8-9.5
- Si se abandona por 30 dias: la fuerza cae a ~0.04 (practicamente 0)
- No se hace update de fuerza para habitos que no aparecen en `dailyHabits` del submit actual
