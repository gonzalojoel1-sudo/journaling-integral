# Habit Engine — Unified Habit System Design

## Problem

The current habit system has two competing classification systems:
- **EOR** (ESTANDARIZAR, OPTIMIZAR, REEMPLAZAR) used in UI
- **Domain enum** (personal, negocio, fe, cuerpo, mente, relaciones) used in Zod validation

They are incompatible, causing validation failures. Neither captures the full depth of habit formation science.

## Goal

Build a unified "Habit Engine" that:
1. Integrates the best frameworks from habit science literature (Atomic Habits, Tiny Habits, Power of Habit, Implementation Intentions)
2. Provides unique UX per type (different creation flows, visualization, tracking)
3. Hides complexity from new users via a guided wizard
4. Works regardless of user motivation — the system sustains the user, not the other way around

## Architecture

### Two Dimensions: Type (estrategia) + Domain (área de vida)

**Domain** — tags that categorize habits by life area. Visible as optional 1-tap selector, never mandatory. They enable: radar de vida, IA contextual, challenges por área, análisis predictivo.

**Type** — defines the framework, UX, creation flow, and tracking behavior. Selected by the system during the guided wizard, or explicitly by experienced users.

### Types (6)

| Ícono | Nombre | Framework | Propósito | UX única |
|---|---|---|---|---|
| ⚡ | Crecer | Atomic Habits (Clear) | Crear hábito nuevo desde cero | Stacking + 2-min rule + strength + identidad |
| 🌱 | Sembrar | Tiny Habits (Fogg) | Hábito mínimoviable + celebración | Anchor→Action→Celebration wizard, celebración obligatoria |
| 🔄 | Cambiar | Power of Habit (Duhigg) | Reemplazar mal hábito | Cue audit → swap routine → reward matching |
| 🎯 | Preciso | Implementation Intentions (Gollwitzer) | Plan condicional exacto | If-Then: "Cuando X, entonces Y" |
| 🏛️ | Pilar | Keystone (Duhigg) | Hábito con efecto cascada | Badge especial + tracking de impacto secundario |
| ⛓️ | Cadena | Habit Stacking (Clear) | Conectar hábitos en rutina | No es un tipo raíz — es una relación entre hábitos |

### Cadena como Relación (NO como tipo)

Crítico: ⛓️ Cadena NO es un tipo de hábito. Es una secuencia de N hábitos individuales (Crecer, Sembrar, Pilar) que se ejecutan uno detrás de otro.

**Tablas:**
- `chains`: id, name, userId, createdAt
- `chain_items`: id, chainId, habitId (FK), order (1, 2, 3...)
- `habits.nextHabitId`: opcional, apunta al siguiente hábito en la cadena

### Domains (7)

Cuerpo, Mente, Trabajo/Propósito, Relaciones, Hogar/Orden, Espiritualidad, Finanzas

## Database Schema (habits table)

```sql
habits {
  // Core
  id: text PK
  userId: text FK → users
  name: text                           // "Ejercicio matutino" (pantalla 1)
  type: enum (crecer|sembrar|cambiar|preciso|pilar)
  domain: enum (cuerpo|mente|trabajo|relaciones|hogar|espiritual|finanzas)

  // Action system (critical separation)
  rescueAction: text                   // "1 sentadilla" (pantalla 5)
  activeAction: text                   // empieza = rescueAction, puede escalar

  // Celebration
  celebration: text                    // user-chosen or default per type

  // Type-specific fields (only populated for relevant type)
  // Crecer, Sembrar:
  anchor: text                         // "Después de [X]"
  // Preciso:
  ifTrigger: text                      // "Cuando [situación]"
  ifAction: text                       // "entonces [acción]"
  // Cambiar:
  cue: text                            // disparador actual
  oldRoutine: text                     // rutina a reemplazar
  newRoutine: text                     // nueva rutina

  // Strength & tracking
  currentStrength: real default 0.0
  lastStrengthDate: text

  // Chain relationship
  belongsToChainId: text FK? → chains
  nextHabitId: text FK? → habits

  // Soft delete
  isActive: integer default 1
  createdAt: text
}
```

## Default Celebrations per Type

| Type | Default celebration |
|---|---|
| Crecer | "✅ Hecho" |
| Sembrar | User-chosen (required in wizard) |
| Cambiar | "🔄 Avance" |
| Preciso | "🎯 Ejecutado" |
| Pilar | "🏛️ Un paso más" |

## Guided Wizard (New User)

7 screens, no type names exposed:

1. "¿Qué hábito quieres crear o cambiar?" → free text → `name`
2. "¿Esto es algo que quieres EMPEZAR o DEJAR?" → branch
   - EMPEZAR → 3a. "¿Se siente fácil de mantener o difícil de arrancar?"
     - Fácil → **Crecer**
     - Difícil → **Sembrar**
   - DEJAR → **Cambiar**
3. "¿Ocurre en una situación MUY específica?" → Sí → **Preciso** (after main choice)
4. "¿Después de qué momento?" → `anchor`
5. "Versión mínima para un día malo:" → `rescueAction`
6. (solo Sembrar) Celebración
7. Resumen + dominio opcional

## Auto-Recovery System (Never Miss Twice)

| State | Behavior |
|---|---|
| 0 misses | Normal — show `activeAction` |
| 1 miss | Logged as blip. No punishment. Show `name` + `activeAction` |
| 2 consecutive misses | **Auto-rescue**: `activeAction = rescueAction`. Card shows "Tu versión de hoy: [rescueAction]". |
| 3 consecutive completes after rescue | `activeAction` restored to pre-rescue value (or escalated if user chose to grow) |
| 7+ consecutive misses | Kairo asks: "¿Quieres rediseñar este hábito?" |

## Identity Layer (internal)

Each habit has an optional `identityLabel` field. When the user creates or names a habit, the system (or Kairo) can suggest an identity framing:

| name example | suggested identityLabel |
|---|---|
| "Ejercicio" | "activa" |
| "Meditar" | "tranquila" |
| "Leer" | "curiosa" |

Displayed in dashboard cards as: *"Te estás convirtiendo en una persona [identityLabel]"*

If not set, the card shows no identity text. This is decorative — no logic depends on it.

## Radar de Vida

Visualización radial con 7 ejes (domains). Cada eje se llena según la fuerza promedio de los hábitos en ese dominio. Permite ver instantáneamente qué áreas están fuertes y cuáles abandonadas.

## AI Integration (Kairo)

Kairo uses the type + domain system to:
- Suggest habits: "Veo que Cuerpo está bajo. ¿Quieres un **Sembrar** para empezar?"
- Detect patterns: "Cuando Cuerpo sube, también sube Trabajo. Son dominios conectados."
- Rescue: "Semana pesada. Reduje temporalmente tu cadena al mínimo."

## Implementation Priority

1. DB schema migration (new fields, chains + chain_items tables, remove old type enum)
2. New types enum + domain enum in validations.ts
3. Guided wizard component
4. Per-type card rendering in habits panel
5. Auto-recovery system (strength integration)
6. Radar de vida component
7. Migration of existing habits
8. AI integration updates
