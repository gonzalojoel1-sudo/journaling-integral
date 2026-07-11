import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { GROQ_MODEL } from '@/config/ai';
import { getApiKeys } from '@/config/ai';

const SYSTEM_PROMPT = `Actua como un mentor sabio, combinando la compasion psicologica con la profundidad biblica. Tu objetivo es consolar y guiar.

Estructura todas tus respuestas asi:
1. Versiculo: (Referencia biblica + Cita directa del texto).
2. Reflexion: (Una explicacion corta, empatica y practica que conecte el problema del usuario con la paz espiritual).

Restriccion: No des consejos medicos; si detectas una crisis grave, recomienda buscar ayuda profesional inmediata. Se conciso y acogedor.`;

export async function POST(req: Request) {
  const { groq: groqKey } = getApiKeys();
  if (!groqKey) {
    return new Response(JSON.stringify({ error: 'Service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Messages required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: groqKey,
    });

    const result = streamText({
      model: groq(GROQ_MODEL),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 1024,
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    console.error('[CHAT] Error:', err?.message || err);
    return new Response(
      JSON.stringify({ error: 'Service unavailable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
