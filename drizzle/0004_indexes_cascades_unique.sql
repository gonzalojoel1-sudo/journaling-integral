-- 0004_indexes_cascades_unique.sql
-- BATCH 5: Database optimization
-- - 8 índices nuevos (user+date, user+status, user+badge, etc.)
-- - 1 índice simple en business_settings.user_id
-- - 1 UNIQUE INDEX parcial en business_settings(user_id) WHERE is_active=1
-- - ON DELETE CASCADE en circles.created_by y circle_members.{circle_id,user_id,invited_by}
-- - Requiere recrear circles y circle_members (SQLite no permite ALTER FK)

-- ============================================
-- ÍNDICES NUEVOS (no requieren recrear tabla)
-- ============================================
CREATE INDEX IF NOT EXISTS `daily_entries_user_date_idx` ON `daily_entries` (`user_id`, `date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `habits_user_active_idx` ON `habits` (`user_id`, `is_active`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `business_transactions_user_date_idx` ON `business_transactions` (`user_id`, `date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `personal_transactions_user_date_idx` ON `personal_transactions` (`user_id`, `date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `challenges_user_idx` ON `challenges` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `badges_user_badge_idx` ON `badges` (`user_id`, `badge_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `business_settings_user_idx` ON `business_settings` (`user_id`);--> statement-breakpoint

-- ============================================
-- UNIQUE INDEX PARCIAL (constraint único)
-- Garantiza UN solo business_settings con is_active=1 por usuario
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS `business_settings_user_active_unique`
  ON `business_settings` (`user_id`) WHERE `is_active` = 1;--> statement-breakpoint

-- ============================================
-- RECREAR circles CON ON DELETE CASCADE
-- SQLite no permite modificar FKs in-place
-- ============================================
PRAGMA foreign_keys = OFF;--> statement-breakpoint
CREATE TABLE `__new_circles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Mi Círculo' NOT NULL,
	`created_by` text NOT NULL,
	`visibility_settings` text DEFAULT 'only_streak' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_circles` ("id", "name", "created_by", "visibility_settings", "created_at")
  SELECT "id", "name", "created_by", "visibility_settings", "created_at" FROM `circles`;--> statement-breakpoint
DROP TABLE `circles`;--> statement-breakpoint
ALTER TABLE `__new_circles` RENAME TO `circles`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `circles_created_by_idx` ON `circles` (`created_by`);--> statement-breakpoint

-- ============================================
-- RECREAR circle_members CON ON DELETE CASCADE
-- ============================================
CREATE TABLE `__new_circle_members` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`user_id` text,
	`invited_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`joined_at` text,
	`invite_code` text NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_circle_members` ("id", "circle_id", "user_id", "invited_by", "status", "joined_at", "invite_code")
  SELECT "id", "circle_id", "user_id", "invited_by", "status", "joined_at", "invite_code" FROM `circle_members`;--> statement-breakpoint
DROP TABLE `circle_members`;--> statement-breakpoint
ALTER TABLE `__new_circle_members` RENAME TO `circle_members`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `circle_members_invite_code_unique` ON `circle_members` (`invite_code`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `circle_members_circle_status_idx` ON `circle_members` (`circle_id`, `status`);--> statement-breakpoint
PRAGMA foreign_keys = ON;