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

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:local.db',
  },
});
