# Habit Type Mechanics — Interactive Experiences per Type

## Problem

Today each `habitType` is purely cosmetic: different icon, color, and displayed fields, but identical tracking mechanics (strength decay formula, flat check, same UX). Users have no reason to choose one type over another beyond labeling. The power of the type system is unrealized.

## Goal

Give each habit type a **unique interactive mechanic** that changes how the user experiences, tracks, and completes that habit. Types become genuine gameplay/dopamine systems — not tags.

## Design Principles

1. **No mechanics for the sake of it** — each mechanic must be the natural expression of that type's behavioral science framework
2. **In-place interaction** — all mechanics live inside expandable habit cards in the existing /habits page. No separate routes.
3. **Progressive complexity** — the compact card shows the mechanic's essence. Expanded card reveals full interaction.
4. **Data layer extensions** — each type may need 1-2 new columns or tables. No schema overhaul.

---

## Type Mechanics

### 1. Sembrar 🌱 — Evolution Cycles

**Framework:** Tiny Habits (BJ Fogg) — celebrate tiny wins, then systematically level up.

**Compact card:**
- Habit name + "Level X" badge
- Thin progress bar: `daysInCurrentCycle / 15`
- Shows current Optimal action and Minimum (rescue) action

**Expanded card:**
```
Camino a la Evolución: 7/15 días

⚡ Óptimo:  [current activeAction]
🌱 Mínimo:  [current rescueAction]

[████████░░░░░░░░░] 7/15
```

**Evolution trigger (day 15 completes):**
- Bar glows intensely, confetti/destello effect
- Premium card overlay:
  > *"¡Has dominado este nivel! 🌱✨ Llevas 15 días demostrando quién eres. ¿Quieres subir un escalón o mantener el ritmo actual?"*
  > [Mantener ritmo] [Mejorar hábito]
- "Mejorar hábito" → inline editor with current values pre-filled:
  - Nueva versión óptima: `[_____]`
  - Nueva versión mínima: `[_____]`
- On save: cycle counter resets to 0/15. `currentStrength`, `lastStrengthDate`, and check-in history preserved.

**Data changes:**
- New column `habits.evolutionCycle` (integer, default 0) — current cycle number
- New column `habits.daysInCurrentCycle` (integer, default 0) — days completed this cycle
- New column `habits.evolutionOptimal` (text) — the current "optimal" level action (evolves from activeAction)
- New column `habits.evolutionMinimum` (text) — current minimum action (evolves from rescueAction)

**Journal integration:**
- On submitDailyEntry, if completed → increment `daysInCurrentCycle` (cap at 15)
- If `daysInCurrentCycle ≥ 15` → mark cycle complete, do NOT auto-reset (user decides via UI)

---

### 2. Cadena ⛓️ — Sequential Chain

**Framework:** Habit Stacking (Clear) + behavioral chaining.

**Compact card:**
- Gray/opaque block: "Rutina de Enfoque AM" with single holistic "Complete" check
- Shows step count: "3 pasos"

**Design rationale (BJ Fogg — Tiny Habits):**
Una cadena de comportamientos necesita un **Ancla** — un evento diario existente que dispare el inicio de la cadena. Sin ancla, el cerebro olvida iniciar el Paso 1.

**Expanded card:**
```
⛓️ Rutina de Enfoque AM

┌─────────────────────────────┐
│ 🔴 ANCLA: Sentarme en el    │
│     escritorio con mi café   │
└─────────────────────────────┘
              │
       🟢 1. Tomar un vaso de agua     [✓]
              │ ✦ (illuminated)
       ⚪ 2. Leer un proverbio          [ ]
              │
       ⚪ 3. Anotar una reflexión       [ ]
```

- First element is the **Ancla** — a fixed, non-interactive block at the top. This is where the chain "hangs" from.
- Each step is a mini-checkbox connected by a vertical line hanging from the anchor.
- Each tick illuminates the connecting line segment.
- Last tick → chain container "lights up" (neon glow). State changes to Completed.
- Progress: "2/3 pasos"

**Creation:**
- Modified wizard or inline creator: enter chain name, then add N steps (name only, no full habit creation)
- Steps are inline items stored in `chain_items`, NOT habits. Simpler data model.

**Data changes:**
- Existing `chains` + `chain_items` tables reused
- `chain_items` may gain a `completedToday` column tracked per-day via JSON in daily_habits_json
- Alternative: chain completion stored as `chainProgressJson` in daily entry

**Journal integration:**
- `daily_habits_json` includes `chainId` + `completedStepIds[]` + `chainCompleted: boolean`
- SubmitDailyEntry logs per-step completion
- Chain only marked complete when ALL steps checked

---

### 3. Crecer ⚡ — Momentum Streak with Shield

**Framework:** Atomic Habits (Clear) — habit stacking + identity reinforcement. James Clear's "Never miss twice" rule.

**Design rationale (James Clear / Psicología Conductual):**
Las rachas puras generan el **Efecto de Violación de Abstinencia**: perder una racha larga activa "ya lo arruiné todo, mejor abandono". Para proteger la identidad del usuario, se añade un **Escudo de Racha** (Grace Period).

**Compact card:**
- Name + anchor text: "Después del café ☕"
- Flame icon with streak count: `🔥 12`
- Shield icons if any: `🛡️🛡️` (max 2)

**Expanded card:**
```
⚡ Crecer: [habit name]

🔗 Anclado a: [anchor]
🔥 Racha: 12 días consecutivos
🛡️ Escudos: 2 disponibles

  [████████████░░░░] 12/30 → 👑 a los 30
```

**Streak Shield mechanic:**
- Every **7 consecutive days** → user earns **1 Escudo** (max 2 accumulated)
- If user misses a day → Escudo is consumed automatically. Streak **freezes** (doesn't advance, doesn't reset to 0).
- If user misses with 0 Escudos → streak resets to 0 normally.
- Escudos can only be earned by consecutive days, not purchased or granted.
- Streak tiers purely visual (flame grows):
  - 7 días → 🔥
  - 14 días → 🔥🔥
  - 21 días → 🔥🔥🔥
  - 30 días → 👑

**Data changes:**
- New column `habits.streakShields` (integer, default 0) — current shields (0-2)
- New column `habits.currentStreak` (integer, default 0) — frozen streak value (separate from strength)

---

### 4. Cambiar 🔄 — New Neural Path Builder

**Framework:** Power of Habit (Duhigg) + Dr. Judson Brewer — replace the routine, keep cue and reward. **100% positive reinforcement. No shaming.**

**Design rationale (Dr. Judson Brewer / neuroplasticidad):**
Castigar al usuario mostrando cómo su mal hábito "está ganando" genera cortisol y vergüenza — el mismo disparador que empuja al cerebro a buscar consuelo en ese mal hábito. Por la Ley de Hebb, los circuitos que no se usan se debilitan solos. La interfaz solo mide y celebra la construcción de la **Nueva Ruta Neuronal**. Si el usuario cae, simplemente no suma puntos ese día. Sin barras del "monstruo", sin métrica de fallos.

**Compact card:**
- Single bar: "🏆 Nueva Ruta: 12/30 victorias" (progreso de la nueva conducta solamente)
- Shows: "Sustituyendo: [newRoutine]"

**Expanded card:**
```
🔄 Construyendo nueva ruta neuronal

🧠 Nuevo camino: [newRoutine]
   Victorias: [████████░░░░] 12/30

→ Has elegido tu nueva identidad 12 veces
```

**Mechanic:**
- Each day the journal asks: "¿Apareció la tentación de [oldRoutine]?" (Sí/No)
  - If Sí: "¿Elegiste [newRoutine]?" → Yes = victory (+1). No = simply 0. No penalty, no counter-display.
  - If No: no change. No decay applied.
- Focus entirely on the **new path**. The old one is invisible — no bar, no counter, no visual presence.
- At 30 victories → "¡Has construido una nueva ruta neuronal! 🧠✨" Offer to archive or convert to Crecer.

**Creation (wizard):**
1. User says "Quiero DEJAR de hacer X" → system prompts for the old routine details
2. User says "En su lugar haré Y" → system creates the new Cambiar habit
3. Old habit stored as metadata on the Cambiar habit (not a separate habit entity)
4. Fields: `oldRoutine`, `newRoutine`, `cue` (trigger), `victoryCount`, `temptationCount`

**Data changes:**
- New columns on `habits`:
  - `victoryCount` (integer, default 0) — successful substitutions (only this is displayed)
  - `temptationCount` (integer, default 0) — times temptation appeared (internal metric)
- Victory target default 30.

---

### 5. Preciso 🎯 — One-Click Execution

**Framework:** Implementation Intentions (Gollwitzer) — "When X happens, I will do Y".

**Design rationale (UX de fricción cero):**
Un diario debe requerir la menor cantidad de inputs posibles. Un flujo de dos pasos (¿ocurrió trigger? → ¿hiciste acción?) fatiga la toma de decisiones. Se fusiona en un solo check inteligente.

**Compact card:**
- "Cuando [trigger] → [action]"
- Execution rate: "80%"

**Expanded card:**
```
🎯 Cuando [ifTrigger] → entonces [ifAction]

[🧠 El disparador ocurrió y ejecuté mi plan] ← único botón

📊 Ejecución: 80%
   Se presentó: 10/12 días
   Ejecutado:    8/10 veces
```

**Interaction:**
- Single smart button: **"El disparador ocurrió y ejecuté mi plan"** — one click handles both conditions.
- If trigger didn't occur today → user simply ignores the habit. System applies **no decay** (it's not a failure, trigger simply wasn't present).
- Only counts toward strength when the button is clicked (trigger occurred + action executed).
- Expanded card shows historical execution rate without requiring extra clicks.

**Data changes:**
- New column `habits.triggerHitCount` (integer) — times trigger occurred
- New column `habits.actionExecutedCount` (integer) — times action was done

---

### 6. Pilar 🏛️ — Keystone Effect

**Framework:** Keystone Habits (Duhigg) — habits that create cascading positive effects across other habits.

**Compact card:**
- Name + "🏛️ Clave" badge
- "Influye en 4 hábitos" — count of connected habits

**Expanded card:**
```
🏛️ Hábito Clave: [name]

⚡ Efecto dominó activo hoy:
  • [hábito A] — impulsado
  • [hábito B] — impulsado
  • [hábito C] — impulsado

Al completar hoy, fortaleciste:
  [███████░░░] +8% a dominio [domain]
```

**Mechanic (simple version):**
- When a Pilar is completed, ALL other active habits in the SAME domain get a small strength bonus (+0.1)
- The expanded card shows which habits were boosted today
- No additional user action needed — purely emergent

**Data changes:**
- None. Pilar bonus applied at submitDailyEntry time via query.
- The bonus is ephemeral (applied only on completion day, not persisted as strength).

---

## Schema Changes Summary

| Column | Type | Applies To |
|--------|------|------------|
| `evolutionCycle` | integer, default 0 | Sembrar |
| `daysInCurrentCycle` | integer, default 0 | Sembrar |
| `evolutionOptimal` | text | Sembrar |
| `evolutionMinimum` | text | Sembrar |
| `streakShields` | integer, default 0 (max 2) | Crecer |
| `currentStreak` | integer, default 0 | Crecer |
| `victoryCount` | integer, default 0 | Cambiar |
| `temptationCount` | integer, default 0 | Cambiar |
| `triggerHitCount` | integer, default 0 | Preciso |
| `actionExecutedCount` | integer, default 0 | Preciso |

No new columns needed for Cadena or Pilar.

## UI Component Structure

```
src/app/habits/
  habitCards.tsx              ← Existing. Routes to type-specific renderer.
  cards/
    HabitCardCrecer.tsx       ← Momentum streak flame
    HabitCardSembrar.tsx      ← Evolution bar + upgrade modal
    HabitCardCambiar.tsx      ← Battle bars + temptation log
    HabitCardPreciso.tsx      ← If-then two-step logger
    HabitCardPilar.tsx        ← Keystone effect display
    HabitCardCadena.tsx       ← Sequential step list with progress line
```

Journal integration:
```
src/app/journal/
  steps/
    StepDevocional.tsx        ← Modified to show type-specific check UIs
```

## Implementation Order

1. **Sembrar** — highest impact, user already designed
2. **Cadena** — tables already exist, needs UI + anchor
3. **Crecer** — streak shield logic + data columns
4. **Cambiar** — positive-only substitution + wizard changes
5. **Preciso** — single-click smart button
6. **Pilar** — keystone bonus logic (simplest backend)
