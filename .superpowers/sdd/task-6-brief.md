### Task 6: Dashboard Integration

**Files:**
- Modify: `src/app/dashboard/HabitProgress.tsx` (show activeAction + rescue indicator)

**Interfaces:**
- Consumes: `activeAction`, `rescueAction`, `celebration` from habits

- [ ] **Step 1: Update HabitProgress to show active action + rescue badge**

```tsx
// In the habit item rendering section, add:
<div className="flex items-center justify-between py-2">
  <div className="flex items-center gap-3 flex-1">
    {/* ... existing checkbox ... */}
    <div className="flex-1">
      <span className={`text-sm ${completedIds.has(habit.id) ? 'line-through text-stone-400' : ''}`}>
        {habit.name}
      </span>
      <div className="flex items-center gap-2">
        <p className="text-xs text-stone-400">{habit.activeAction || habit.rescueAction}</p>
        {habit.activeAction !== habit.rescueAction && habit.activeAction === habit.rescueAction && (
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
            Modo rescate
          </span>
        )}
      </div>
      <StrengthBar strength={habit.currentStrength ?? 0} className="mt-1" />
    </div>
  </div>
  {/* Celebration */}
  {completedIds.has(habit.id) && habit.celebration && (
    <span className="text-xs text-stone-400">{habit.celebration}</span>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/HabitProgress.tsx
git commit -m "feat: show activeAction and rescue badge in dashboard"
```

---

