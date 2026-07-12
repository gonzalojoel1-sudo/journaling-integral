import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';

/**
 * Creates a database client with dual-mode support:
 * - Turso (remote) if TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set
 * - SQLite local fallback using DATABASE_URL or file:local.db
 *
 * This is non-breaking: if no Turso variables are configured,
 * the app continues to work exactly as before with the local file.
 */
function createDatabaseClient(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    return createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  const localUrl = process.env.DATABASE_URL || 'file:local.db';
  return createClient({
    url: localUrl,
  });
}

const client = createDatabaseClient();

export const db = drizzle(client, { schema });
