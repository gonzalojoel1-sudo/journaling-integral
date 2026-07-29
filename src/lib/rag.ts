import { db } from '@/db/db';
import { journalEmbeddings } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { logger } from './logger';
import { safeJsonParse } from './json';

export const EMBEDDING_MODEL = 'local-tfidf-v1';

const MAX_CONTENT_LENGTH = 8000;

function truncateContent(text: string): string {
  if (text.length <= MAX_CONTENT_LENGTH) return text;
  logger.warn('rag_content_truncated', {
    originalLength: text.length,
    maxLength: MAX_CONTENT_LENGTH,
  });
  return text.slice(0, MAX_CONTENT_LENGTH);
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was',
  'one', 'our', 'had', 'has', 'this', 'that', 'with', 'from', 'have', 'they',
  'que', 'los', 'las', 'una', 'con', 'por', 'del', 'para',
  'mas', 'pero', 'sus', 'fue', 'ser', 'son', 'todo', 'esta', 'este',
  'estar', 'estoy', 'esto', 'eso', 'muy', 'sin',
  'sobre', 'tambien', 'despues', 'ahora', 'antes', 'donde', 'cuando',
  'tiene', 'tienen', 'tengo', 'hacer', 'hace', 'hacen', 'puede', 'pueden',
  'yo', 'tu', 'el', 'ella', 'nos', 'mi', 'ti', 'si', 'no', 'al', 'lo', 'le',
  'se', 'me', 'te', 'un', 'es', 'en', 'de',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

type SparseVector = Record<string, number>;

function computeTF(tokens: string[]): SparseVector {
  const tf: SparseVector = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const total = tokens.length || 1;
  for (const k of Object.keys(tf)) {
    tf[k] = tf[k] / total;
  }
  return tf;
}

export function generateEmbedding(text: string): SparseVector {
  const truncated = truncateContent(text);
  const tokens = tokenize(truncated);
  return computeTF(tokens);
}

function computeIDF(documents: SparseVector[]): SparseVector {
  const df: Record<string, number> = {};
  const n = documents.length;
  for (const doc of documents) {
    for (const term of Object.keys(doc)) {
      df[term] = (df[term] || 0) + 1;
    }
  }
  const idf: SparseVector = {};
  for (const term of Object.keys(df)) {
    idf[term] = Math.log((n + 1) / (df[term] + 1)) + 1;
  }
  return idf;
}

function applyIDF(tf: SparseVector, idf: SparseVector): SparseVector {
  const result: SparseVector = {};
  for (const term of Object.keys(tf)) {
    const weight = idf[term];
    if (weight !== undefined) {
      result[term] = tf[term] * weight;
    }
  }
  return result;
}

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

export function sparseCosineSimilarity(a: SparseVector, b: SparseVector): number {
  const keys = Object.keys(a).length < Object.keys(b).length ? Object.keys(a) : Object.keys(b);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const k of Object.keys(a)) {
    normA += a[k] * a[k];
  }
  for (const k of Object.keys(b)) {
    normB += b[k] * b[k];
  }

  for (const k of keys) {
    if (a[k] !== undefined && b[k] !== undefined) {
      dotProduct += a[k] * b[k];
    }
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

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

export async function storeEntryEmbedding(
  userId: string,
  entryId: string,
  content: string,
): Promise<void> {
  try {
    const embedding = generateEmbedding(content);
    const embeddingJson = JSON.stringify(embedding);

    const existing = await db.query.journalEmbeddings.findFirst({
      where: eq(journalEmbeddings.entryId, entryId),
    });

    if (existing) {
      await db
        .update(journalEmbeddings)
        .set({
          content,
          embedding: embeddingJson,
          modelVersion: EMBEDDING_MODEL,
        })
        .where(eq(journalEmbeddings.id, existing.id));
    } else {
      await db.insert(journalEmbeddings).values({
        id: randomUUID(),
        userId,
        entryId,
        content,
        embedding: embeddingJson,
        modelVersion: EMBEDDING_MODEL,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('rag_store_embedding_failed', { entryId }, error);
  }
}

interface SimilarEntry {
  id: string;
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
    const queryTF = generateEmbedding(query);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString();

    const userEmbeddings = await db.query.journalEmbeddings.findMany({
      where: and(
        eq(journalEmbeddings.userId, userId),
        eq(journalEmbeddings.modelVersion, EMBEDDING_MODEL),
        gte(journalEmbeddings.createdAt, cutoffDate),
      ),
      orderBy: [desc(journalEmbeddings.createdAt)],
    });

    if (userEmbeddings.length === 0) return [];

    const docTFs: SparseVector[] = [];
    for (const emb of userEmbeddings) {
      const tf = safeJsonParse<SparseVector>(emb.embedding, {});
      if (Object.keys(tf).length > 0) {
        docTFs.push(tf);
      } else {
        docTFs.push(generateEmbedding(emb.content));
      }
    }

    const idf = computeIDF(docTFs);
    const queryTFIDF = applyIDF(queryTF, idf);

    const scored = userEmbeddings
      .map((emb, idx) => {
        const docTFIDF = applyIDF(docTFs[idx], idf);
        const similarity = sparseCosineSimilarity(queryTFIDF, docTFIDF);
        return {
          id: emb.entryId,
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
