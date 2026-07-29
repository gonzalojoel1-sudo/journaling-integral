import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKeys } from '@/config/ai';
import { db } from '@/db/db';
import { journalEmbeddings } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { logger } from './logger';

const EMBEDDING_MODEL = 'gemini-embedding-001';

// ============================================================
// GENERATE EMBEDDING
// ============================================================

export async function generateEmbedding(text: string): Promise<number[]> {
  const { gemini } = getApiKeys();
  if (!gemini) throw new Error('Gemini API key not configured');

  const genAI = new GoogleGenerativeAI(gemini);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

// ============================================================
// COSINE SIMILARITY
// ============================================================

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ============================================================
// BUILD ENTRY CONTENT FOR EMBEDDING
// ============================================================

export function buildEntryContent(entry: Record<string, any>): string {
  const parts: string[] = [];

  if (entry.date) parts.push(`Fecha: ${entry.date}`);
  if (entry.sleepRating) parts.push(`Sueño: ${entry.sleepRating}/10`);
  if (entry.energyRating) parts.push(`Energía: ${entry.energyRating}/10`);
  if (entry.focusRating) parts.push(`Enfoque: ${entry.focusRating}/10`);
  if (entry.stressRating) parts.push(`Estrés: ${entry.stressRating}/10`);
  if (entry.quickEnergyAction) parts.push(`Acción rápida: ${entry.quickEnergyAction}`);

  if (entry.gratitude1) parts.push(`Gratitud 1: ${entry.gratitude1}`);
  if (entry.gratitude2) parts.push(`Gratitud 2: ${entry.gratitude2}`);
  if (entry.gratitude3) parts.push(`Gratitud 3: ${entry.gratitude3}`);
  if (entry.wisdomRequest) parts.push(`Sabiduría buscada: ${entry.wisdomRequest}`);

  if (entry.chooseToBeIdentity) parts.push(`Identidad: ${entry.chooseToBeIdentity}`);
  if (entry.identityAction) parts.push(`Acción de identidad: ${entry.identityAction}`);
  if (entry.dailyMicroAchievement) parts.push(`Micro logro: ${entry.dailyMicroAchievement}`);

  if (entry.devotionalNotes) parts.push(`Devocional: ${entry.devotionalNotes}`);

  if (entry.mitSer) parts.push(`MIT Ser: ${entry.mitSer}${entry.mitSerCompleted ? ' (completado)' : ''}`);
  if (entry.mitNegocio) parts.push(`MIT Negocio: ${entry.mitNegocio}${entry.mitNegocioCompleted ? ' (completado)' : ''}`);
  if (entry.mitRelaciones) parts.push(`MIT Relaciones: ${entry.mitRelaciones}${entry.mitRelacionesCompleted ? ' (completado)' : ''}`);

  if (entry.whatWorked) parts.push(`Lo que funcionó: ${entry.whatWorked}`);
  if (entry.whatDidNotWork) parts.push(`Lo que no funcionó: ${entry.whatDidNotWork}`);
  if (entry.improvementIdea) parts.push(`Idea de mejora: ${entry.improvementIdea}`);

  if (entry.mindsetStateRating) parts.push(`Estado mental: ${entry.mindsetStateRating}/10`);
  if (entry.mindsetEmotion1) parts.push(`Emoción 1: ${entry.mindsetEmotion1}`);
  if (entry.mindsetEmotion2) parts.push(`Emoción 2: ${entry.mindsetEmotion2}`);
  if (entry.mindsetEmotion3) parts.push(`Emoción 3: ${entry.mindsetEmotion3}`);

  if (entry.legacyReflection) parts.push(`Reflexión de legado: ${entry.legacyReflection}`);

  return parts.join('. ');
}

// ============================================================
// STORE ENTRY EMBEDDING (On-save)
// ============================================================

export async function storeEntryEmbedding(
  userId: string,
  entryId: string,
  content: string,
): Promise<void> {
  try {
    const embedding = await generateEmbedding(content);
    const embeddingJson = JSON.stringify(embedding);

    const existing = await db.query.journalEmbeddings.findFirst({
      where: eq(journalEmbeddings.entryId, entryId),
    });

    if (existing) {
      await db
        .update(journalEmbeddings)
        .set({ content, embedding: embeddingJson })
        .where(eq(journalEmbeddings.id, existing.id));
    } else {
      await db.insert(journalEmbeddings).values({
        id: randomUUID(),
        userId,
        entryId,
        content,
        embedding: embeddingJson,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('rag_store_embedding_failed', {}, error);
  }
}

// ============================================================
// SEARCH SIMILAR ENTRIES
// ============================================================

interface SimilarEntry {
  content: string;
  similarity: number;
  date: string;
}

export async function searchSimilarEntries(
  userId: string,
  query: string,
  topK: number = 3,
): Promise<SimilarEntry[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString();

    const userEmbeddings = await db.query.journalEmbeddings.findMany({
      where: and(
        eq(journalEmbeddings.userId, userId),
        gte(journalEmbeddings.createdAt, cutoffDate),
      ),
      orderBy: [desc(journalEmbeddings.createdAt)],
    });

    if (userEmbeddings.length === 0) return [];

    const scored = userEmbeddings.map((emb) => {
      const embVector = JSON.parse(emb.embedding) as number[];
      const similarity = cosineSimilarity(queryEmbedding, embVector);
      return {
        content: emb.content,
        similarity,
        date: emb.createdAt.split('T')[0],
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  } catch (error) {
    logger.error('rag_search_entries_failed', {}, error);
    return [];
  }
}
