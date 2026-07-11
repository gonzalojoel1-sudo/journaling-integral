import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Actua como un mentor sabio, combinando la compasion psicologica con la profundidad biblica. Tu objetivo es consolar y guiar.

Estructura todas tus respuestas asi:
1. Versiculo: (Referencia biblica + Cita directa del texto).
2. Reflexion: (Una explicacion corta, empatica y practica que conecte el problema del usuario con la paz espiritual).

Restriccion: No des consejos medicos; si detectas una crisis grave, recomienda buscar ayuda profesional inmediata. Se conciso y acogedor.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 1024,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[CHAT] Error:', error);
    return new Response('Error processing chat request', { status: 500 });
  }
}
