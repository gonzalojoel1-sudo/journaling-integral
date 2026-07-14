'use server';

import { db } from '../../db/db';
import { dailyEntries } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from './auth';

export async function saveJournalDraft(data: Record<string, unknown>) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false };

  const todayStr = new Date().toISOString().split('T')[0];

  const existing = await db.query.dailyEntries.findFirst({
    where: eq(dailyEntries.date, todayStr),
  });

  const entryData: Record<string, unknown> = {
    ...data,
    userId,
    date: todayStr,
    time: new Date().toISOString(),
  };

  if (existing) {
    await db.update(dailyEntries).set(entryData).where(eq(dailyEntries.id, existing.id));
  } else {
    await db.insert(dailyEntries).values({
      id: crypto.randomUUID(),
      ...entryData,
    } as typeof dailyEntries.$inferInsert);
  }

  return { success: true };
}
