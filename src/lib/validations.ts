import { z } from 'zod';

// ============================================================
// COMMON / SHARED SCHEMAS
// ============================================================

export const UUIDSchema = z.string().uuid('ID inválido');

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD');

export const TimeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Hora debe tener formato HH:MM');

export const DateRangeSchema = z.object({
  startDate: DateStringSchema,
  endDate: DateStringSchema,
});

// ============================================================
// DAILY ENTRY (submitDailyEntry)
// ============================================================

const RatingField = z
  .number()
  .int()
  .min(1, 'Mínimo 1')
  .max(10, 'Máximo 10')
  .nullable()
  .optional();

const OptionalTextField = z.string().max(2000).nullable().optional();

export const DailyEntrySchema = z.object({
  // Energy
  sleepRating: RatingField,
  energyRating: RatingField,
  focusRating: RatingField,
  stressRating: RatingField,
  quickEnergyAction: z.string().max(500).nullable().optional(),

  // Gratitude
  gratitude1: z.string().max(500).nullable().optional(),
  gratitude2: z.string().max(500).nullable().optional(),
  gratitude3: z.string().max(500).nullable().optional(),
  wisdomRequest: z.string().max(1000).nullable().optional(),

  // Identity
  chooseToBeIdentity: z.string().max(500).nullable().optional(),
  identityAction: z.string().max(500).nullable().optional(),
  dailyMicroAchievement: z.string().max(500).nullable().optional(),

  // Devotional
  devotionalNotes: z.string().max(2000).nullable().optional(),

  // Auto-education & Implementation Intentions (JSON arrays)
  autoeducation: z.any().nullable().optional(),
  implementationIntentions: z.any().nullable().optional(),

  // MITs (Most Important Tasks)
  mitSer: z.string().max(500).nullable().optional(),
  mitSerCompleted: z.boolean().optional(),
  mitNegocio: z.string().max(500).nullable().optional(),
  mitNegocioCompleted: z.boolean().optional(),
  mitRelaciones: z.string().max(500).nullable().optional(),
  mitRelacionesCompleted: z.boolean().optional(),

  // Habits JSON
  dailyHabits: z
    .array(
      z.object({
        habitId: z.string(),
        completed: z.boolean(),
      }),
    )
    .optional(),

  // Achievements & Reflection
  achievementsTop3: z.any().nullable().optional(),
  whatWorked: z.string().max(1000).nullable().optional(),
  whatDidNotWork: z.string().max(1000).nullable().optional(),
  improvementIdea: z.string().max(1000).nullable().optional(),

  // Business
  bizProspectCompleted: z.boolean().optional(),
  bizFollowUpCompleted: z.boolean().optional(),
  bizMktActionCompleted: z.boolean().optional(),
  bizActionsSpecific: z.string().max(1000).nullable().optional(),
  bizContactsCount: z.number().int().min(0).optional(),
  bizSalesCount: z.number().int().min(0).optional(),
  bizIncome: z.number().min(0).optional(),
  bizExpenses: z.number().min(0).optional(),
  bizImprovementTomorrow: z.string().max(1000).nullable().optional(),

  // Mindset
  mindsetStateRating: RatingField,
  mindsetEmotion1: z.string().max(200).nullable().optional(),
  mindsetEmotion2: z.string().max(200).nullable().optional(),
  mindsetEmotion3: z.string().max(200).nullable().optional(),
  mindsetTriggers: z.string().max(500).nullable().optional(),
  mindsetBiblicalTruth: z.string().max(500).nullable().optional(),
  mindsetLimitingBelief: z.string().max(500).nullable().optional(),
  mindsetLimitingAction: z.string().max(500).nullable().optional(),
  mindsetEmpoweringBelief: z.string().max(500).nullable().optional(),
  mindsetEmpoweringAction: z.string().max(500).nullable().optional(),

  // Prep tomorrow
  prepTomorrow: z.any().nullable().optional(),

  // Closure
  legacyReflection: z.string().max(1000).nullable().optional(),
  dominantFocusCompleted: z.boolean().optional(),

  // Plan B
  isPlanBUsed: z.boolean().optional(),
});

export type DailyEntryInput = z.infer<typeof DailyEntrySchema>;

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
  name: z
    .string()
    .min(1, 'El nombre del hábito es requerido')
    .max(100, 'Máximo 100 caracteres'),
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

// ============================================================
// PERSONAL TRANSACTIONS
// ============================================================

export const TransactionTypeEnum = z.enum(['ingreso', 'gasto']);

export const CreatePersonalTransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  type: TransactionTypeEnum,
  category: z.string().max(50).optional().default('Otros'),
  account: z.string().max(50).optional().default('Efectivo'),
  description: z.string().max(500).optional(),
  date: DateStringSchema.optional(),
});

export type CreatePersonalTransactionInput = z.infer<
  typeof CreatePersonalTransactionSchema
>;

export const UpdatePersonalTransactionSchema = z.object({
  id: UUIDSchema,
  amount: z.number().positive().optional(),
  type: TransactionTypeEnum.optional(),
  category: z.string().max(50).optional(),
  account: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  date: DateStringSchema.optional(),
});

export type UpdatePersonalTransactionInput = z.infer<
  typeof UpdatePersonalTransactionSchema
>;

export const DeletePersonalTransactionSchema = z.object({
  id: UUIDSchema,
});

export const WithdrawToPersonalSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  date: DateStringSchema.optional(),
});

export type WithdrawToPersonalInput = z.infer<typeof WithdrawToPersonalSchema>;

// ============================================================
// BUSINESS TRANSACTIONS
// ============================================================

export const CreateBusinessTransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  cost: z.number().min(0).optional().default(0),
  type: TransactionTypeEnum,
  description: z.string().max(500).optional(),
  source: z.string().max(100).optional().default('General'),
  isSale: z.boolean().optional().default(false),
  date: DateStringSchema.optional(),
});

export type CreateBusinessTransactionInput = z.infer<
  typeof CreateBusinessTransactionSchema
>;

export const UpdateBusinessTransactionSchema = z.object({
  id: UUIDSchema,
  amount: z.number().positive().optional(),
  cost: z.number().min(0).optional(),
  type: TransactionTypeEnum.optional(),
  description: z.string().max(500).optional(),
  source: z.string().max(100).optional(),
  isSale: z.boolean().optional(),
  date: DateStringSchema.optional(),
});

export type UpdateBusinessTransactionInput = z.infer<
  typeof UpdateBusinessTransactionSchema
>;

export const DeleteBusinessTransactionSchema = z.object({
  id: UUIDSchema,
});

// ============================================================
// BUSINESS SETTINGS
// ============================================================

export const UpsertBusinessSettingSchema = z.object({
  id: UUIDSchema.optional(),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres'),
  defaultSaleAmount: z.number().min(0).optional(),
  defaultSaleCost: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional(),
  monthlyGoal: z.number().min(0).optional(),
  isRecurring: z.number().min(0).max(1).optional(),
});

export type UpsertBusinessSettingInput = z.infer<
  typeof UpsertBusinessSettingSchema
>;

export const DeleteBusinessSettingSchema = z.object({
  id: UUIDSchema,
});

// ============================================================
// BUSINESS AUTO-SAVE & SYNC
// ============================================================

export const AutoSaveBizFieldSchema = z.object({
  field: z.string().min(1, 'Campo requerido'),
  value: z.union([z.string().max(1000), z.number()]),
  date: DateStringSchema,
});

export const AutoSyncSalesSchema = z.object({
  date: DateStringSchema,
});

export const RegisterSaleSchema = z.object({
  settingsId: UUIDSchema,
  date: DateStringSchema,
});

// ============================================================
// ADMIN
// ============================================================

export const AdminDeleteUserSchema = z.object({
  userId: UUIDSchema,
});

export const AdminSetRoleSchema = z.object({
  userId: UUIDSchema,
  role: z.enum(['admin', 'user']),
});

// ============================================================
// USER SETTINGS
// ============================================================

export const UpdateUserSettingSchema = z.object({
  field: z.enum([
    'showBusinessPanel',
    'showFinancePanel',
    'showHabitsPanel',
    'showQuarterlyPanel',
    'showChallengesPanel',
    'aiAssistantEnabled',
  ]),
  value: z.boolean(),
});

export type UpdateUserSettingInput = z.infer<typeof UpdateUserSettingSchema>;

export const CompleteOnboardingSchema = z.object({
  showBusinessPanel: z.boolean(),
  showFinancePanel: z.boolean(),
  showHabitsPanel: z.boolean(),
  showQuarterlyPanel: z.boolean(),
  showChallengesPanel: z.boolean(),
});

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;

// ============================================================
// WEEKLY PLANNING
// ============================================================

export const SaveWeeklyPlanSchema = z.object({
  focus: z.string().max(500).optional().default(''),
  tasks: z.any().optional(),
  relationToNutre: z.string().max(1000).nullable().optional(),
});

export type SaveWeeklyPlanInput = z.infer<typeof SaveWeeklyPlanSchema>;

// ============================================================
// QUARTERLY PLANNING
// ============================================================

export const SaveQuarterlyPlanSchema = z.object({
  quarterLabel: z.string().max(20).optional().default('Q1/2026'),
  year: z.number().int().min(2020).max(2100).optional(),

  fiveYearSpiritual: z.string().max(2000).nullable().optional(),
  fiveYearBeing: z.string().max(2000).nullable().optional(),
  fiveYearBusiness: z.string().max(2000).nullable().optional(),
  fiveYearRelations: z.string().max(2000).nullable().optional(),

  quarterlySpiritual: z.string().max(2000).nullable().optional(),
  quarterlyBeing: z.string().max(2000).nullable().optional(),
  quarterlyBusiness: z.string().max(2000).nullable().optional(),
  quarterlyRelations: z.string().max(2000).nullable().optional(),

  smartObjectives: z.any().nullable().optional(),
  actionsPlan: z.any().nullable().optional(),
  legacyAuditNotes: z.string().max(2000).nullable().optional(),
});

export type SaveQuarterlyPlanInput = z.infer<typeof SaveQuarterlyPlanSchema>;

// ============================================================
// CHALLENGES
// ============================================================

export const ActivateChallengeSchema = z.object({
  templateId: z.string().min(1, 'Template ID es requerido'),
});

// ============================================================
// AUTH
// ============================================================

export const UpdateUserLevelSchema = z.object({
  level: z.number().int().min(1, 'Nivel mínimo 1').max(100, 'Nivel máximo 100'),
});

// ============================================================
// API ROUTES — CHAT
// ============================================================

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(10000),
});

export const ChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, 'Se requiere al menos un mensaje')
    .max(50, 'Máximo 50 mensajes por conversación'),
});

// ============================================================
// API ROUTES — SMART ENTRY
// ============================================================

export const SmartEntryRequestSchema = z.object({
  transcript: z
    .string()
    .min(1, 'La transcripción no puede estar vacía')
    .max(10000, 'Máximo 10,000 caracteres'),
});

// ============================================================
// HELPER: Validate and return typed errors
// ============================================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false as const,
      error: firstError.message,
      fieldErrors: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    };
  }
  return { success: true as const, data: result.data };
}
