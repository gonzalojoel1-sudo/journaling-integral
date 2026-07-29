import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({ url: 'file:./local.db' });

async function applyFKCascade() {
  console.log('--- Pre-migration state ---');
  const before = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('circles', 'circle_members')"
  );
  console.log('Existing tables:', before.rows.map(r => r.name));

  const circlesBefore = await db.execute('SELECT COUNT(*) as n FROM circles');
  const membersBefore = await db.execute('SELECT COUNT(*) as n FROM circle_members');
  console.log(`Circles: ${circlesBefore.rows[0].n}, Members: ${membersBefore.rows[0].n}`);

  console.log('\n--- Applying FK cascade migration ---');

  await db.execute('PRAGMA foreign_keys = OFF');
  console.log('  ✓ FK disabled');

  // circles
  await db.execute(`
    CREATE TABLE __new_circles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT DEFAULT 'Mi Círculo' NOT NULL,
      created_by TEXT NOT NULL,
      visibility_settings TEXT DEFAULT 'only_streak' NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
    )
  `);
  await db.execute(`
    INSERT INTO __new_circles (id, name, created_by, visibility_settings, created_at)
    SELECT id, name, created_by, visibility_settings, created_at FROM circles
  `);
  const circlesCopied = await db.execute('SELECT COUNT(*) as n FROM __new_circles');
  console.log(`  ✓ Copied ${circlesCopied.rows[0].n} circles`);

  await db.execute('DROP TABLE circles');
  await db.execute('ALTER TABLE __new_circles RENAME TO circles');
  await db.execute('CREATE INDEX IF NOT EXISTS circles_created_by_idx ON circles (created_by)');
  console.log('  ✓ circles replaced with ON DELETE CASCADE');

  // circle_members
  await db.execute(`
    CREATE TABLE __new_circle_members (
      id TEXT PRIMARY KEY NOT NULL,
      circle_id TEXT NOT NULL,
      user_id TEXT,
      invited_by TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      joined_at TEXT,
      invite_code TEXT NOT NULL,
      FOREIGN KEY (circle_id) REFERENCES circles(id) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (invited_by) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
    )
  `);
  await db.execute(`
    INSERT INTO __new_circle_members (id, circle_id, user_id, invited_by, status, joined_at, invite_code)
    SELECT id, circle_id, user_id, invited_by, status, joined_at, invite_code FROM circle_members
  `);
  const membersCopied = await db.execute('SELECT COUNT(*) as n FROM __new_circle_members');
  console.log(`  ✓ Copied ${membersCopied.rows[0].n} members`);

  await db.execute('DROP TABLE circle_members');
  await db.execute('ALTER TABLE __new_circle_members RENAME TO circle_members');
  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS circle_members_invite_code_unique ON circle_members (invite_code)');
  await db.execute('CREATE INDEX IF NOT EXISTS circle_members_circle_status_idx ON circle_members (circle_id, status)');
  console.log('  ✓ circle_members replaced with ON DELETE CASCADE');

  await db.execute('PRAGMA foreign_keys = ON');
  console.log('  ✓ FK re-enabled');

  console.log('\n--- Post-migration verification ---');
  const circlesAfter = await db.execute('SELECT COUNT(*) as n FROM circles');
  const membersAfter = await db.execute('SELECT COUNT(*) as n FROM circle_members');
  console.log(`Circles: ${circlesAfter.rows[0].n}, Members: ${membersAfter.rows[0].n}`);

  // Verify FK cascades are set
  const fkCheck = await db.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('circles', 'circle_members')"
  );
  for (const row of fkCheck.rows) {
    const sqlText = String(row.sql ?? '');
    const cascadeCount = (sqlText.match(/ON DELETE cascade/gi) || []).length;
    console.log(`  ${row.name}: ${cascadeCount} ON DELETE CASCADE`);
  }
}

applyFKCascade()
  .then(() => {
    console.log('\n✓ Migration complete');
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
  });
