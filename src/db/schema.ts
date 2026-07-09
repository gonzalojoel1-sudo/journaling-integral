import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  currentLevel: integer('current_level').default(1).notNull(),
  streakCurrent: integer('streak_current').default(0).notNull(),
  streakMax: integer('streak_max').default(0).notNull(),
  lastEntryDate: text('last_entry_date'),
  createdAt: text('created_at').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  dailyEntries: many(dailyEntries),
  quarterlyPlans: many(quarterlyPlans),
  weeklyPlans: many(weeklyPlans), // Relación añadida para planes semanales
  habits: many(habits),
}));

export const dailyEntries = sqliteTable('daily_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  levelAtEntry: integer('level_at_entry').notNull(),
  isPlanBUsed: integer('is_plan_b_used').default(0).notNull(),

  sleepRating: integer('sleep_rating'),
  energyRating: integer('energy_rating'),
  focusRating: integer('focus_rating'),
  stressRating: integer('stress_rating'),
  quickEnergyAction: text('quick_energy_action'),

  gratitude1: text('gratitude_1'),
  gratitude2: text('gratitude_2'),
  gratitude3: text('gratitude_3'),
  wisdomRequest: text('wisdom_request'),
  chooseToBeIdentity: text('choose_to_be_identity'),
  identityAction: text('identity_action'),

  dailyMicroAchievement: text('daily_micro_achievement'),
  devotionalNotes: text('devotional_notes'),
  autoeducation: text('autoeducation_json'),
  implementationIntentions: text('implementation_intentions_json'),

  mitSer: text('mit_ser'),
  mitSerCompleted: integer('mit_ser_completed').default(0).notNull(),
  mitNegocio: text('mit_negocio'),
  mitNegocioCompleted: integer('mit_negocio_completed').default(0).notNull(),
  mitRelaciones: text('mit_relaciones'),
  mitRelacionesCompleted: integer('mit_relaciones_completed').default(0).notNull(),

  dailyHabitsJson: text('daily_habits_json'),
  achievementsTop3: text('achievements_top_3_json'),
  whatWorked: text('what_worked'),
  whatDidNotWork: text('what_did_not_work'),
  improvementIdea: text('improvement_idea'),

  bizProspectCompleted: integer('biz_prospect_completed').default(0).notNull(),
  bizFollowUpCompleted: integer('biz_follow_up_completed').default(0).notNull(),
  bizMktActionCompleted: integer('biz_mkt_action_completed').default(0).notNull(),
  bizContactsCount: integer('biz_contacts_count').default(0).notNull(),
  bizSalesCount: integer('biz_sales_count').default(0).notNull(),
  bizIncome: real('biz_income').default(0.0).notNull(),
  bizExpenses: real('biz_expenses').default(0.0).notNull(),
  bizActionsSpecific: text('biz_actions_specific'),
  bizImprovementTomorrow: text('biz_improvement_tomorrow'),

  mindsetStateRating: integer('mindset_state_rating'),
  mindsetEmotion1: text('mindset_emotion_1'),
  mindsetEmotion2: text('mindset_emotion_2'),
  mindsetEmotion3: text('mindset_emotion_3'),
  mindsetTriggers: text('mindset_triggers'),
  mindsetBiblicalTruth: text('mindset_biblical_truth'),
  mindsetLimitingBelief: text('mindset_limiting_belief'),
  mindsetLimitingAction: text('mindset_limiting_action'),
  mindsetEmpoweringBelief: text('mindset_empowering_belief'),
  mindsetEmpoweringAction: text('mindset_empowering_action'),

  prepTomorrowJson: text('prep_tomorrow_json'),
  legacyReflection: text('legacy_reflection'),
  dominantFocusCompleted: integer('dominant_focus_completed').default(0).notNull(),

  createdAt: text('created_at').notNull(),
});

export const dailyEntriesRelations = relations(dailyEntries, ({ one }) => ({
  user: one(users, {
    fields: [dailyEntries.userId],
    references: [users.id],
  }),
}));

// --- NUEVA TABLA: PLANES SEMANALES DE ENFOQUE (80/20) ---
export const weeklyPlans = sqliteTable('weekly_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weekLabel: text('week_label').notNull(), // Formato YYYY-W[Semana] (ISO)
  focus: text('focus').notNull(), // Enfoque Dominante
  tasksJson: text('tasks_json').notNull(), // Las 3 acciones temporizadas { day, task }
  relationToNutre: text('relation_to_nutre'),
  createdAt: text('created_at').notNull(),
});

export const weeklyPlansRelations = relations(weeklyPlans, ({ one }) => ({
  user: one(users, {
    fields: [weeklyPlans.userId],
    references: [users.id],
  }),
}));

export const quarterlyPlans = sqliteTable('quarterly_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  quarterLabel: text('quarter_label').notNull(),
  year: integer('year').notNull(),
  isActive: integer('is_active').default(1).notNull(),

  fiveYearSpiritual: text('five_year_spiritual'),
  fiveYearBeing: text('five_year_being'),
  fiveYearBusiness: text('five_year_business'),
  fiveYearRelations: text('five_year_relations'),

  quarterlySpiritual: text('quarterly_spiritual'),
  quarterlyBeing: text('quarterly_being'),
  quarterlyBusiness: text('quarterly_business'),
  quarterlyRelations: text('quarterly_relations'),

  smartObjectivesJson: text('smart_objectives_json'),
  actionsPlanJson: text('actions_plan_json'),
  legacyAuditNotes: text('legacy_audit_notes'),

  createdAt: text('created_at').notNull(),
});

export const quarterlyPlansRelations = relations(quarterlyPlans, ({ one }) => ({
  user: one(users, {
    fields: [quarterlyPlans.userId],
    references: [users.id],
  }),
}));

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  strategyDetails: text('strategy_details'),
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active').default(1).notNull(),
});

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
}));

export const bibleVerses = sqliteTable('bible_verses', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull(),
  text: text('text').notNull(),
  interpretation: text('interpretation'),
  recommendedLevel: integer('recommended_level').default(1).notNull(),
  topic: text('topic'),
});