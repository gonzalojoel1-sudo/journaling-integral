import { describe, it, expect } from 'vitest';
import * as constantsDemo from './constants-demo';

describe('constants-demo module exports', () => {
  it('only exports the four expected demo constants', () => {
    const exportNames = Object.keys(constantsDemo).sort();
    expect(exportNames).toEqual([
      'DEMO_USER_EMAIL',
      'DEMO_USER_ID',
      'DEMO_USER_NAME',
      'DEMO_USER_PASSWORD_HASH',
    ]);
  });

  it('exports DEMO_USER_ID as a stable string literal', () => {
    expect(constantsDemo.DEMO_USER_ID).toBe('demo-user-id');
  });

  it('exports DEMO_USER_EMAIL as a stable string literal', () => {
    expect(constantsDemo.DEMO_USER_EMAIL).toBe('joel@journalingintegral.demo');
  });

  it('exports DEMO_USER_NAME as a stable string literal', () => {
    expect(constantsDemo.DEMO_USER_NAME).toBe('Joel Pacheco');
  });

  it('exports DEMO_USER_PASSWORD_HASH as a 128-char hex string', () => {
    expect(typeof constantsDemo.DEMO_USER_PASSWORD_HASH).toBe('string');
    expect(constantsDemo.DEMO_USER_PASSWORD_HASH).toMatch(/^[0-9a-f]{128}$/);
  });

  it('does not expose any function or class exports', () => {
    const exportTypes = Object.values(constantsDemo).map((v) => typeof v);
    for (const t of exportTypes) {
      expect(t).toBe('string');
    }
  });
});
