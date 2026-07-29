'use server';

import { db } from '../../db/db';
import { bibleVerses } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { FALLBACK_VERSES } from '@/lib/constants-bible';
import { logger } from '@/lib/logger';

export async function getRandomVerse(level: number = 1) {
  try {
    const filtered = await db
      .select()
      .from(bibleVerses)
      .where(eq(bibleVerses.recommendedLevel, level))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (filtered.length > 0) return filtered[0];

    const fallback = await db
      .select()
      .from(bibleVerses)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (fallback.length > 0) return fallback[0];

    return null;
  } catch (error) {
    logger.error('bible_get_random_verse_failed', { level }, error);
    return null;
  }
}

export async function getVersesByTopic(topic?: string) {
  try {
    let list;
    if (topic) {
      list = await db.query.bibleVerses.findMany({
        where: eq(bibleVerses.topic, topic),
      });
    } else {
      list = await db.query.bibleVerses.findMany();
    }

    if (!list || list.length === 0) {
      const fallback = await db.query.bibleVerses.findFirst();
      if (fallback) return fallback;
      throw new Error();
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  } catch (error) {
    const randomIndex = Math.floor(Math.random() * FALLBACK_VERSES.length);
    return FALLBACK_VERSES[randomIndex];
  }
}