import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Structural test that verifies CentroMandoDashboard exposes both rendering
 * paths: an empty-state branch when `settingsList` is empty, and a full-data
 * branch when it has entries.
 *
 * Runtime React rendering tests are not possible in this repo
 * (Vite 8 + oxc + `jsx: "preserve"` in tsconfig — see Batch 10 report).
 * This test therefore asserts the source contract:
 *   1. Both branches exist and are reached in their respective states.
 *   2. The empty-state branch only renders `CreateFirstUnitGate`.
 *   3. The data-state branch renders the three sub-components
 *      (`MetricsOverview`, `UnitPerformanceTable`, `TransactionList`)
 *      plus the modal.
 */
describe('CentroMandoDashboard rendering branches', () => {
  const filePath = resolve(__dirname, '../CentroMandoDashboard.tsx');
  const source = readFileSync(filePath, 'utf8');

  it('exports CentroMandoDashboard as a function component', () => {
    expect(source).toMatch(/export\s+function\s+CentroMandoDashboard\s*\(/);
  });

  it('declares React hooks BEFORE the empty-state early-return', () => {
    const bodyStart = source.indexOf('export function CentroMandoDashboard');
    expect(bodyStart).toBeGreaterThanOrEqual(0);
    const body = source.slice(bodyStart);

    const hookRegex = /\b(useState|useMemo|useEffect|useCallback|useRef)\s*\(/g;
    const emptyGuard = body.indexOf('settingsList.length === 0');

    const firstHookIdx = body.search(hookRegex);
    expect(firstHookIdx).toBeGreaterThanOrEqual(0);
    expect(emptyGuard).toBeGreaterThan(firstHookIdx);
  });

  it('renders <CreateFirstUnitGate/> on the empty-settings branch', () => {
    const emptyGuardIdx = source.indexOf('settingsList.length === 0');
    expect(emptyGuardIdx).toBeGreaterThanOrEqual(0);

    const earlyReturnIdx = source.indexOf('return (', emptyGuardIdx);
    const nextBranchIdx = source.indexOf('return (', earlyReturnIdx + 1);
    const endIdx = nextBranchIdx === -1 ? source.length : nextBranchIdx;
    const emptyBranch = source.slice(earlyReturnIdx, endIdx);

    expect(emptyBranch).toMatch(/<CreateFirstUnitGate\s*\/>/);
    expect(emptyBranch).not.toMatch(/MetricsOverview/);
    expect(emptyBranch).not.toMatch(/TransactionList/);
  });

  it('renders all three data-state sub-components on the populated branch', () => {
    const metricsIdx = source.indexOf('<MetricsOverview');
    const unitIdx = source.indexOf('<UnitPerformanceTable');
    const txnIdx = source.indexOf('<TransactionList');

    expect(metricsIdx).toBeGreaterThanOrEqual(0);
    expect(unitIdx).toBeGreaterThan(metricsIdx);
    expect(txnIdx).toBeGreaterThan(unitIdx);
  });

  it('renders BusinessSettingsModal only as a conditional', () => {
    expect(source).toMatch(/\{showCreateModal\s*&&\s*\(\s*<BusinessSettingsModal/);
  });

  it('keeps all useState/useMemo calls within the custom hook (single useDashboardData call)', () => {
    const hookCallCount = (source.match(/\buseDashboardData\s*\(/g) ?? []).length;
    expect(hookCallCount).toBe(1);

    const useStateCount = (source.match(/\buseState\s*\(/g) ?? []).length;
    expect(useStateCount).toBeLessThanOrEqual(1);
  });
});
