### Task 8: Daily Journal Integration (Auto-Recovery Hook)

**Files:**
- Modify: `src/app/actions/daily-journal.ts` (add rescue trigger logic)

**Interfaces:**
- Consumes: `applyDecayAndBonus` result
- Produces: auto-rescue when 2 consecutive misses detected

- [ ] **Step 1: Add auto-rescue logic after strength update**

In `daily-journal.ts`, after the existing habit update loop (around line 209), add:

```typescript
// After updating all habits, check for auto-rescue
if (formData.dailyHabits && Array.isArray(formData.dailyHabits)) {
  for (const habitEntry of formData.dailyHabits) {
    if (!habitEntry.habitId) continue;

    const habitRecord = await db.query.habits.findFirst({
      where: eq(habits.id, habitEntry.habitId),
    });

    if (!habitRecord) continue;

    const { newStrength, newDate } = applyDecayAndBonus(
      habitRecord.currentStrength ?? 0,
      habitRecord.lastStrengthDate,
      todayStr,
      habitEntry.completed === true,
    );

    await db
      .update(habits)
      .set({
        currentStrength: newStrength,
        lastStrengthDate: newDate,
      })
      .where(eq(habits.id, habitEntry.habitId));

    // Auto-rescue: if not completed and strength dropped significantly
    // (2+ consecutive misses = strength roughly halved)
    if (
      !habitEntry.completed &&
      habitRecord.rescueAction &&
      habitRecord.activeAction !== habitRecord.rescueAction &&
      newStrength < (habitRecord.currentStrength ?? 0) * 0.85
    ) {
      await db
        .update(habits)
        .set({ activeAction: habitRecord.rescueAction })
        .where(eq(habits.id, habitEntry.habitId));
    }

    // Restore: if 3+ consecutive completes, restore action
    if (
      habitEntry.completed === true &&
      habitRecord.rescueAction && habitRecord.rescueAction !== habitRecord.activeAction
    ) {
      // Check last 3 entries — if all completed, restore
      // For simplicity, restore after 3 consecutive days
      if (newStrength >= (habitRecord.currentStrength ?? 0) + 2.5) {
        await db
          .update(habits)
          .set({ activeAction: habitRecord.rescueAction })
          .where(eq(habits.id, habitEntry.habitId));
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/daily-journal.ts
git commit -m "feat: add auto-rescue hook on consecutive misses"
```

---

