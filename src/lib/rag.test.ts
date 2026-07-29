import { describe, it, expect } from 'vitest';
import {
  EMBEDDING_MODEL,
  cosineSimilarity,
  buildEntryContent,
} from './rag';

describe('rag constants', () => {
  it('uses a valid embedding model name (no deprecated gemini-embedding-001)', () => {
    expect(EMBEDDING_MODEL).not.toBe('gemini-embedding-001');
    expect(EMBEDDING_MODEL.length).toBeGreaterThan(0);
    expect(typeof EMBEDDING_MODEL).toBe('string');
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [0.1, 0.2, 0.3, 0.4];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it('returns -1 for opposite vectors', () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  it('returns 0 when vectors have different lengths', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it('returns 0 when either vector is empty', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 2], [])).toBe(0);
  });

  it('returns 0 when both vectors are zero', () => {
    expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('is invariant to vector magnitude', () => {
    const a = [1, 2, 3];
    const b = [2, 4, 6];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });
});

describe('buildEntryContent', () => {
  it('returns empty string for empty entry', () => {
    expect(buildEntryContent({})).toBe('');
  });

  it('includes date when provided', () => {
    const out = buildEntryContent({ date: '2026-07-29' });
    expect(out).toContain('Fecha: 2026-07-29');
  });

  it('includes all four ratings when provided', () => {
    const out = buildEntryContent({
      sleepRating: 8,
      energyRating: 7,
      focusRating: 9,
      stressRating: 3,
    });
    expect(out).toContain('Sueño: 8/10');
    expect(out).toContain('Energía: 7/10');
    expect(out).toContain('Enfoque: 9/10');
    expect(out).toContain('Estrés: 3/10');
  });

  it('includes gratitude items', () => {
    const out = buildEntryContent({
      gratitude1: 'familia',
      gratitude2: 'salud',
      gratitude3: 'trabajo',
    });
    expect(out).toContain('Gratitud 1: familia');
    expect(out).toContain('Gratitud 2: salud');
    expect(out).toContain('Gratitud 3: trabajo');
  });

  it('marks MIT as completed when boolean is true', () => {
    const out = buildEntryContent({
      mitSer: 'oracion',
      mitSerCompleted: true,
    });
    expect(out).toContain('MIT Ser: oracion (completado)');
  });

  it('marks MIT as not completed when boolean is false/undefined', () => {
    const out = buildEntryContent({
      mitNegocio: 'ventas',
      mitNegocioCompleted: false,
    });
    expect(out).toContain('MIT Negocio: ventas');
    expect(out).not.toContain('completado');
  });

  it('includes legacy reflection when provided', () => {
    const out = buildEntryContent({
      legacyReflection: 'Quiero dejar huella en mi familia',
    });
    expect(out).toContain('Reflexión de legado: Quiero dejar huella en mi familia');
  });

  it('joins parts with ". " separator', () => {
    const out = buildEntryContent({
      gratitude1: 'a',
      gratitude2: 'b',
    });
    expect(out.split('. ')).toHaveLength(2);
  });
});
