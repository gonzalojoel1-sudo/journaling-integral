import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const ToggleKindSchema = z.enum(['habit', 'mitSer', 'mitNegocio', 'mitRelaciones']);

const ToggleHabitSchema = z.object({
  kind: ToggleKindSchema,
  habitId: z.string().min(1).max(100).optional(),
  completed: z.boolean(),
});

describe('toggleHabit helper schema (ToggleHabitSchema)', () => {
  it('accepts each valid kind', () => {
    for (const kind of ['habit', 'mitSer', 'mitNegocio', 'mitRelaciones']) {
      const v = ToggleHabitSchema.safeParse({ kind, completed: true });
      expect(v.success).toBe(true);
    }
  });

  it('rejects unknown kinds', () => {
    const v = ToggleHabitSchema.safeParse({
      kind: 'unknown',
      completed: true,
    });
    expect(v.success).toBe(false);
  });

  it('requires completed to be a boolean (rejects numbers)', () => {
    const v = ToggleHabitSchema.safeParse({
      kind: 'habit',
      habitId: 'h-1',
      completed: 1,
    });
    expect(v.success).toBe(false);
  });

  it('requires habitId to be a non-empty string when provided', () => {
    const empty = ToggleHabitSchema.safeParse({
      kind: 'habit',
      habitId: '',
      completed: true,
    });
    expect(empty.success).toBe(false);

    const tooLong = ToggleHabitSchema.safeParse({
      kind: 'habit',
      habitId: 'a'.repeat(101),
      completed: true,
    });
    expect(tooLong.success).toBe(false);
  });

  it('accepts MIT toggles without habitId', () => {
    for (const kind of ['mitSer', 'mitNegocio', 'mitRelaciones']) {
      const v = ToggleHabitSchema.safeParse({ kind, completed: false });
      expect(v.success).toBe(true);
    }
  });

  it('tolerates extra fields (schema is not strict)', () => {
    const v = ToggleHabitSchema.safeParse({
      kind: 'habit',
      habitId: 'h-1',
      completed: true,
      userId: 'attacker',
    });
    expect(v.success).toBe(true);
  });
});
