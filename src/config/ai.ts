// MiniMax Token Plan configuration
// Docs: https://platform.minimax.io/docs
// Anthropic-compatible: https://api.minimax.io/anthropic
// OpenAI-compatible:    https://api.minimax.io/v1

export const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

export const PRIMARY_MODEL = 'MiniMax-M3';
export const FAST_MODEL = 'MiniMax-M2.7-highspeed';
export const FALLBACK_MODEL = 'MiniMax-M2.7';

export const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';
export const MINIMAX_TIMEOUT_MS = 30_000;

export const TIMEOUT_MS = MINIMAX_TIMEOUT_MS;

// Backwards-compatible aliases (existing imports use these names)
export const GEMINI_MODEL = PRIMARY_MODEL;
export const GROQ_MODEL = FAST_MODEL;

export function getApiKeys() {
  return {
    minimax: process.env.MINIMAX_API_KEY,
    gemini: process.env.MINIMAX_API_KEY,
    groq: process.env.MINIMAX_API_KEY,
  };
}

export function getMinimaxBaseUrl(): string {
  return MINIMAX_BASE_URL;
}
