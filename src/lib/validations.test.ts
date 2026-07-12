import { describe, it, expect } from 'vitest';
import {
  DailyEntrySchema,
  CreateHabitSchema,
  CreatePersonalTransactionSchema,
  CreateBusinessTransactionSchema,
  ChatRequestSchema,
  SmartEntryRequestSchema,
  validate,
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

describe('CreateHabitSchema', () => {
  it('should accept a valid habit', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'Meditar 10 minutos',
      type: 'personal',
      strategyDetails: 'Todos los días a las 6am',
    });
    expect(result.success).toBe(true);
  });

  it('should accept a habit without strategyDetails', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'Ejercicio',
      type: 'cuerpo',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = CreateHabitSchema.safeParse({
      name: '',
      type: 'personal',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre del hábito es requerido');
    }
  });

  it('should reject name > 100 characters', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'A'.repeat(101),
      type: 'personal',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = CreateHabitSchema.safeParse({
      name: 'Meditar',
      type: 'invalido',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid types', () => {
    const types = ['personal', 'negocio', 'fe', 'cuerpo', 'mente', 'relaciones'];
    for (const type of types) {
      const result = CreateHabitSchema.safeParse({
        name: 'Test Habit',
        type,
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
      type: 'personal',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Meditar');
    }
  });

  it('should return error message on invalid input', () => {
    const result = validate(CreateHabitSchema, {
      name: '',
      type: 'personal',
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
      type: 'invalido',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.length).toBeGreaterThanOrEqual(1);
    }
  });
});
