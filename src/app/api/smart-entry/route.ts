import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import Groq from 'groq-sdk';

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
- Ratings de energia/sueno/enfoque/estres: escala 1-10. Solo si el usuario menciona un numero o describe su nivel (ej. "dormi bien" = sleepRating 8, "estoy agotado" = energyRating 3).
- Gratitud (gratitude.items): frases especificas de agradecimiento mencionadas (max 3).
- Habitos (habits.completedNames): array de nombres/descripciones de habitos que el usuario dijo haber completado. Se preciso con los nombres.
- MIT (mit.*): tareas importantes y si fueron completadas.
- Cierre (closure.*): lo que funciono, lo que no, ideas de mejora, preparacion para manana.
- Negocio (business.*): ingresos totales, gastos, contactos, ventas. Si el usuario menciona transacciones de negocio (ventas, proveedores, clientes), extraelas en business.transactions[]. Cada transaccion requiere amount y type ('ingreso' o 'gasto'). Campos opcionales: cost, description, source, isSale.
- Finanzas Personales (personal.*): gastos cotidianos e ingresos personales. Si el usuario menciona gastos del dia a dia (ej. "gaste en el supermercado", "pague la luz", "compre comida") o ingresos personales (ej. "me depositaron", "cobre un freelance"), extraelos en personal.transactions[]. Usa category para clasificar (Supermercado, Servicios, Inversiones, Ocio, Transporte, Salud, Educacion, Retiro Negocio, Otros). Usa account para identificar de donde salio o entro el dinero (Banco, Efectivo, Billetera Virtual).

Campos no mencionados: retornalos como null (para strings/numeros) o array vacio (para arrays).`;

const GROQ_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

Responde EXCLUSIVAMENTE con un objeto JSON que siga esta estructura exacta:
{
  "energy": {
    "sleepRating": <number|null>,
    "energyRating": <number|null>,
    "focusRating": <number|null>,
    "stressRating": <number|null>,
    "quickEnergyAction": <string|null>
  },
  "gratitude": {
    "items": <string[]>,
    "wisdomRequest": <string|null>
  },
  "identity": {
    "chooseToBe": <string|null>,
    "action": <string|null>,
    "microAchievement": <string|null>
  },
  "devotional": {
    "notes": <string|null>
  },
  "habits": {
    "completedNames": <string[]>
  },
  "mit": {
    "ser": <string|null>,
    "serCompleted": <boolean|null>,
    "negocio": <string|null>,
    "negocioCompleted": <boolean|null>,
    "relaciones": <string|null>,
    "relacionesCompleted": <boolean|null>
  },
  "closure": {
    "whatWorked": <string|null>,
    "whatDidNotWork": <string|null>,
    "improvementIdea": <string|null>,
    "prepTomorrow": <string[]>
  },
  "business": {
    "income": <number|null>,
    "expenses": <number|null>,
    "contactsCount": <number|null>,
    "salesCount": <number|null>,
    "transactions": <array|null>
  },
  "personal": {
    "income": <number|null>,
    "expenses": <number|null>,
    "transactions": <array|null>
  }
}`;

async function tryGoogle(transcript: string): Promise<any> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) throw new Error('Google API key not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-8b',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: JOURNAL_RESPONSE_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const GOOGLE_TIMEOUT_MS = 5000;

  const result = await Promise.race([
    model.generateContent(transcript),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Google Gemini timeout after 5s')), GOOGLE_TIMEOUT_MS)
    ),
  ]);

  const text = result.response.text();
  return JSON.parse(text);
}

async function tryGroq(transcript: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not configured');

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
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
  const { transcript } = await request.json();

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return Response.json({ error: 'Transcript is required' }, { status: 400 });
  }

  console.log('[SMART-ENTRY] API Key Google:', !!process.env.GOOGLE_AI_STUDIO_KEY);
  console.log('[SMART-ENTRY] API Key Groq:', !!process.env.GROQ_API_KEY);

  // --- Intent 1: Google Gemini ---
  try {
    console.log('[SMART-ENTRY] Trying Google Gemini...');
    const data = await tryGoogle(transcript.trim());
    console.log('[SMART-ENTRY] Google Gemini success');
    return Response.json({ success: true, data });
  } catch (googleError: any) {
    console.warn('[SMART-ENTRY] Google Gemini failed, falling back to Groq...');
    console.warn('[SMART-ENTRY] Google error:', googleError?.message || googleError);
  }

  // --- Intent 2: Groq Fallback ---
  try {
    console.log('[SMART-ENTRY] Attempting Groq fallback...');
    const data = await tryGroq(transcript.trim());
    console.log('[SMART-ENTRY] Groq fallback success');
    return Response.json({ success: true, data });
  } catch (groqError: any) {
    console.error('[SMART-ENTRY] Groq fallback also failed:', groqError?.message || groqError);

    return Response.json(
      { error: 'Both Google Gemini and Groq failed to process the entry' },
      { status: 500 },
    );
  }
}
