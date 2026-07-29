import { z } from 'zod';
import { logger } from './logger';

export function parseJsonColumn<T>(
  raw: string | null | undefined,
  schema: z.ZodSchema<T>,
  fallback: T,
): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    logger.warn(
      'json_column_schema_mismatch',
      { rawPreview: raw.slice(0, 100) },
    );
    return fallback;
  } catch (e) {
    logger.warn('json_column_parse_error', { rawPreview: raw.slice(0, 100) }, e);
    return fallback;
  }
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    logger.warn('json_parse_error', { rawPreview: raw.slice(0, 100) }, e);
    return fallback;
  }
}