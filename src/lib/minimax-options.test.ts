import { describe, it, expect } from 'vitest';
import { MINIMAX_NO_THINKING } from './minimax-options';

describe('minimax-options', () => {
  it('exports a constant with thinking disabled', () => {
    expect(MINIMAX_NO_THINKING).toBeDefined();
    expect(MINIMAX_NO_THINKING).toEqual({
      openai: {
        thinking: { type: 'disabled' },
      },
    });
  });

  it('targets the OpenAI provider key (for OpenAI-compatible APIs)', () => {
    expect(MINIMAX_NO_THINKING).toHaveProperty('openai');
    expect(MINIMAX_NO_THINKING.openai).toHaveProperty('thinking');
  });

  it('thinking is explicitly set to disabled (not adaptive or omitted)', () => {
    const thinking = MINIMAX_NO_THINKING.openai.thinking as { type: string };
    expect(thinking.type).toBe('disabled');
    expect(thinking.type).not.toBe('adaptive');
  });
});
