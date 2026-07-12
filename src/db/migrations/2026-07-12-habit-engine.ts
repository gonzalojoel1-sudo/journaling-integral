import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function migrate() {
  await db.run(sql`
    CREATE TABLE habits_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      habit_type TEXT NOT NULL DEFAULT 'crecer',
      domain TEXT,
      rescue_action TEXT,
      active_action TEXT,
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
      created_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL
    );

    INSERT INTO habits_new (id, user_id, name, habit_type, domain, active_action, current_strength, last_strength_date, created_at, is_active)
    SELECT
      id,
      user_id,
      name,
      CASE
        WHEN type IN ('ESTANDARIZAR', 'STACK') THEN 'crecer'
        WHEN type = 'OPTIMIZAR' THEN 'sembrar'
        WHEN type = 'REEMPLAZAR' THEN 'cambiar'
        ELSE 'crecer'
      END,
      CASE
        WHEN type IN ('fe', 'negocio', 'cuerpo', 'mente', 'relaciones', 'personal')
        THEN CASE type
          WHEN 'fe' THEN 'espiritual'
          WHEN 'negocio' THEN 'trabajo'
          WHEN 'cuerpo' THEN 'cuerpo'
          WHEN 'mente' THEN 'mente'
          WHEN 'relaciones' THEN 'relaciones'
          WHEN 'personal' THEN NULL
        END
        ELSE NULL
      END,
      NULL,
      current_strength,
      last_strength_date,
      created_at,
      is_active
    FROM habits;

    DROP TABLE habits;
    ALTER TABLE habits_new RENAME TO habits;
  `);
}
