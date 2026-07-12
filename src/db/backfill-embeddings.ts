import 'dotenv/config';
import { db } from './db';
import { dailyEntries, journalEmbeddings } from './schema';
import { storeEntryEmbedding, buildEntryContent } from '../lib/rag';

async function backfillEmbeddings() {
  console.log('🧠 Iniciando backfill de embeddings RAG...');

  // Find all entries without embeddings
  const allEntries = await db.select().from(dailyEntries);
  const existingEmbeddings = await db.select({ entryId: journalEmbeddings.entryId }).from(journalEmbeddings);
  const embeddedEntryIds = new Set(existingEmbeddings.map(e => e.entryId));

  const entriesWithoutEmbeddings = allEntries.filter(e => !embeddedEntryIds.has(e.id));

  console.log(`📊 Total entries: ${allEntries.length}`);
  console.log(`📊 Already embedded: ${embeddedEntryIds.size}`);
  console.log(`📊 Need embedding: ${entriesWithoutEmbeddings.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (const entry of entriesWithoutEmbeddings) {
    const content = buildEntryContent(entry);
    console.log(`🧠 Indexando embedding para: ${entry.date}...`);
    try {
      await storeEntryEmbedding(entry.userId, entry.id, content);
      successCount++;
      console.log(`   ✅ OK`);
    } catch (err: any) {
      errorCount++;
      console.log(`   ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✨ Backfill completado:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
}

backfillEmbeddings().catch(console.error);
