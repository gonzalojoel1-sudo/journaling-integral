import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

config({
  path: resolve(process.cwd(), envFile),
  override: false,
});

config({
  path: resolve(process.cwd(), '.env'),
  override: false,
});

/**
 * Dual-mode database credentials for drizzle-kit:
 * - Turso remote: uses TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 * - SQLite local fallback: uses DATABASE_URL or file:local.db
 */
function getDbCredentials() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    return {
      url: tursoUrl,
      authToken: tursoToken,
    };
  }

  return {
    url: process.env.DATABASE_URL || 'file:local.db',
  };
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: getDbCredentials(),
});
