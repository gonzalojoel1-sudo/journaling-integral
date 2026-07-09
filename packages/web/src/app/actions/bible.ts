'use server';

import { db } from '../../db/db';
import { bibleVerses } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { FALLBACK_VERSES } from '@/lib/constants';

export async function getRandomVerse(level: number = 1) {
  try {
    const list = await db.select().from(bibleVerses);
    if (!list.length) return null;

    const filtered = list.filter((v) => v.recommendedLevel === level);
    const selectionSource = filtered.length > 0 ? filtered : list;

    const randomIndex = Math.floor(Math.random() * selectionSource.length);
    return selectionSource[randomIndex];
  } catch (error) {
    console.error('Error al obtener versículo:', error);
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
