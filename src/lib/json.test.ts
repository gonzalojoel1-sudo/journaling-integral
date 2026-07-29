import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { parseJsonColumn, safeJsonParse } from './json';

describe('parseJsonColumn', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns fallback when raw is null', () => {
    const fallback: string[] = [];
    const result = parseJsonColumn(null, z.array(z.string()), fallback);
    expect(result).toEqual([]);
    expect(result).toBe(fallback);
  });

  it('returns fallback when raw is undefined', () => {
    const fallback: string[] = ['default'];
    const result = parseJsonColumn(undefined, z.array(z.string()), fallback);
    expect(result).toEqual(['default']);
  });

  it('returns fallback when raw is empty string', () => {
    const fallback: string[] = [];
    const result = parseJsonColumn('', z.array(z.string()), fallback);
    expect(result).toEqual([]);
  });

  it('returns fallback when JSON is invalid', () => {
    const fallback: string[] = [];
    const result = parseJsonColumn('not-json', z.array(z.string()), fallback);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns fallback when JSON does not match schema', () => {
    const fallback: string[] = [];
    const result = parseJsonColumn(
      JSON.stringify({ foo: 'bar' }),
      z.array(z.string()),
      fallback,
    );
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns parsed data when schema matches', () => {
    const raw = JSON.stringify(['a', 'b', 'c']);
    const result = parseJsonColumn(raw, z.array(z.string()), []);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('returns parsed object data when schema matches', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const raw = JSON.stringify({ name: 'Joel', age: 30 });
    const result = parseJsonColumn(raw, schema, { name: '', age: 0 });
    expect(result).toEqual({ name: 'Joel', age: 30 });
  });

  it('does not throw with malformed input', () => {
    expect(() =>
      parseJsonColumn('}{][}{', z.array(z.string()), []),
    ).not.toThrow();
  });
});

describe('safeJsonParse', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns fallback when raw is null', () => {
    const fallback = { default: true };
    const result = safeJsonParse(null, fallback);
    expect(result).toBe(fallback);
  });

  it('returns fallback when raw is undefined', () => {
    const fallback: number[] = [];
    const result = safeJsonParse(undefined, fallback);
    expect(result).toBe(fallback);
  });

  it('returns fallback when JSON is invalid', () => {
    const fallback: number[] = [];
    const result = safeJsonParse('not-json-{}', fallback);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns parsed value when JSON is valid', () => {
    const result = safeJsonParse<{ a: number }>('{"a":1}', { a: 0 });
    expect(result).toEqual({ a: 1 });
  });

  it('does not throw on garbage input', () => {
    expect(() => safeJsonParse('\x00\x01\x02', null)).not.toThrow();
  });
});