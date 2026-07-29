import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { PRIMARY_MODEL, FAST_MODEL, MINIMAX_BASE_URL, MINIMAX_TIMEOUT_MS } from '@/config/ai';
import { validate, SmartEntryRequestSchema } from '@/lib/validations';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getSessionUser } from '@/lib/auth';

const SYSTEM_PROMPT = `Eres un extractor de datos para un diario personal de desarrollo integral. El usuario te dara una transcripcion de voz donde describe su dia: niveles de energia, gratitud, identidad, devocional, habitos completados, tareas importantes, y cierre del dia.

Extrae UNICAMENTE los datos mencionados explicitamente en la transcripcion. No inventes nada.

Reglas:
- Ratings de energia/sueno/enfoque/estres: escala 1-10.
- Gratitud (gratitude.items): frases especificas de agradecimiento mencionadas (max 3).
- Habitos (habits.completedNames): array de nombres de habitos completados.
- MIT (mit.*): tareas importantes y si fueron completadas.
- Cierre (closure.*): lo que funciono, lo que no, ideas de mejora, preparacion para manana.
- Negocio (business.*): transacciones de negocio (ventas, proveedores, clientes).
- Finanzas Personales (personal.*): gastos cotidianos e ingresos personales.

Campos no mencionados: retornalos como null o array vacio.`;

const JSON_RESPONSE_PROMPT = `${SYSTEM_PROMPT}

Responde EXCLUSIVAMENTE con un objeto JSON que siga esta estructura exacta:
{
  "energy": { "sleepRating": <number|null>, "energyRating": <number|null>, "focusRating": <number|null>, "stressRating": <number|null>, "quickEnergyAction": <string|null> },
  "gratitude": { "items": <string[]>, "wisdomRequest": <string|null> },
  "identity": { "chooseToBe": <string|null>, "action": <string|null>, "microAchievement": <string|null> },
  "devotional": { "notes": <string|null> },
  "habits": { "completedNames": <string[]> },
  "mit": { "ser": <string|null>, "serCompleted": <boolean|null>, "negocio": <string|null>, "negocioCompleted": <boolean|null>, "relaciones": <string|null>, "relacionesCompleted": <boolean|null> },
  "closure": { "whatWorked": <string|null>, "whatDidNotWork": <string|null>, "improvementIdea": <string|null>, "prepTomorrow": <string[]> },
  "business": { "income": <number|null>, "expenses": <number|null>, "contactsCount": <number|null>, "salesCount": <number|null>, "transactions": <array|null> },
  "personal": { "income": <number|null>, "expenses": <number|null>, "transactions": <array|null> }
}`;

async function tryPrimary(transcript: string): Promise<any> {
  const minimax = createOpenAI({
    baseURL: MINIMAX_BASE_URL,
    apiKey: process.env.MINIMAX_API_KEY,
  });

  const result = await Promise.race([
    generateText({
      model: minimax(PRIMARY_MODEL),
      system: JSON_RESPONSE_PROMPT,
      prompt: transcript,
      temperature: 0.1,
      maxOutputTokens: 2048,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`MiniMax timeout after ${MINIMAX_TIMEOUT_MS}ms`)), MINIMAX_TIMEOUT_MS),
    ),
  ]);

  const content = result.text;
  if (!content) throw new Error('Primary model returned empty response');
  return JSON.parse(content);
}

async function tryFast(transcript: string): Promise<any> {
  const minimax = createOpenAI({
    baseURL: MINIMAX_BASE_URL,
    apiKey: process.env.MINIMAX_API_KEY,
  });

  const result = await Promise.race([
    generateText({
      model: minimax(FAST_MODEL),
      system: JSON_RESPONSE_PROMPT,
      prompt: transcript,
      temperature: 0.1,
      maxOutputTokens: 2048,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`MiniMax timeout after ${MINIMAX_TIMEOUT_MS}ms`)), MINIMAX_TIMEOUT_MS),
    ),
  ]);

  const content = result.text;
  if (!content) throw new Error('Fast model returned empty response');
  return JSON.parse(content);
}

export async function POST(request: Request) {
  // Rate limiting: hybrid key (userId or IP), stricter limit for heavy AI calls
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id ?? undefined;
  const clientId = getClientIdentifier(request, userId);
  const { success: rateLimitOk } = await rateLimit(`smart-entry:${clientId}`, 5, 60000);

  if (!rateLimitOk) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Limit': '5',
        },
      },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  // Zod validation
  const v = validate(SmartEntryRequestSchema, body);
  if (!v.success) {
    return Response.json({ error: v.error }, { status: 400 });
  }

  const { transcript } = v.data;

  try {
    const data = await tryFast(transcript.trim());
    return Response.json({ success: true, data });
  } catch (fastErr: any) {
    logger.warn('smart_entry_fast_failed_trying_primary', { message: fastErr?.message }, fastErr);
  }

  try {
    const data = await tryPrimary(transcript.trim());
    return Response.json({ success: true, data });
  } catch (primaryErr: any) {
    logger.error('smart_entry_both_providers_failed', { message: primaryErr?.message }, primaryErr);
    return Response.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 500 },
    );
  }
}
