import { scryptSync } from 'crypto';

function getSalt(): string {
  const envSalt = process.env.PASSWORD_SALT;
  if (!envSalt) {
    throw new Error('PASSWORD_SALT environment variable is not set');
  }
  return envSalt;
}

export function hashPassword(password: string): string {
  const salt = getSalt();
  return scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const salt = getSalt();
    const derived = scryptSync(password, salt, 64).toString('hex');
    return derived === hash;
  } catch {
    return false;
  }
}
