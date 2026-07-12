export const GEMINI_MODEL = 'gemini-3-flash-preview';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const TIMEOUT_MS = 5000;

export function getApiKeys() {
  return {
    gemini: process.env.GOOGLE_AI_STUDIO_KEY,
    groq: process.env.GROQ_API_KEY,
  };
}
