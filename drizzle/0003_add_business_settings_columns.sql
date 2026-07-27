ALTER TABLE `business_settings` ADD `category` text DEFAULT 'Servicio' NOT NULL;
ALTER TABLE `business_settings` ADD `monthly_goal` real DEFAULT 0 NOT NULL;
ALTER TABLE `business_settings` ADD `is_recurring` integer DEFAULT 0 NOT NULL;