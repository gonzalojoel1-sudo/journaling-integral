CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`area` text NOT NULL,
	`mineral` text NOT NULL,
	`unlocked_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bible_verses` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`text` text NOT NULL,
	`interpretation` text,
	`recommended_level` integer DEFAULT 1 NOT NULL,
	`topic` text
);
--> statement-breakpoint
CREATE TABLE `business_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'General' NOT NULL,
	`default_sale_amount` real DEFAULT 0 NOT NULL,
	`default_sale_cost` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `business_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`source` text DEFAULT 'General' NOT NULL,
	`is_sale` integer DEFAULT 0 NOT NULL,
	`date` text NOT NULL,
	`daily_entry_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`template_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_day` integer DEFAULT 1 NOT NULL,
	`progress_json` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `daily_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`level_at_entry` integer NOT NULL,
	`is_plan_b_used` integer DEFAULT 0 NOT NULL,
	`sleep_rating` integer,
	`energy_rating` integer,
	`focus_rating` integer,
	`stress_rating` integer,
	`quick_energy_action` text,
	`gratitude_1` text,
	`gratitude_2` text,
	`gratitude_3` text,
	`wisdom_request` text,
	`choose_to_be_identity` text,
	`identity_action` text,
	`daily_micro_achievement` text,
	`devotional_notes` text,
	`autoeducation_json` text,
	`implementation_intentions_json` text,
	`mit_ser` text,
	`mit_ser_completed` integer DEFAULT 0 NOT NULL,
	`mit_negocio` text,
	`mit_negocio_completed` integer DEFAULT 0 NOT NULL,
	`mit_relaciones` text,
	`mit_relaciones_completed` integer DEFAULT 0 NOT NULL,
	`daily_habits_json` text,
	`achievements_top_3_json` text,
	`what_worked` text,
	`what_did_not_work` text,
	`improvement_idea` text,
	`biz_prospect_completed` integer DEFAULT 0 NOT NULL,
	`biz_follow_up_completed` integer DEFAULT 0 NOT NULL,
	`biz_mkt_action_completed` integer DEFAULT 0 NOT NULL,
	`biz_contacts_count` integer DEFAULT 0 NOT NULL,
	`biz_sales_count` integer DEFAULT 0 NOT NULL,
	`biz_income` real DEFAULT 0 NOT NULL,
	`biz_expenses` real DEFAULT 0 NOT NULL,
	`biz_actions_specific` text,
	`biz_improvement_tomorrow` text,
	`mindset_state_rating` integer,
	`mindset_emotion_1` text,
	`mindset_emotion_2` text,
	`mindset_emotion_3` text,
	`mindset_triggers` text,
	`mindset_biblical_truth` text,
	`mindset_limiting_belief` text,
	`mindset_limiting_action` text,
	`mindset_empowering_belief` text,
	`mindset_empowering_action` text,
	`prep_tomorrow_json` text,
	`legacy_reflection` text,
	`dominant_focus_completed` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`strategy_details` text,
	`current_strength` real DEFAULT 0,
	`last_strength_date` text,
	`created_at` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personal_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category` text DEFAULT 'Otros' NOT NULL,
	`account` text DEFAULT 'Efectivo' NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quarterly_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`quarter_label` text NOT NULL,
	`year` integer NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`five_year_spiritual` text,
	`five_year_being` text,
	`five_year_business` text,
	`five_year_relations` text,
	`quarterly_spiritual` text,
	`quarterly_being` text,
	`quarterly_business` text,
	`quarterly_relations` text,
	`smart_objectives_json` text,
	`actions_plan_json` text,
	`legacy_audit_notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`show_business_panel` integer DEFAULT 0 NOT NULL,
	`show_finance_panel` integer DEFAULT 0 NOT NULL,
	`show_habits_panel` integer DEFAULT 0,
	`show_quarterly_panel` integer DEFAULT 0,
	`show_challenges_panel` integer DEFAULT 0,
	`onboarding_completed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`current_level` integer DEFAULT 1 NOT NULL,
	`streak_current` integer DEFAULT 0 NOT NULL,
	`streak_max` integer DEFAULT 0 NOT NULL,
	`last_entry_date` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `weekly_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_label` text NOT NULL,
	`focus` text NOT NULL,
	`tasks_json` text NOT NULL,
	`relation_to_nutre` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
