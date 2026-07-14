import { createClient } from '@libsql/client';
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const r = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
const tables = r.rows.map(x => x.name);

if (!tables.includes('journal_embeddings')) {
  await db.execute(`
    CREATE TABLE journal_embeddings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
      embedding_type TEXT NOT NULL DEFAULT 'reflection',
      content TEXT NOT NULL,
      model TEXT DEFAULT 'text-embedding-3-small',
      tokens INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  console.log('Created journal_embeddings table.');
} else {
  console.log('journal_embeddings already exists.');
}
