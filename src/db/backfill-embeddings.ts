import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { dailyEntries, journalEmbeddings } from './schema';
import { storeEntryEmbedding, buildEntryContent } from '../lib/rag';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 100;

async function backfillEmbeddings() {
  logger.info('backfill_embeddings_started', { batchSize: BATCH_SIZE });

  let offset = 0;
  let totalScanned = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  while (true) {
    const batch = await db
      .select({ id: dailyEntries.id, userId: dailyEntries.userId, date: dailyEntries.date })
      .from(dailyEntries)
      .limit(BATCH_SIZE)
      .offset(offset);

    if (batch.length === 0) break;

    const ids = batch.map(e => e.id);
    const existing = await db
      .select({ entryId: journalEmbeddings.entryId })
      .from(journalEmbeddings)
      .where(inArray(journalEmbeddings.entryId, ids));
    const embeddedEntryIds = new Set(existing.map(e => e.entryId));

    totalScanned += batch.length;

    for (const entry of batch) {
      if (embeddedEntryIds.has(entry.id)) {
        totalSkipped++;
        continue;
      }
      const fullEntry = await db.query.dailyEntries.findFirst({
        where: eq(dailyEntries.id, entry.id),
      });
      if (!fullEntry) {
        totalErrors++;
        continue;
      }
      const content = buildEntryContent(fullEntry);
      try {
        await storeEntryEmbedding(fullEntry.userId, fullEntry.id, content);
        totalSuccess++;
      } catch (err: any) {
        totalErrors++;
        logger.error('backfill_entry_failed', { entryId: entry.id, date: fullEntry.date, message: err?.message }, err);
      }
    }

    offset += BATCH_SIZE;

    if (batch.length < BATCH_SIZE) break;
  }

  logger.info('backfill_completed', {
    scanned: totalScanned,
    success: totalSuccess,
    skipped: totalSkipped,
    errors: totalErrors,
  });
}

backfillEmbeddings().catch((err) => {
  logger.error('backfill_failed', {}, err);
});