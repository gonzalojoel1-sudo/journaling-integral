export const DEMO_USER_ID = 'demo-user-id' as const;
export const DEMO_USER_EMAIL = 'joel@journalingintegral.demo' as const;
export const DEMO_USER_NAME = 'Joel Pacheco' as const;
export const DEMO_USER_PASSWORD_HASH =
  '7d2143c548907019260ce52552eab73d263ba0343bcbabf3780aebfaa62dea003bbc1a3522005bd091e31158b10526bd11909312a98b3cca418b8eba0c806aa5' as const;

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
