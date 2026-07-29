// MiniMax-specific provider options
// MiniMax-M3 enables thinking by default. Disable it to save tokens
// and reduce latency while keeping the M3 model.
// Docs: https://platform.minimax.io/docs/api-reference/text-openai-api#thinking-control
//
// Usage:
//   import { MINIMAX_NO_THINKING } from '@/lib/minimax-options';
//   generateText({ model: minimax('MiniMax-M3'), providerOptions: MINIMAX_NO_THINKING, ... })

// Note: SharedV3ProviderOptions from @ai-sdk/provider is a transitive
// dependency. Using a structural type here keeps this module
// self-contained while AI SDK validates the value at runtime.
export const MINIMAX_NO_THINKING = {
  openai: {
    thinking: { type: 'disabled' },
  },
} as const;
