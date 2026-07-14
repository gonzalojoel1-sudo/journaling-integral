import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const oldCols = await db.execute("PRAGMA table_info(habits)");
  const existing = oldCols.rows.map(r => r.name);

  if (!existing.includes('type')) {
    console.log('Schema already up to date.');
    return;
  }

  console.log('Old columns:', existing.join(', '));
  console.log('Recreating habits table...');

  await db.execute("PRAGMA foreign_keys = OFF");

  await db.execute(`
    CREATE TABLE habits_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      habit_type TEXT NOT NULL DEFAULT 'crecer',
      domain TEXT,
      active_action TEXT,
      rescue_action TEXT,
      celebration TEXT DEFAULT '✅ Hecho',
      anchor TEXT,
      if_trigger TEXT,
      if_action TEXT,
      cue TEXT,
      old_routine TEXT,
      new_routine TEXT,
      identity_label TEXT,
      belongs_to_chain_id TEXT,
      next_habit_id TEXT,
      current_strength REAL DEFAULT 0.0,
      last_strength_date TEXT,
      evolution_cycle INTEGER DEFAULT 0,
      days_in_current_cycle INTEGER DEFAULT 0,
      evolution_optimal TEXT,
      evolution_minimum TEXT,
      streak_shields INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      victory_count INTEGER DEFAULT 0,
      temptation_count INTEGER DEFAULT 0,
      trigger_hit_count INTEGER DEFAULT 0,
      action_executed_count INTEGER DEFAULT 0,
      pilar_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL
    )
  `);

  await db.execute(`
    INSERT INTO habits_new (
      id, user_id, name, habit_type, current_strength, last_strength_date,
      created_at, is_active
    )
    SELECT
      id, user_id, name, COALESCE(type, 'crecer'), current_strength, last_strength_date,
      created_at, is_active
    FROM habits
  `);

  const count = await db.execute("SELECT COUNT(*) as c FROM habits_new");
  console.log(`Copied ${count.rows[0].c} rows.`);

  await db.execute("DROP TABLE habits");
  await db.execute("ALTER TABLE habits_new RENAME TO habits");
  await db.execute("PRAGMA foreign_keys = ON");

  console.log('Migration complete.');
  const newCols = await db.execute("PRAGMA table_info(habits)");
  newCols.rows.forEach(r => console.log(`  ${r.name} (${r.type})`));
}

run().catch(e => console.error('Fatal:', e.message));
