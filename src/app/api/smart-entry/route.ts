import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { GEMINI_MODEL, GROQ_MODEL, TIMEOUT_MS, getApiKeys } from '@/config/ai';
import { validate, SmartEntryRequestSchema } from '@/lib/validations';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

const JOURNAL_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT as const,
  properties: {
    energy: {
      type: SchemaType.OBJECT,
      properties: {
        sleepRating: { type: SchemaType.INTEGER, nullable: true },
        energyRating: { type: SchemaType.INTEGER, nullable: true },
        focusRating: { type: SchemaType.INTEGER, nullable: true },
        stressRating: { type: SchemaType.INTEGER, nullable: true },
        quickEnergyAction: { type: SchemaType.STRING, nullable: true },
      },
    },
    gratitude: {
      type: SchemaType.OBJECT,
      properties: {
        items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
        wisdomRequest: { type: SchemaType.STRING, nullable: true },
      },
    },
    identity: {
      type: SchemaType.OBJECT,
      properties: {
        chooseToBe: { type: SchemaType.STRING, nullable: true },
        action: { type: SchemaType.STRING, nullable: true },
        microAchievement: { type: SchemaType.STRING, nullable: true },
      },
    },
    devotional: {
      type: SchemaType.OBJECT,
      properties: {
        notes: { type: SchemaType.STRING, nullable: true },
      },
    },
    habits: {
      type: SchemaType.OBJECT,
      properties: {
        completedNames: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
    },
    mit: {
      type: SchemaType.OBJECT,
      properties: {
        ser: { type: SchemaType.STRING, nullable: true },
        serCompleted: { type: SchemaType.BOOLEAN, nullable: true },
        negocio: { type: SchemaType.STRING, nullable: true },
        negocioCompleted: { type: SchemaType.BOOLEAN, nullable: true },
        relaciones: { type: SchemaType.STRING, nullable: true },
        relacionesCompleted: { type: SchemaType.BOOLEAN, nullable: true },
      },
    },
    closure: {
      type: SchemaType.OBJECT,
      properties: {
        whatWorked: { type: SchemaType.STRING, nullable: true },
        whatDidNotWork: { type: SchemaType.STRING, nullable: true },
        improvementIdea: { type: SchemaType.STRING, nullable: true },
        prepTomorrow: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
      },
    },
    business: {
      type: SchemaType.OBJECT,
      properties: {
        income: { type: SchemaType.NUMBER, nullable: true },
        expenses: { type: SchemaType.NUMBER, nullable: true },
        contactsCount: { type: SchemaType.INTEGER, nullable: true },
        salesCount: { type: SchemaType.INTEGER, nullable: true },
        transactions: {
          type: SchemaType.ARRAY,
          nullable: true,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              amount: { type: SchemaType.NUMBER },
              cost: { type: SchemaType.NUMBER, nullable: true },
              type: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING, nullable: true },
              source: { type: SchemaType.STRING, nullable: true },
              isSale: { type: SchemaType.BOOLEAN, nullable: true },
            },
          },
        },
      },
    },
    personal: {
      type: SchemaType.OBJECT,
      properties: {
        income: { type: SchemaType.NUMBER, nullable: true },
        expenses: { type: SchemaType.NUMBER, nullable: true },
        transactions: {
          type: SchemaType.ARRAY,
          nullable: true,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              amount: { type: SchemaType.NUMBER },
              type: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING, nullable: true },
              account: { type: SchemaType.STRING, nullable: true },
              description: { type: SchemaType.STRING, nullable: true },
            },
          },
        },
      },
    },
  },
} as const;

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

const GROQ_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

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

async function tryGemini(transcript: string): Promise<any> {
  const { gemini } = getApiKeys();
  if (!gemini) throw new Error('Google API key not configured');

  const genAI = new GoogleGenerativeAI(gemini);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: JOURNAL_RESPONSE_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await Promise.race([
    model.generateContent(transcript),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
    ),
  ]);

  return JSON.parse(result.response.text());
}

async function tryGroq(transcript: string): Promise<any> {
  const { groq: groqKey } = getApiKeys();
  if (!groqKey) throw new Error('Groq API key not configured');

  const groq = new Groq({ apiKey: groqKey });

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: GROQ_SYSTEM_PROMPT },
      { role: 'user', content: transcript },
    ],
    temperature: 0.1,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty response');

  return JSON.parse(content);
}

export async function POST(request: Request) {
  // Rate limiting: hybrid key (userId or IP), stricter limit for heavy AI calls
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const clientId = getClientIdentifier(request, userId);
  const { success: rateLimitOk, remaining } = await rateLimit(`smart-entry:${clientId}`, 5, 60000);

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
    const data = await tryGroq(transcript.trim());
    return Response.json({ success: true, data });
  } catch (groqErr: any) {
    console.warn('[SMART-ENTRY] Groq failed, trying Gemini fallback:', groqErr?.message || groqErr);
  }

  try {
    const data = await tryGemini(transcript.trim());
    return Response.json({ success: true, data });
  } catch (geminiErr: any) {
    console.error('[SMART-ENTRY] Both providers failed. Gemini:', geminiErr?.message || geminiErr);
    return Response.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 500 },
    );
  }
}
