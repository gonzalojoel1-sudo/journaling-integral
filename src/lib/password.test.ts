import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  beforeAll(() => {
    if (!process.env.PASSWORD_SALT) {
      process.env.PASSWORD_SALT = 'test-salt-for-unit-tests';
    }
  });

  beforeEach(() => {
    process.env.PASSWORD_SALT = 'test-salt-for-unit-tests';
  });

  describe('hashPassword', () => {
    it('produces a 128-character hex string (64 bytes encoded)', () => {
      const hash = hashPassword('mySecretPassword');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(128);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('is deterministic: same password + same salt = same hash', () => {
      const a = hashPassword('repeat-me');
      const b = hashPassword('repeat-me');
      expect(a).toBe(b);
    });

    it('produces different hashes for different passwords', () => {
      const a = hashPassword('password-A');
      const b = hashPassword('password-B');
      expect(a).not.toBe(b);
    });

    it('handles empty string without throwing', () => {
      const hash = hashPassword('');
      expect(hash).toHaveLength(128);
    });
  });

  describe('verifyPassword', () => {
    it('returns true when the password matches the hash', () => {
      const hash = hashPassword('correct-horse-battery-staple');
      expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
    });

    it('returns false when the password does not match the hash', () => {
      const hash = hashPassword('correct-horse-battery-staple');
      expect(verifyPassword('wrong-password', hash)).toBe(false);
    });

    it('returns false (instead of throwing) when PASSWORD_SALT is missing', () => {
      const savedSalt = process.env.PASSWORD_SALT;
      delete process.env.PASSWORD_SALT;
      try {
        const result = verifyPassword('any', 'anyhashvalue');
        expect(result).toBe(false);
      } finally {
        process.env.PASSWORD_SALT = savedSalt;
      }
    });

    it('distinguishes hashes that differ by a single character', () => {
      const hash1 = hashPassword('password1');
      const hash2 = hashPassword('password2');
      expect(verifyPassword('password1', hash2)).toBe(false);
      expect(verifyPassword('password2', hash1)).toBe(false);
    });
  });
});