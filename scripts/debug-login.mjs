import { createClient } from '@libsql/client';
import { scryptSync } from 'crypto';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  // 1. Check the user record
  const user = await db.execute(
    "SELECT id, email, name, password FROM users WHERE email = 'joel@journalingintegral.demo'"
  );
  if (user.rows.length === 0) {
    console.log('USER NOT FOUND');
    return;
  }
  const u = user.rows[0];
  console.log('User found:', u.email);

  // 2. Hash admin123 with the exact same function
  const salt = 'journaling-integral-salt-key';
  const inputHash = scryptSync('admin123', salt, 64).toString('hex');
  console.log('Input password hash:', inputHash);
  console.log('Stored password hash:', u.password);
  console.log('Hashes match:', inputHash === u.password);

  // 3. Check if Vercel might be hitting a different DB
  console.log('\nTURSO_DATABASE_URL set:', !!process.env.TURSO_DATABASE_URL);
  console.log('TURSO_AUTH_TOKEN set:', !!process.env.TURSO_AUTH_TOKEN);

  // 4. Count total users
  const all = await db.execute("SELECT COUNT(*) as c FROM users");
  console.log('Total users in this DB:', all.rows[0].c);
}
main().catch(e => console.error('Error:', e));
