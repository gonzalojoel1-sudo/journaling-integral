import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    debugSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  function setEnv(value: string | undefined) {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  }

  describe('debug', () => {
    it('does not write in production', () => {
      setEnv('production');
      logger.debug('hidden_in_prod', { foo: 'bar' });
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('writes in non-production environments', () => {
      setEnv('development');
      logger.debug('visible_in_dev', { foo: 'bar' });
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('info', () => {
    it('always writes regardless of environment', () => {
      setEnv('production');
      logger.info('always_logged', { foo: 'bar' });
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('emits JSON parseable output with timestamp, level and msg', () => {
      logger.info('parseable_check', { userId: 'u1' });
      const raw = infoSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.level).toBe('info');
      expect(parsed.msg).toBe('parseable_check');
      expect(parsed.userId).toBe('u1');
      expect(typeof parsed.ts).toBe('string');
      expect(() => new Date(parsed.ts).toISOString()).not.toThrow();
    });
  });

  describe('warn', () => {
    it('formats output correctly including error message', () => {
      const err = new Error('something bad');
      logger.warn('warn_event', { route: '/x' }, err);
      const raw = warnSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.level).toBe('warn');
      expect(parsed.msg).toBe('warn_event');
      expect(parsed.route).toBe('/x');
      expect(parsed.error.message).toBe('something bad');
      expect(typeof parsed.error.stack).toBe('string');
      expect(parsed.error.name).toBe('Error');
    });
  });

  describe('error', () => {
    it('includes stack trace when given an Error', () => {
      const err = new Error('boom');
      logger.error('error_event', { ctx: 1 }, err);
      const raw = errorSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.level).toBe('error');
      expect(parsed.error.message).toBe('boom');
      expect(parsed.error.stack).toContain('Error: boom');
    });

    it('serializes non-Error throws via String()', () => {
      logger.error('error_event', {}, 'just a string');
      const raw = errorSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.error).toBe('just a string');
    });
  });
});