-- 0005_embedding_model_version.sql
-- BATCH 8: AI fixes — track embedding model version to detect incompatibilities
-- after model upgrades.

ALTER TABLE `journal_embeddings` ADD COLUMN `model_version` TEXT NOT NULL DEFAULT 'text-embedding-004';--> statement-breakpoint
