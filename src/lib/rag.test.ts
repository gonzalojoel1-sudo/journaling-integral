import { describe, it, expect } from 'vitest';
import {
  EMBEDDING_MODEL,
  cosineSimilarity,
  sparseCosineSimilarity,
  tokenize,
  generateEmbedding,
  buildEntryContent,
} from './rag';

describe('rag constants', () => {
  it('uses local-tfidf-v1 embedding model', () => {
    expect(EMBEDDING_MODEL).toBe('local-tfidf-v1');
    expect(EMBEDDING_MODEL).not.toBe('gemini-embedding-001');
    expect(EMBEDDING_MODEL).not.toBe('text-embedding-004');
    expect(EMBEDDING_MODEL.length).toBeGreaterThan(0);
    expect(typeof EMBEDDING_MODEL).toBe('string');
  });
});

describe('tokenize', () => {
  it('lowercases input', () => {
    const tokens = tokenize('Hola MUNDO');
    expect(tokens).toContain('hola');
    expect(tokens).toContain('mundo');
  });

  it('removes diacritics', () => {
    const tokens = tokenize('ñoño ángström über');
    expect(tokens).toContain('nono');
    expect(tokens).toContain('angstrom');
    expect(tokens).toContain('uber');
  });

  it('handles Spanish text correctly', () => {
    const tokens = tokenize('Estoy agradecido por mi familia y mi trabajo');
    expect(tokens).toContain('agradecido');
    expect(tokens).toContain('familia');
    expect(tokens).toContain('trabajo');
    expect(tokens).not.toContain('por');
    expect(tokens).not.toContain('mi');
    expect(tokens).not.toContain('y');
  });

  it('filters out stopwords in English and Spanish', () => {
    const tokens = tokenize('the and for are but not you all');
    expect(tokens).toHaveLength(0);
  });

  it('removes tokens shorter than 3 characters', () => {
    const tokens = tokenize('a be it go run');
    expect(tokens).toEqual(['run']);
  });

  it('returns empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(tokenize('   \t\n  ')).toEqual([]);
  });

  it('removes punctuation via non-alphanumeric characters', () => {
    const tokens = tokenize('hola, mundo! ¿cómo estás?');
    expect(tokens).toContain('hola');
    expect(tokens).toContain('mundo');
    expect(tokens).toContain('como');
    expect(tokens).toContain('estas');
  });

  it('is deterministic for same input', () => {
    const a = tokenize('Quiero descansar en familia');
    const b = tokenize('Quiero descansar en familia');
    expect(a).toEqual(b);
  });
});

describe('generateEmbedding', () => {
  it('returns a sparse vector object', () => {
    const emb = generateEmbedding('hola mundo hola');
    expect(typeof emb).toBe('object');
    expect(emb).not.toBeNull();
    expect(Array.isArray(emb)).toBe(false);
  });

  it('returns consistent output for identical input', () => {
    const a = generateEmbedding('gracias por mi familia');
    const b = generateEmbedding('gracias por mi familia');
    expect(a).toEqual(b);
  });

  it('contains token frequency pairs', () => {
    const emb = generateEmbedding('hola mundo hola');
    expect(emb['hola']).toBeGreaterThan(emb['mundo']);
    expect(emb['hola']).toBeCloseTo(2 / 3, 5);
    expect(emb['mundo']).toBeCloseTo(1 / 3, 5);
  });

  it('normalizes term frequencies', () => {
    const emb = generateEmbedding('casa casa casa');
    const sum = Object.values(emb).reduce((acc, v) => acc + v, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('returns empty object for empty input', () => {
    expect(generateEmbedding('')).toEqual({});
  });

  it('returns empty object for stopwords-only input', () => {
    expect(generateEmbedding('the and for')).toEqual({});
  });

  it('truncates content longer than 8000 characters', () => {
    const longText = 'palabra '.repeat(2000);
    const emb = generateEmbedding(longText);
    expect(Object.keys(emb).length).toBeGreaterThan(0);
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

describe('sparseCosineSimilarity', () => {
  it('returns 1 for identical non-empty vectors', () => {
    const v = { a: 0.1, b: 0.2, c: 0.3 };
    expect(sparseCosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it('returns 0 when vectors share no terms', () => {
    const a = { a: 0.1, b: 0.2 };
    const b = { c: 0.3, d: 0.4 };
    expect(sparseCosineSimilarity(a, b)).toBe(0);
  });

  it('returns 0 when one vector is empty', () => {
    expect(sparseCosineSimilarity({}, { a: 0.1 })).toBe(0);
    expect(sparseCosineSimilarity({ a: 0.1 }, {})).toBe(0);
  });

  it('returns 0 when both vectors are empty', () => {
    expect(sparseCosineSimilarity({}, {})).toBe(0);
  });

  it('returns positive score for overlapping vocabulary', () => {
    const a = { familia: 0.5, trabajo: 0.5 };
    const b = { familia: 0.6, gratitud: 0.4 };
    const score = sparseCosineSimilarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('is invariant to magnitude', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 2, y: 4 };
    expect(sparseCosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });

  it('handles partial overlap correctly', () => {
    const a = { x: 1, y: 0, z: 0 };
    const b = { x: 1, m: 1 };
    const score = sparseCosineSimilarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
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
