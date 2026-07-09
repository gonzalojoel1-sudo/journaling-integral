import { Hono } from 'hono';
import { db } from '../db';
import { bibleVerses } from '@journaling/shared/db/schema';
import { eq } from 'drizzle-orm';
import { FALLBACK_VERSES } from '@journaling/shared';

export const bibleRoutes = new Hono();

bibleRoutes.get('/random', async (c) => {
  try {
    const level = Number(c.req.query('level') || '1');
    const list = await db.select().from(bibleVerses);
    if (!list.length) return c.json(null);

    const filtered = list.filter((v) => v.recommendedLevel === level);
    const selectionSource = filtered.length > 0 ? filtered : list;
    const randomIndex = Math.floor(Math.random() * selectionSource.length);
    return c.json(selectionSource[randomIndex]);
  } catch (error) {
    console.error('Error al obtener versiculo:', error);
    return c.json(null);
  }
});

bibleRoutes.get('/topic', async (c) => {
  try {
    const topic = c.req.query('topic');

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
      if (fallback) return c.json(fallback);
      throw new Error('Sin versiculos disponibles');
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    return c.json(list[randomIndex]);
  } catch (error) {
    const randomIndex = Math.floor(Math.random() * FALLBACK_VERSES.length);
    return c.json(FALLBACK_VERSES[randomIndex]);
  }
});
