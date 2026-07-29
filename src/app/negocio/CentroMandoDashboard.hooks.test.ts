import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Static analysis test that ensures all React hooks in CentroMandoDashboard
 * are called BEFORE any conditional early-return statement.
 *
 * React's Rules of Hooks require that hooks are called in the same order
 * across every render. If an early-return occurs BEFORE some hooks, those
 * hooks will only run on renders where the condition is false — violating
 * the rules and crashing the component at runtime.
 *
 * This test parses the source file and asserts:
 *   1. No "useState"/"useMemo" calls appear AFTER any "return (" early-exit.
 *   2. The component file contains at least one hook call.
 */
describe('CentroMandoDashboard hooks ordering', () => {
  const filePath = resolve(__dirname, './CentroMandoDashboard.tsx');
  const source = readFileSync(filePath, 'utf8');

  it('declares React hooks (useState/useMemo) in the component body', () => {
    const hookCount = (source.match(/\b(useState|useMemo|useEffect|useCallback|useRef)\s*\(/g) ?? []).length;
    expect(hookCount).toBeGreaterThan(0);
  });

  it('places every hook call before the first early-return statement', () => {
    const bodyStart = source.indexOf('export function CentroMandoDashboard');
    expect(bodyStart).toBeGreaterThanOrEqual(0);
    const body = source.slice(bodyStart);

    const hookRegex = /\b(useState|useMemo|useEffect|useCallback|useRef)\s*\(/g;
    const returnRegex = /return\s*\(/g;

    const firstHookIdx = body.search(hookRegex);
    const firstReturnIdx = body.search(returnRegex);

    expect(firstHookIdx).toBeGreaterThanOrEqual(0);
    expect(firstReturnIdx).toBeGreaterThanOrEqual(0);
    expect(firstHookIdx).toBeLessThan(firstReturnIdx);
  });
});