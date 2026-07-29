// src/lib/constants-bible.ts
// Bible-related constants and fallback data.

export const FALLBACK_VERSES = [
  {
    id: 'fallback-1',
    reference: 'Josué 1:9',
    text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.',
    interpretation:
      'Tu fortaleza está garantizada hoy. Camina con valentía y asume las tareas con diligencia y fe.',
    recommendedLevel: 1,
    topic: 'Dominio Propio',
  },
  {
    id: 'fallback-2',
    reference: 'Proverbios 21:5',
    text: 'Los pensamientos del diligente ciertamente tienden a la abundancia; mas todo el que se apresura alocadamente, de cierto va a la pobreza.',
    interpretation:
      'La disciplina en planificar vence a la reactividad de tus impulsos. Administra tu negocio con sabiduría hoy.',
    recommendedLevel: 1,
    topic: 'Finanzas',
  },
  {
    id: 'fallback-3',
    reference: 'Jeremías 31:3',
    text: 'Con amor eterno te he amado; por tanto, te prolongué mi misericordia.',
    interpretation:
      'Tu valor identitario como ser humano no depende de tu nivel de productividad diaria, sino del amor de tu creador.',
    recommendedLevel: 1,
    topic: 'Identidad',
  },
] as const;