### Task 2: Validations

**Files:**
- Modify: `src/lib/validations.ts`

**Interfaces:**
- Consumes: new `habitType` + `domain` column names from schema
- Produces: `HabitTypeEnum`, `DomainEnum`, `CreateHabitSchema` with new fields

- [ ] **Step 1: Write the failing test**

Read `src/lib/validations.test.ts` first.

```typescript
// Add to src/lib/validations.test.ts
import { describe, it, expect } from 'vitest';
import { HabitTypeEnum, DomainEnum, CreateHabitSchema } from './validations';

describe('HabitTypeEnum', () => {
  it('accepts valid types', () => {
    expect(HabitTypeEnum.parse('crecer')).toBe('crecer');
    expect(HabitTypeEnum.parse('sembrar')).toBe('sembrar');
    expect(HabitTypeEnum.parse('cambiar')).toBe('cambiar');
    expect(HabitTypeEnum.parse('preciso')).toBe('preciso');
    expect(HabitTypeEnum.parse('pilar')).toBe('pilar');
  });

  it('rejects old types', () => {
    expect(() => HabitTypeEnum.parse('ESTANDARIZAR')).toThrow();
    expect(() => HabitTypeEnum.parse('personal')).toThrow();
  });
});

describe('DomainEnum', () => {
  it('accepts valid domains', () => {
    expect(DomainEnum.parse('cuerpo')).toBe('cuerpo');
    expect(DomainEnum.parse('espiritual')).toBe('espiritual');
  });
});

describe('CreateHabitSchema', () => {
  it('validates a minimal crecer habit', () => {
    const result = CreateHabitSchema.parse({
      name: 'Ejercicio matutino',
      habitType: 'crecer',
      anchor: 'Después del café',
      rescueAction: '1 sentadilla',
    });
    expect(result.name).toBe('Ejercicio matutino');
  });

  it('requires rescueAction', () => {
    expect(() => CreateHabitSchema.parse({
      name: 'Test',
      habitType: 'crecer',
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validations.test.ts --reporter=verbose`
Expected: FAIL (HabitTypeEnum, DomainEnum, CreateHabitSchema not defined or wrong)

- [ ] **Step 3: Write validations**

Replace the old HabitTypeEnum and CreateHabitSchema in `src/lib/validations.ts`:

```typescript
// ============================================================
// HABITS
// ============================================================

export const HabitTypeEnum = z.enum([
  'crecer',
  'sembrar',
  'cambiar',
  'preciso',
  'pilar',
]);

export const DomainEnum = z.enum([
  'cuerpo',
  'mente',
  'trabajo',
  'relaciones',
  'hogar',
  'espiritual',
  'finanzas',
]);

export const CreateHabitSchema = z.object({
  name: z.string().min(1, 'El nombre del hábito es requerido').max(100, 'Máximo 100 caracteres'),
  habitType: HabitTypeEnum,
  domain: DomainEnum.optional(),
  rescueAction: z.string().min(1, 'La acción de rescate es requerida').max(200),
  activeAction: z.string().optional(),
  celebration: z.string().optional(),
  anchor: z.string().optional(),
  ifTrigger: z.string().optional(),
  ifAction: z.string().optional(),
  cue: z.string().optional(),
  oldRoutine: z.string().optional(),
  newRoutine: z.string().optional(),
  identityLabel: z.string().optional(),
  belongsToChainId: z.string().optional(),
  nextHabitId: z.string().optional(),
});

export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;

export const ArchiveHabitSchema = z.object({
  habitId: UUIDSchema,
});

export type ArchiveHabitInput = z.infer<typeof ArchiveHabitSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validations.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations.ts src/lib/validations.test.ts
git commit -m "feat: update habit validations with new types and domains"
```

---

