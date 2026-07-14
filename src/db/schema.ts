import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').default('user').notNull(),
  currentLevel: integer('current_level').default(1).notNull(),
  streakCurrent: integer('streak_current').default(0).notNull(),
  streakMax: integer('streak_max').default(0).notNull(),
  lastEntryDate: text('last_entry_date'),
  createdAt: text('created_at').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  dailyEntries: many(dailyEntries),
  quarterlyPlans: many(quarterlyPlans),
  weeklyPlans: many(weeklyPlans),
  habits: many(habits),
  businessTransactions: many(businessTransactions),
  businessSettings: many(businessSettings),
  personalTransactions: many(personalTransactions),
  journalEmbeddings: many(journalEmbeddings),
  circles: many(circles),
  circleMemberships: many(circleMembers),
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

export const dailyEntriesRelations = relations(dailyEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyEntries.userId],
    references: [users.id],
  }),
  embeddings: many(journalEmbeddings),
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

  // Core
  name: text('name').notNull(),
  habitType: text('habit_type').notNull(),   // crecer | sembrar | cambiar | preciso | pilar
  domain: text('domain'),                     // cuerpo | mente | trabajo | relaciones | hogar | espiritual | finanzas | null

  // Action system
  rescueAction: text('rescue_action'),
  activeAction: text('active_action'),
  celebration: text('celebration').default('✅ Hecho'),

  // Type-specific fields
  anchor: text('anchor'),                     // Crecer, Sembrar
  ifTrigger: text('if_trigger'),              // Preciso
  ifAction: text('if_action'),                // Preciso
  cue: text('cue'),                           // Cambiar
  oldRoutine: text('old_routine'),            // Cambiar
  newRoutine: text('new_routine'),            // Cambiar

  // Identity
  identityLabel: text('identity_label'),

  // Chain relationship
  belongsToChainId: text('belongs_to_chain_id'),
  nextHabitId: text('next_habit_id'),

  // Strength
  currentStrength: real('current_strength').default(0.0),
  lastStrengthDate: text('last_strength_date'),

  // Type mechanics (Sembrar)
  evolutionCycle: integer('evolution_cycle').default(0),
  daysInCurrentCycle: integer('days_in_current_cycle').default(0),
  evolutionOptimal: text('evolution_optimal'),
  evolutionMinimum: text('evolution_minimum'),

  // Type mechanics (Crecer)
  streakShields: integer('streak_shields').default(0),
  currentStreak: integer('current_streak').default(0),

  // Type mechanics (Cambiar)
  victoryCount: integer('victory_count').default(0),
  temptationCount: integer('temptation_count').default(0),

  // Type mechanics (Preciso)
  triggerHitCount: integer('trigger_hit_count').default(0),
  actionExecutedCount: integer('action_executed_count').default(0),

  // Type mechanics (Pilar)
  pilarCompleted: integer('pilar_completed').default(0),

  // Meta
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active').default(1).notNull(),
});

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
}));

export const chains = sqliteTable('chains', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const chainItems = sqliteTable('chain_items', {
  id: text('id').primaryKey(),
  chainId: text('chain_id')
    .notNull()
    .references(() => chains.id, { onDelete: 'cascade' }),
  habitId: text('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  name: text('name'),
  order: integer('order').notNull(),
});

export const chainsRelations = relations(chains, ({ one, many }) => ({
  user: one(users, {
    fields: [chains.userId],
    references: [users.id],
  }),
  items: many(chainItems),
}));

export const chainItemsRelations = relations(chainItems, ({ one }) => ({
  chain: one(chains, {
    fields: [chainItems.chainId],
    references: [chains.id],
  }),
  habit: one(habits, {
    fields: [chainItems.habitId],
    references: [habits.id],
  }),
}));

export const bibleVerses = sqliteTable('bible_verses', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull(),
  text: text('text').notNull(),
  interpretation: text('interpretation'),
  recommendedLevel: integer('recommended_level').default(1).notNull(),
  recommendedTier: text('recommended_tier'),
  topic: text('topic'),
});

export const challenges = sqliteTable('challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  templateId: text('template_id').notNull(),
  status: text('status').notNull().default('active'),
  currentDay: integer('current_day').notNull().default(1),
  progressJson: text('progress_json'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
});

export const challengesRelations = relations(challenges, ({ one }) => ({
  user: one(users, {
    fields: [challenges.userId],
    references: [users.id],
  }),
}));

export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull(),
  area: text('area').notNull(),
  mineral: text('mineral').notNull(),
  unlockedAt: text('unlocked_at').notNull(),
});

export const badgesRelations = relations(badges, ({ one }) => ({
  user: one(users, {
    fields: [badges.userId],
    references: [users.id],
  }),
}));

export const businessTransactions = sqliteTable('business_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  cost: real('cost').default(0.0).notNull(),
  type: text('type').notNull(),
  description: text('description'),
  source: text('source').default('General').notNull(),
  isSale: integer('is_sale').default(0).notNull(),
  date: text('date').notNull(),
  dailyEntryId: text('daily_entry_id'),
  createdAt: text('created_at').notNull(),
});

export const businessTransactionsRelations = relations(businessTransactions, ({ one }) => ({
  user: one(users, {
    fields: [businessTransactions.userId],
    references: [users.id],
  }),
  dailyEntry: one(dailyEntries, {
    fields: [businessTransactions.dailyEntryId],
    references: [dailyEntries.id],
  }),
}));

export const businessSettings = sqliteTable('business_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('General'),
  defaultSaleAmount: real('default_sale_amount').default(0.0).notNull(),
  defaultSaleCost: real('default_sale_cost').default(0.0).notNull(),
  isActive: integer('is_active').default(1).notNull(),
  createdAt: text('created_at').notNull(),
});

export const businessSettingsRelations = relations(businessSettings, ({ one }) => ({
  user: one(users, {
    fields: [businessSettings.userId],
    references: [users.id],
  }),
}));

export const personalTransactions = sqliteTable('personal_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  category: text('category').default('Otros').notNull(),
  account: text('account').default('Efectivo').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull(),
});

export const personalTransactionsRelations = relations(personalTransactions, ({ one }) => ({
  user: one(users, {
    fields: [personalTransactions.userId],
    references: [users.id],
  }),
}));

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  showBusinessPanel: integer('show_business_panel').default(0).notNull(),
  showFinancePanel: integer('show_finance_panel').default(0).notNull(),
  showHabitsPanel: integer('show_habits_panel').default(0),
  showQuarterlyPanel: integer('show_quarterly_panel').default(0),
  showChallengesPanel: integer('show_challenges_panel').default(0),
  onboardingCompleted: integer('onboarding_completed').default(0).notNull(),
  aiAssistantEnabled: integer('ai_assistant_enabled').default(1),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const journalEmbeddings = sqliteTable('journal_embeddings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  entryId: text('entry_id')
    .notNull()
    .references(() => dailyEntries.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(),
  createdAt: text('created_at').notNull(),
});

export const journalEmbeddingsRelations = relations(journalEmbeddings, ({ one }) => ({
  user: one(users, {
    fields: [journalEmbeddings.userId],
    references: [users.id],
  }),
  entry: one(dailyEntries, {
    fields: [journalEmbeddings.entryId],
    references: [dailyEntries.id],
  }),
}));

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Mi Círculo'),
  createdBy: text('created_by').notNull().references(() => users.id),
  visibilitySettings: text('visibility_settings').notNull().default('only_streak'),
  createdAt: text('created_at').notNull(),
});

export const circlesRelations = relations(circles, ({ one, many }) => ({
  creator: one(users, {
    fields: [circles.createdBy],
    references: [users.id],
  }),
  members: many(circleMembers),
}));

export const circleMembers = sqliteTable('circle_members', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id),
  userId: text('user_id').notNull().references(() => users.id),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'),
  joinedAt: text('joined_at'),
  inviteCode: text('invite_code').unique().notNull(),
});

export const circleMembersRelations = relations(circleMembers, ({ one }) => ({
  circle: one(circles, {
    fields: [circleMembers.circleId],
    references: [circles.id],
  }),
  user: one(users, {
    fields: [circleMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [circleMembers.invitedBy],
    references: [users.id],
  }),
}));
