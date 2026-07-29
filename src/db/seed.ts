import { db } from './db';
import { users, bibleVerses, habits, quarterlyPlans } from './schema';
import { randomUUID } from 'crypto';
import { BIBLE_VERSES_SEED } from './seed/data/bible-verses';
import { DEMO_USER_ID, DEMO_USER_EMAIL, DEMO_USER_NAME, DEMO_USER_PASSWORD_HASH } from '@/lib/constants-demo';
import { HABIT_TYPE_PILAR, HABIT_TYPE_CAMBIAR } from '@/lib/constants-domain';
import { logger } from '@/lib/logger';
import { todayStr } from '../lib/dates';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    logger.error('seed_blocked_in_production');
    process.exit(1);
  }

  logger.info('seed_started');

  try {
    await db.delete(bibleVerses);
    logger.info('bible_verses_reset');
  } catch (_e) {
    logger.info('bible_verses_reset_skipped');
  }

  const verses = BIBLE_VERSES_SEED.map((v) => ({
    id: randomUUID(),
    ...v,
  }));

  await db.insert(bibleVerses).values(verses);
  logger.info('bible_verses_loaded', { count: verses.length });

  try {
    await db.insert(users).values({
      id: DEMO_USER_ID,
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD_HASH,
      currentLevel: 1,
      streakCurrent: 5,
      streakMax: 12,
      lastEntryDate: todayStr(),
      createdAt: new Date().toISOString(),
    });
    logger.info('demo_user_initialized');
  } catch (_e) {
    logger.info('demo_user_already_exists');
  }

  const demoHabits = [
    {
      id: randomUUID(),
      userId: DEMO_USER_ID,
      name: 'Orar 3 minutos al despertar',
      habitType: HABIT_TYPE_PILAR,
      domain: 'espiritual',
      rescueAction: 'Orar 1 minuto',
      activeAction: 'Orar 3 minutos al despertar',
      celebration: 'Bien, inicié el día con Dios',
      isActive: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      userId: DEMO_USER_ID,
      name: 'No revisar el celular la primera hora',
      habitType: HABIT_TYPE_CAMBIAR,
      domain: 'mente',
      rescueAction: '5 minutos sin celular',
      activeAction: '60 minutos sin celular al despertar',
      celebration: 'Mi mente está enfocada',
      cue: 'Despertar y ver el celular',
      newRoutine: 'Leer un libro o escribir en el diario',
      isActive: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const habit of demoHabits) {
    await db.insert(habits).values(habit);
  }
  logger.info('demo_habits_created');

  await db.insert(quarterlyPlans).values({
    id: randomUUID(),
    userId: DEMO_USER_ID,
    quarterLabel: 'Q1/2026',
    year: 2026,
    isActive: 1,
    fiveYearSpiritual:
      'Ser un referente espiritual y mentor que guíe a otros a vivir una fe práctica con integridad profunda.',
    fiveYearBeing:
      'Ser una persona físicamente sana, estable y con madurez emocional para liderar con generosidad.',
    fiveYearBusiness:
      'Construir un negocio estable que opere bajo principios éticos y proporcione libertad de tiempo y recursos.',
    fiveYearRelations:
      'Mantener un matrimonio ejemplar y formar un círculo íntimo de mentoría y comunidad sólida.',

    quarterlySpiritual:
      'Consolidar el hábito del devocional diario sin interrupción tecnológica.',
    quarterlyBeing:
      'Alcanzar una rutina de descanso regular que reduzca el cansancio residual acumulado.',
    quarterlyBusiness:
      'Lanzar el producto mínimo viable de mi servicio de consultoría con 3 clientes validados.',
    quarterlyRelations:
      'Tener una cena semanal de enfoque exclusivo con mi cónyuge sin distractores digitales.',

    smartObjectivesJson: JSON.stringify([
      {
        id: 'obj-1',
        objective: 'Registrar 20 días de journaling en los próximos 30 días.',
        targetDate: '2026-02-15',
        isCompleted: false,
      },
      {
        id: 'obj-2',
        objective: 'Completar 1 hora de autoeducación enfocada en negocios cada semana.',
        targetDate: '2026-03-31',
        isCompleted: false,
      },
    ]),

    actionsPlanJson: JSON.stringify([
      {
        metaIndex: 1,
        metaTitle: 'Estabilidad de Hábitos',
        actions: [
          {
            action: 'Hacer el diario de mañana por 5 minutos',
            frequency: 'Diaria',
            indicator: 'Check en la app',
          },
          {
            action: 'Chequeo de energía nocturno',
            frequency: 'Diaria',
            indicator: 'Registro en el sistema',
          },
        ],
      },
    ]),
    createdAt: new Date().toISOString(),
  });

  logger.info('demo_quarterly_plan_loaded');
  logger.info('seed_completed');
}

seed().catch((err) => {
  logger.error('seed_failed', {}, err);
  process.exit(1);
});
