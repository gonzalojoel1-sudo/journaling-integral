import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { validate, ChatRequestSchema } from '@/lib/validations';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { searchSimilarEntries } from '@/lib/rag';
import { db } from '@/db/db';
import { businessTransactions, habits } from '@/db/schema';
import { randomUUID } from 'crypto';

// ============================================================
// RAG: Format context for prompt injection
// ============================================================

interface SimilarEntry {
  content: string;
  similarity: number;
  date: string;
}

function formatContextForPrompt(entries: SimilarEntry[]): string {
  if (entries.length === 0) return '';

  return entries
    .map((e) => `[${e.date}] ${e.content}`)
    .join('\n\n');
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

const SYSTEM_PROMPT = `Eres un Mentor Integral de Vida y Negocios de élite. Tu personalidad fusiona la empatía profunda y la sabiduría espiritual de un pastor evangelista y erudito bíblico, la agudeza analítica de un psicólogo clínico, y la visión estratégica, cruda y práctica de un experto en finanzas, marketing y escalado de empresas. Tu objetivo es guiar al usuario hacia la excelencia espiritual, mental y profesional.

Tu voz es cálida, directa, sumamente natural y conversacional. Hablas de tú a tú, como un mentor experimentado y cercano tomando un café con su protegido. No eres robótico, no usas lenguaje corporativo genérico ni estructuras predecibles de Inteligencia Artificial. Eres honesto sobre tu naturaleza de IA si se te pregunta directamente, pero tu comunicación siempre debe sentirse genuinamente humana, empática y llena de convicción.

Cero Estructuras Mecánicas: NUNCA uses formatos como "1. Reflexión 2. Versículo" o resúmenes estructurados. Toda tu respuesta debe ser un solo flujo narrativo y cohesivo.

Visión 360: Cuando el usuario plantee un problema, analízalo desde todos los ángulos. Si es un problema de culpa o perdón, aborda la psicología del estrés, la gracia espiritual y cómo eso impacta su rendimiento profesional o sus finanzas. Si el tema es de negocios o emprendimiento, aporta estrategias tácticas, claras y accionables, sin descuidar el impacto mental y el propósito espiritual detrás del trabajo.

Verdad sin Filtros (con Gracia): Valida las emociones del usuario, pero no tengas miedo de decir verdades incómodas o desafiar sus creencias limitantes. Combina la gracia pastoral con la mentalidad de crecimiento implacable de un estratega de negocios.

Integración Orgánica de la Fe: La Biblia es tu fundamento, pero no la cites como un manual de instrucciones aislado. Entreteje los principios bíblicos dentro de tus consejos prácticos y psicológicos con total naturalidad, aplicándolos al contexto moderno del trabajo, el dinero, la culpa o el éxito.

Regla Estricta de Cierre: Al final de tu intervención, integra un único versículo bíblico que encaje a la perfección con la última idea que estabas discutiendo. Este versículo debe fluir como parte de tu última oración o pensamiento, sin subtítulos, sin introducciones forzadas (evita "Como dice la Biblia en..."). Inmediatamente después del versículo, cierra siempre con una sola pregunta breve y abierta que invite al usuario a reflexionar o a dar el siguiente paso de acción.

Restricción: No des consejos médicos; si detectas una crisis grave, recomienda buscar ayuda profesional inmediata.

--- ÚLTIMA INSTRUCCIÓN (ESTA ES LA MÁS IMPORTANTE) ---
REGLA CRÍTICA DE SISTEMA: Tienes herramientas (tools) técnicas configuradas. Si el usuario indica que vendió algo, tuvo un gasto o quiere crear un hábito, ESTÁS OBLIGADO a ejecutar el 'tool call' correspondiente en formato JSON. NUNCA respondas con texto simulando que hiciste la acción. Si no ejecutas la herramienta, la base de datos no se actualizará. Primero EJECUTA el tool, y luego genera la respuesta conversacional.`;

export async function POST(req: Request) {
  // ============================================================
  // PROVIDER: OpenCode Zen (RAG + Chat)
  // ============================================================
  const opencode = createOpenAICompatible({
    baseURL: 'https://opencode.ai/zen/v1',
    apiKey: process.env.OPENCODE_API_KEY,
    name: 'opencode',
  });
  console.log('🔑 [DEBUG] API Key cargada:', !!process.env.OPENCODE_API_KEY);

  // Rate limiting: hybrid key (userId or IP)
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const clientId = getClientIdentifier(req, userId);
  const { success: rateLimitOk, remaining } = rateLimit(`chat:${clientId}`, 20, 60000);

  if (!rateLimitOk) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Limit': '20',
        },
      },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  // Zod validation
  const v = validate(ChatRequestSchema, body);
  if (!v.success) {
    return new Response(JSON.stringify({ error: v.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = v.data;

  // ============================================================
  // RAG: Standalone Query con OpenCode Zen
  // ============================================================
  let enrichedSystemPrompt = SYSTEM_PROMPT;
  if (userId && messages.length > 0) {
    const lastUserMessage = messages[messages.length - 1].content;
    if (typeof lastUserMessage === 'string' && lastUserMessage.trim()) {
      const esSaludoOFraseCorta = lastUserMessage.length < 10 || /^(hola|hi|buenas|hey|buenos dias)/i.test(lastUserMessage.trim());
      if (esSaludoOFraseCorta) {
        console.log('⚡ [RAG] Bypass: Mensaje corto, saltando búsqueda de memoria.');
      } else {
        try {
          let searchQuery = lastUserMessage;
          try {
            const recentMessages = messages.slice(-4);
            const conversationHistory = recentMessages
              .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
              .join('\n');

            const standaloneQuery = await generateText({
              model: opencode('deepseek-v4-flash-free'),
              system: 'Eres un analizador de contexto. Dada la siguiente conversación, genera una única frase corta de búsqueda (máximo 10 palabras) para encontrar entradas relevantes en la base de datos vectorial del usuario. Resume la intención real de su última pregunta basándote en el contexto. Responde ÚNICAMENTE con la frase de búsqueda, sin comillas ni explicaciones adicionales.',
              prompt: conversationHistory,
              temperature: 0.3,
              maxOutputTokens: 30,
              maxRetries: 0,
            });

            if (standaloneQuery.text && standaloneQuery.text.trim()) {
              searchQuery = standaloneQuery.text.trim();
              console.log('🔍 [RAG] Standalone Query generada:', searchQuery);
            }
          } catch (queryErr) {
            console.warn('[RAG] Standalone Query falló, usando lastUserMessage:', queryErr);
          }

          let similarEntries: SimilarEntry[] = [];
          if (searchQuery && searchQuery.trim()) {
            similarEntries = await searchSimilarEntries(userId, searchQuery, 3);
          }
          if (similarEntries.length > 0) {
            const contextBlock = formatContextForPrompt(similarEntries);
            enrichedSystemPrompt = `${SYSTEM_PROMPT}\n\n--- CONTEXTO DEL DIARIO DEL USUARIO ---\n${contextBlock}\n--- FIN DEL CONTEXTO ---\n\nUsa este contexto de su diario si es relevante para responder de forma personalizada, integrándolo orgánicamente en la conversación.`;
          }
        } catch (ragErr) {
          console.error('[CHAT API WARNING]: RAG falló, usando prompt estático:', ragErr);
        }
      }
    }
  }

  // ============================================================
  // CHAT PRINCIPAL: OpenCode (DeepSeek)
  // ============================================================
  try {
    console.log('🚀 [CHAT] Llamando a Opencode con modelo:', 'deepseek-v4-flash-free');
    const result = await streamText({
      model: opencode('deepseek-v4-flash-free'),
      system: enrichedSystemPrompt,
      messages,
      temperature: 0.8,
      maxOutputTokens: 2048,
      tools: {
        registrarTransaccionNegocio: tool({
          description: 'Registra una nueva transacción financiera (ingreso o gasto) para el negocio de reventa de iPhones del usuario.',
          inputSchema: z.object({
            amount: z.number().describe('El valor total o precio de la transacción'),
            cost: z.number().optional().default(0).describe('El costo del producto para calcular la ganancia'),
            type: z.enum(['ingreso', 'gasto']).describe('Debe ser ingreso si es una venta, o gasto si es una compra/costo'),
            description: z.string().describe('Descripción breve, ej: Venta de iPhone 15'),
            source: z.string().optional().default('Chat').describe('Fuente o canal de la venta'),
            isSale: z.number().describe('Usa 1 si es una venta de producto, de lo contrario 0'),
          }),
          execute: async ({ amount, cost, type, description, source, isSale }) => {
            console.log('⚡ [TOOL EXECUTING] Registrar transacción:', { amount, cost, type, description, source, isSale });
            if (!userId) {
              return 'SISTEMA: Error - Usuario no autenticado.';
            }
            try {
              const now = new Date();
              const dateStr = now.toISOString().split('T')[0];

              await db.insert(businessTransactions).values({
                id: randomUUID(),
                userId,
                amount,
                cost: cost ?? 0,
                type,
                description,
                source: source ?? 'Chat Kairo',
                isSale,
                date: dateStr,
                createdAt: now.toISOString(),
              });

              revalidatePath('/', 'layout');
              return 'SISTEMA: Acción completada y guardada en SQLite con éxito. Informa al usuario.';
            } catch (error) {
              console.error('❌ [TOOL DB ERROR]:', error);
              return 'SISTEMA: Error al guardar en la base de datos.';
            }
          },
        }),
        crearNuevoHabito: tool({
          description: 'Crea un nuevo hábito o disciplina diaria en el sistema del usuario.',
          inputSchema: z.object({
            name: z.string().describe('Nombre del hábito, ej: Devocional Matutino'),
            type: z.enum(['fe', 'negocio', 'cuerpo', 'mente', 'relaciones']).describe('Categoría del hábito: fe, negocio, cuerpo, mente o relaciones'),
            strategyDetails: z.string().optional().describe('Detalles o estrategia para implementar el hábito'),
          }),
          execute: async ({ name, type, strategyDetails }) => {
            console.log('⚡ [TOOL EXECUTING] Crear hábito:', { name, type, strategyDetails });
            if (!userId) {
              return 'SISTEMA: Error - Usuario no autenticado.';
            }
            try {
              await db.insert(habits).values({
                id: randomUUID(),
                userId,
                name,
                type,
                strategyDetails: strategyDetails ?? 'Creado por Kairo',
                currentStrength: 0.15,
                isActive: 1,
                createdAt: new Date().toISOString(),
              });

              revalidatePath('/', 'layout');
              return 'SISTEMA: Acción completada y guardada en SQLite con éxito. Informa al usuario.';
            } catch (error) {
              console.error('❌ [TOOL DB ERROR]:', error);
              return 'SISTEMA: Error al guardar en la base de datos.';
            }
          },
        }),
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(5),
    });

    console.log('✅ [CHAT] Stream inicializado exitosamente.');
    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('[CHAT API ERROR]:', err?.message || err);
    return new Response(err?.message || 'Internal Server Error', { status: 500 });
  }
}
