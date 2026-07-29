import { describe, it, expect } from 'vitest';
import {
  DailyEntrySchema,
  CreateHabitSchema,
  CreatePersonalTransactionSchema,
  CreateBusinessTransactionSchema,
  ChatRequestSchema,
  SmartEntryRequestSchema,
  validate,
  HabitTypeEnum,
  DomainEnum,
  DraftJournalSchema,
  HabitsDraftSchema,
  JoinCircleSchema,
} from './validations';

describe('DailyEntrySchema', () => {
  const validEntry = {
    sleepRating: 8,
    energyRating: 7,
    focusRating: 9,
    stressRating: 3,
    quickEnergyAction: 'Caminar 10 minutos',
    gratitude1: 'Mi familia',
    gratitude2: 'Mi salud',
    gratitude3: 'Mi trabajo',
    wisdomRequest: 'Paciencia',
    chooseToBeIdentity: 'Soy una persona disciplinada',
    identityAction: 'Leer 30 minutos',
    dailyMicroAchievement: 'Terminé el proyecto',
    devotionalNotes: 'Gracias por este día',
    mitSer: 'Ejercicio',
    mitSerCompleted: true,
    mitNegocio: 'Llamar cliente',
    mitNegocioCompleted: false,
    mitRelaciones: 'Cena familiar',
    mitRelacionesCompleted: true,
    dailyHabits: [
      { habitId: 'abc-123', completed: true },
      { habitId: 'def-456', completed: false },
    ],
    whatWorked: 'La planificación matutina',
    whatDidNotWork: 'Distracciones en la tarde',
    improvementIdea: 'Bloquear redes sociales',
    bizProspectCompleted: true,
    bizFollowUpCompleted: false,
    bizMktActionCompleted: true,
    bizContactsCount: 5,
    bizSalesCount: 2,
    bizIncome: 1500.5,
    bizExpenses: 300.25,
    mindsetStateRating: 8,
    mindsetEmotion1: 'Gratitud',
    mindsetEmotion2: 'Paz',
    mindsetEmotion3: 'Esperanza',
    legacyReflection: 'Quiero dejar un legado de fe',
    dominantFocusCompleted: true,
    isPlanBUsed: false,
  };

  it('should accept a valid daily entry', () => {
    const result = DailyEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('should accept an empty object (all fields optional)', () => {
    const result = DailyEntrySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject sleepRating > 10', () => {
    const result = DailyEntrySchema.safeParse({
      ...validEntry,
      sleepRating: 11,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Máximo 10');
    }
  });

  it('should reject sleepRating < 1', () => {
    const result = DailyEntrySchema.safeParse({
      ...validEntry,
      sleepRating: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Mínimo 1');
    }
  });

  it('should reject non-integer ratings', () => {
    const result = DailyEntrySchema.safeParse({
      ...validEntry,
      sleepRating: 7.5,
    });
    expect(result.success).toBe(false);
  });

  it('should accept null ratings', () => {
    const result = DailyEntrySchema.safeParse({
      ...validEntry,
      sleepRating: null,
      energyRating: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject bizContactsCount as negative', () => {
    const result = DailyEntrySchema.safeParse({
      ...validEntry,
      bizContactsCount: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject bizIncome as negative', () => {
    const result = DailyEntrySchema.safeParse({
      ...validEntry,
      bizIncome: -100,
    });
    expect(result.success).toBe(false);
  });
});

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

  it('should reject empty name', () => {
    const result = CreateHabitSchema.safeParse({
      name: '',
      habitType: 'crecer',
      rescueAction: 'something',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre del hábito es requerido');
    }
  });

  it('should reject name > 100 characters', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'A'.repeat(101),
      habitType: 'crecer',
      rescueAction: 'something',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid habitType', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'Meditar',
      habitType: 'invalido',
      rescueAction: 'something',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid habitTypes', () => {
    const types = ['crecer', 'sembrar', 'cambiar', 'preciso', 'pilar'];
    for (const habitType of types) {
      const result = CreateHabitSchema.safeParse({
        name: 'Test Habit',
        habitType,
        rescueAction: 'something',
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept optional fields', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'Full habit',
      habitType: 'pilar',
      rescueAction: 'Do something',
      domain: 'cuerpo',
      activeAction: 'Active action',
      celebration: 'Celebrate!',
      anchor: 'After coffee',
      ifTrigger: 'If X',
      ifAction: 'Then Y',
      cue: 'Cue',
      oldRoutine: 'Old',
      newRoutine: 'New',
      identityLabel: 'I am...',
      belongsToChainId: 'abc-123',
      nextHabitId: 'def-456',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid domains', () => {
    const domains = ['cuerpo', 'mente', 'trabajo', 'relaciones', 'hogar', 'espiritual', 'finanzas'];
    for (const domain of domains) {
      const result = CreateHabitSchema.safeParse({
        name: 'Test',
        habitType: 'crecer',
        rescueAction: 'action',
        domain,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('CreatePersonalTransactionSchema', () => {
  it('should accept a valid transaction', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: 500,
      type: 'ingreso',
      category: 'Salario',
      account: 'Banco',
      description: 'Pago mensual',
      date: '2026-07-11',
    });
    expect(result.success).toBe(true);
  });

  it('should use default values for category and account', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: 100,
      type: 'gasto',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('Otros');
      expect(result.data.account).toBe('Efectivo');
    }
  });

  it('should reject negative amount', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: -100,
      type: 'gasto',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El monto debe ser positivo');
    }
  });

  it('should reject zero amount', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: 0,
      type: 'gasto',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: 100,
      type: 'inversion',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date format', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: 100,
      type: 'gasto',
      date: '11/07/2026',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid date format', () => {
    const result = CreatePersonalTransactionSchema.safeParse({
      amount: 100,
      type: 'gasto',
      date: '2026-07-11',
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateBusinessTransactionSchema', () => {
  it('should accept a valid business transaction', () => {
    const result = CreateBusinessTransactionSchema.safeParse({
      amount: 1000,
      cost: 200,
      type: 'ingreso',
      description: 'Venta de producto',
      source: 'Tienda Online',
      isSale: true,
      date: '2026-07-11',
    });
    expect(result.success).toBe(true);
  });

  it('should use defaults for cost and source', () => {
    const result = CreateBusinessTransactionSchema.safeParse({
      amount: 500,
      type: 'gasto',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cost).toBe(0);
      expect(result.data.source).toBe('General');
      expect(result.data.isSale).toBe(false);
    }
  });

  it('should reject negative cost', () => {
    const result = CreateBusinessTransactionSchema.safeParse({
      amount: 100,
      type: 'gasto',
      cost: -50,
    });
    expect(result.success).toBe(false);
  });
});

describe('ChatRequestSchema', () => {
  it('should accept valid chat messages', () => {
    const result = ChatRequestSchema.safeParse({
      messages: [
        { role: 'user', content: 'Hola, ¿cómo estás?' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty messages array', () => {
    const result = ChatRequestSchema.safeParse({
      messages: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Se requiere al menos un mensaje');
    }
  });

  it('should reject > 50 messages', () => {
    const messages = Array.from({ length: 51 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
    }));
    const result = ChatRequestSchema.safeParse({ messages });
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const result = ChatRequestSchema.safeParse({
      messages: [{ role: 'invalid', content: 'Hello' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('SmartEntryRequestSchema', () => {
  it('should accept a valid transcript', () => {
    const result = SmartEntryRequestSchema.safeParse({
      transcript: 'Hoy me sentí muy productivo',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty transcript', () => {
    const result = SmartEntryRequestSchema.safeParse({
      transcript: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La transcripción no puede estar vacía');
    }
  });

  it('should reject transcript > 10000 characters', () => {
    const result = SmartEntryRequestSchema.safeParse({
      transcript: 'A'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});

describe('validate helper', () => {
  it('should return success with data on valid input', () => {
    const result = validate(CreateHabitSchema, {
      name: 'Meditar',
      habitType: 'crecer',
      rescueAction: 'Hacerlo',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Meditar');
    }
  });

  it('should return error message on invalid input', () => {
    const result = validate(CreateHabitSchema, {
      name: '',
      habitType: 'crecer',
      rescueAction: 'Hacerlo',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('El nombre del hábito es requerido');
      expect(result.fieldErrors).toHaveLength(1);
      expect(result.fieldErrors[0].path).toBe('name');
    }
  });

  it('should return first error only', () => {
    const result = validate(CreateHabitSchema, {
      name: '',
      habitType: 'invalido',
      rescueAction: 'Hacerlo',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('DraftJournalSchema', () => {
  it('accepts a valid minimal draft', () => {
    const r = DraftJournalSchema.safeParse({ gratitude1: 'Familia' });
    expect(r.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const r = DraftJournalSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('rejects userId injection (mass assignment protection)', () => {
    const r = DraftJournalSchema.safeParse({
      gratitude1: 'Familia',
      userId: 'attacker-controlled-id',
    });
    expect(r.success).toBe(false);
  });

  it('rejects date injection', () => {
    const r = DraftJournalSchema.safeParse({
      gratitude1: 'Familia',
      date: '2099-12-31',
    });
    expect(r.success).toBe(false);
  });

  it('rejects time injection', () => {
    const r = DraftJournalSchema.safeParse({
      gratitude1: 'Familia',
      time: '00:00:00',
    });
    expect(r.success).toBe(false);
  });

  it('rejects id injection', () => {
    const r = DraftJournalSchema.safeParse({
      gratitude1: 'Familia',
      id: 'some-fake-id',
    });
    expect(r.success).toBe(false);
  });

  it('rejects levelAtEntry injection', () => {
    const r = DraftJournalSchema.safeParse({
      gratitude1: 'Familia',
      levelAtEntry: 99,
    });
    expect(r.success).toBe(false);
  });

  it('rejects gratitude1 > 500 chars', () => {
    const r = DraftJournalSchema.safeParse({ gratitude1: 'A'.repeat(501) });
    expect(r.success).toBe(false);
  });

  it('rejects sleepRating > 10', () => {
    const r = DraftJournalSchema.safeParse({ sleepRating: 11 });
    expect(r.success).toBe(false);
  });

  it('accepts valid numeric ratings', () => {
    const r = DraftJournalSchema.safeParse({ sleepRating: 8, energyRating: 7 });
    expect(r.success).toBe(true);
  });

  it('accepts arrays of strings (autoeducation)', () => {
    const r = DraftJournalSchema.safeParse({ autoeducation: ['leer 10 min', 'meditar'] });
    expect(r.success).toBe(true);
  });
});

describe('HabitsDraftSchema', () => {
  it('accepts a valid habits array', () => {
    const r = HabitsDraftSchema.safeParse([
      { habitId: 'h-1', name: 'Meditar', habitType: 'crecer', completed: true },
      { habitId: 'h-2', name: 'Correr', habitType: 'pilar', completed: false },
    ]);
    expect(r.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const r = HabitsDraftSchema.safeParse([]);
    expect(r.success).toBe(true);
  });

  it('rejects non-array input', () => {
    const r = HabitsDraftSchema.safeParse({ habitId: 'h-1' });
    expect(r.success).toBe(false);
  });

  it('rejects items missing habitId', () => {
    const r = HabitsDraftSchema.safeParse([{ name: 'X', habitType: 'crecer', completed: false }]);
    expect(r.success).toBe(false);
  });

  it('rejects items with non-boolean completed', () => {
    const r = HabitsDraftSchema.safeParse([{ habitId: 'h-1', name: 'X', habitType: 'crecer', completed: 'yes' }]);
    expect(r.success).toBe(false);
  });

  it('rejects userId injection at item level', () => {
    const r = HabitsDraftSchema.safeParse([
      { habitId: 'h-1', name: 'X', habitType: 'crecer', completed: true, userId: 'attacker' },
    ]);
    expect(r.success).toBe(false);
  });

  it('rejects extra unknown fields per item', () => {
    const r = HabitsDraftSchema.safeParse([
      { habitId: 'h-1', name: 'X', habitType: 'crecer', completed: true, privilege: 'admin' },
    ]);
    expect(r.success).toBe(false);
  });
});

describe('JoinCircleSchema', () => {
  it('accepts a 16-char hex code (new format)', () => {
    const r = JoinCircleSchema.safeParse({ code: 'a'.repeat(16) });
    expect(r.success).toBe(true);
  });

  it('rejects 8-char code (legacy format)', () => {
    const r = JoinCircleSchema.safeParse({ code: 'a'.repeat(8) });
    expect(r.success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const r = JoinCircleSchema.safeParse({ code: 'z'.repeat(16) });
    expect(r.success).toBe(false);
  });

  it('rejects empty code', () => {
    const r = JoinCircleSchema.safeParse({ code: '' });
    expect(r.success).toBe(false);
  });
});
