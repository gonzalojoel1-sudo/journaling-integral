import 'dotenv/config';
import { db } from './db';
import { dailyEntries, journalEmbeddings } from './schema';
import { storeEntryEmbedding, buildEntryContent } from '../lib/rag';
import { logger } from '@/lib/logger';

async function backfillEmbeddings() {
  logger.info('backfill_embeddings_started');

  // Find all entries without embeddings
  const allEntries = await db.select().from(dailyEntries);
  const existingEmbeddings = await db.select({ entryId: journalEmbeddings.entryId }).from(journalEmbeddings);
  const embeddedEntryIds = new Set(existingEmbeddings.map(e => e.entryId));

  const entriesWithoutEmbeddings = allEntries.filter(e => !embeddedEntryIds.has(e.id));

  logger.info('backfill_embeddings_stats', {
    total: allEntries.length,
    alreadyEmbedded: embeddedEntryIds.size,
    pending: entriesWithoutEmbeddings.length,
  });

  let successCount = 0;
  let errorCount = 0;

  for (const entry of entriesWithoutEmbeddings) {
    const content = buildEntryContent(entry);
    logger.info('backfill_indexing_entry', { date: entry.date });
    try {
      await storeEntryEmbedding(entry.userId, entry.id, content);
      successCount++;
      logger.info('backfill_entry_ok', { date: entry.date });
    } catch (err: any) {
      errorCount++;
      logger.error('backfill_entry_failed', { date: entry.date, message: err?.message }, err);
    }
  }

  logger.info('backfill_completed', { success: successCount, errors: errorCount });
}

backfillEmbeddings().catch((err) => {
  logger.error('backfill_failed', {}, err);
});
