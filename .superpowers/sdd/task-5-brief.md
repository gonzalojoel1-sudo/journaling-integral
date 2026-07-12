### Task 5: Per-Type Card Rendering

**Files:**
- Modify: `src/app/habits/HabitsClient.tsx` (replace old EOR columns with per-type cards)
- Modify: `src/components/StrengthBar.tsx` (add celebration display)

**Interfaces:**
- Consumes: new `habitType`, `domain`, `activeAction`, `celebration` fields
- Produces: 5 different card layouts (one per type)

- [ ] **Step 1: Create a HabitCard sub-component per type**

In `HabitsClient.tsx`, implement card rendering based on `habitType`:

```tsx
function HabitCard({ habit }: { habit: any }) {
  const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
    crecer: { icon: '⚡', label: 'Crecer', color: 'border-l-stone-600' },
    sembrar: { icon: '🌱', label: 'Sembrar', color: 'border-l-emerald-500' },
    cambiar: { icon: '🔄', label: 'Cambiar', color: 'border-l-amber-500' },
    preciso: { icon: '🎯', label: 'Preciso', color: 'border-l-sky-500' },
    pilar: { icon: '🏛️', label: 'Pilar', color: 'border-l-violet-500' },
  };
  const config = typeConfig[habit.habitType] || typeConfig.crecer;

  const domainLabels: Record<string, string> = {
    cuerpo: 'Cuerpo', mente: 'Mente', trabajo: 'Trabajo',
    relaciones: 'Relaciones', hogar: 'Hogar', espiritual: 'Espiritual', finanzas: 'Finanzas',
  };

  return (
    <div className={`border-l-4 ${config.color} bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            {config.icon} {config.label}
            {habit.domain && <span className="ml-2 text-stone-300">· {domainLabels[habit.domain]}</span>}
          </span>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">{habit.name}</h3>
        </div>
        <button onClick={() => archiveHabit(habit.id)} className="text-stone-400 hover:text-red-500 transition-colors" title="Archivar">
          ✕
        </button>
      </div>

      {/* Active action display */}
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
        {habit.activeAction || habit.rescueAction}
      </p>

      {/* Type-specific details */}
      {habit.habitType === 'crecer' && habit.anchor && (
        <p className="text-xs text-stone-400">Después de: {habit.anchor}</p>
      )}
      {habit.habitType === 'sembrar' && habit.anchor && (
        <div className="text-xs text-stone-400 space-y-1">
          <p>Ancla: {habit.anchor}</p>
          {habit.celebration && <p>Celebración: {habit.celebration}</p>}
        </div>
      )}
      {habit.habitType === 'cambiar' && (
        <div className="text-xs text-stone-400 space-y-1">
          {habit.cue && <p>Disparador: {habit.cue}</p>}
          {habit.newRoutine && <p>Nueva rutina: {habit.newRoutine}</p>}
        </div>
      )}
      {habit.habitType === 'preciso' && habit.ifTrigger && (
        <p className="text-xs text-stone-400">Cuando {habit.ifTrigger} → {habit.ifAction}</p>
      )}
      {habit.habitType === 'pilar' && (
        <span className="inline-block text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
          Hábito clave
        </span>
      )}

      {/* Identity */}
      {habit.identityLabel && (
        <p className="text-xs text-stone-400 mt-1 italic">
          Te estás convirtiendo en una persona {habit.identityLabel}
        </p>
      )}

      {/* Strength */}
      <div className="mt-3">
        <StrengthBar strength={habit.currentStrength ?? 0} />
        {habit.celebration && (
          <p className="text-xs text-stone-400 mt-1 text-right">{habit.celebration}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the old EOR columns in HabitsClient.tsx**

Replace the three-column EOR section with a flat grid of `HabitCard` components grouped by type:

```tsx
// Replace the old {activeSubTab === 'catalogo' && (...)} section
{activeSubTab === 'catalogo' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {habits.map(habit => (
      <HabitCard key={habit.id} habit={habit} />
    ))}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/habits/HabitsClient.tsx src/components/StrengthBar.tsx
git commit -m "feat: per-type habit card rendering with icon, action, and celebration"
```

---

