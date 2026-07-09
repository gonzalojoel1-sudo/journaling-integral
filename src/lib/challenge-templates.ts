export interface ChallengeTemplate {
  id: string;
  area: string;
  mineral: string;
  days: number;
  title: string;
  description: string;
  badgeIcon: string;
  requires?: string;
  check: (entry: any, user: any) => boolean;
}

const alwaysTrue = () => true;

const sleep7orMore = (entry: any) => (entry.sleepRating || 0) >= 7;
const energy7orMore = (entry: any) => (entry.energyRating || 0) >= 7;
const hasDevotional = (entry: any) => !!(entry.devotionalNotes && entry.devotionalNotes.trim());
const hasIdentity = (entry: any) => !!(entry.chooseToBeIdentity && entry.chooseToBeIdentity.trim());
const hasProspect = (entry: any) => entry.bizProspectCompleted === 1;
const hasFollowUp = (entry: any) => entry.bizFollowUpCompleted === 1;
const hasSale = (entry: any) => (entry.bizSalesCount || 0) > 0;
const hasAutoeducation = (entry: any) => !!(entry.autoeducation);
const hasGratitude = (entry: any) => !!(entry.gratitude1 && entry.gratitude1.trim());
const hasLegacyReflection = (entry: any) => !!(entry.legacyReflection && entry.legacyReflection.trim());
const hasBizAction = (entry: any) => entry.bizMktActionCompleted === 1;

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // === DISCIPLINA ===
  { id: 'disciplina-bronce', area: 'disciplina', mineral: 'bronce', days: 7, title: 'Racha de Fuego', description: '7 dias seguidos de journaling sin falta', badgeIcon: 'flame', check: alwaysTrue },
  { id: 'disciplina-plata', area: 'disciplina', mineral: 'plata', days: 14, title: 'Guardian de la Constancia', description: '14 dias de journaling + revision semanal', badgeIcon: 'shield-check', requires: 'disciplina-bronce', check: alwaysTrue },
  { id: 'disciplina-oro', area: 'disciplina', mineral: 'oro', days: 30, title: 'Maestro de la Disciplina', description: '30 dias perfectos sin fallar', badgeIcon: 'trophy', requires: 'disciplina-plata', check: alwaysTrue },
  { id: 'disciplina-diamante', area: 'disciplina', mineral: 'diamante', days: 60, title: 'Inquebrantable', description: '60 dias sin romper la racha', badgeIcon: 'diamond', requires: 'disciplina-oro', check: alwaysTrue },
  { id: 'disciplina-legendario', area: 'disciplina', mineral: 'legendario', days: 90, title: 'Legado de Hierro', description: '90 dias de journaling impecable', badgeIcon: 'crown', requires: 'disciplina-diamante', check: alwaysTrue },

  // === IDENTIDAD ===
  { id: 'identidad-bronce', area: 'identidad', mineral: 'bronce', days: 7, title: 'Espejo del Alma', description: 'Elegir tu SER cada dia por 7 dias', badgeIcon: 'sparkles', check: hasIdentity },
  { id: 'identidad-plata', area: 'identidad', mineral: 'plata', days: 14, title: 'Arquitecto de Caracter', description: '14 dias con SER + accion diaria', badgeIcon: 'hammer', requires: 'identidad-bronce', check: (e) => hasIdentity(e) && !!(e.identityAction?.trim()) },
  { id: 'identidad-oro', area: 'identidad', mineral: 'oro', days: 30, title: 'Forjador de Identidad', description: '30 dias de identidad consciente', badgeIcon: 'medal', requires: 'identidad-plata', check: hasIdentity },
  { id: 'identidad-diamante', area: 'identidad', mineral: 'diamante', days: 60, title: 'Identidad Inquebrantable', description: '60 dias viviendo tu identidad', badgeIcon: 'star', requires: 'identidad-oro', check: hasIdentity },
  { id: 'identidad-legendario', area: 'identidad', mineral: 'legendario', days: 90, title: 'Transformador', description: '90 dias de identidad transformadora', badgeIcon: 'sun', requires: 'identidad-diamante', check: hasIdentity },

  // === FE ===
  { id: 'fe-bronce', area: 'fe', mineral: 'bronce', days: 7, title: 'Devoto', description: '7 dias de devocional completado', badgeIcon: 'book-open', check: hasDevotional },
  { id: 'fe-plata', area: 'fe', mineral: 'plata', days: 14, title: 'Discipulo', description: '14 dias de devocional + aplicacion', badgeIcon: 'bookmark', requires: 'fe-bronce', check: hasDevotional },
  { id: 'fe-oro', area: 'fe', mineral: 'oro', days: 30, title: 'Maestro de la Palabra', description: '30 dias de devocion diaria', badgeIcon: 'scroll', requires: 'fe-plata', check: hasDevotional },
  { id: 'fe-diamante', area: 'fe', mineral: 'diamante', days: 60, title: 'Teologo Practico', description: '60 dias de estudio biblico', badgeIcon: 'crosshair', requires: 'fe-oro', check: hasDevotional },
  { id: 'fe-legendario', area: 'fe', mineral: 'legendario', days: 90, title: 'Guia Espiritual', description: '90 dias guiando tu fe', badgeIcon: 'church', requires: 'fe-diamante', check: hasDevotional },

  // === CUERPO ===
  { id: 'cuerpo-bronce', area: 'cuerpo', mineral: 'bronce', days: 7, title: 'Descanso Sagrado', description: '7 dias con sueño >= 7h', badgeIcon: 'moon', check: sleep7orMore },
  { id: 'cuerpo-plata', area: 'cuerpo', mineral: 'plata', days: 14, title: 'Energia Divina', description: '14 dias sueño >= 7 + energia >= 7', badgeIcon: 'zap', requires: 'cuerpo-bronce', check: (e) => sleep7orMore(e) && energy7orMore(e) },
  { id: 'cuerpo-oro', area: 'cuerpo', mineral: 'oro', days: 30, title: 'Templo de Acero', description: '30 dias de disciplina fisica', badgeIcon: 'dumbbell', requires: 'cuerpo-plata', check: (e) => sleep7orMore(e) && energy7orMore(e) },
  { id: 'cuerpo-diamante', area: 'cuerpo', mineral: 'diamante', days: 60, title: 'Guerrero del Cuerpo', description: '60 dias de salud impecable', badgeIcon: 'shield', requires: 'cuerpo-oro', check: (e) => sleep7orMore(e) && energy7orMore(e) },
  { id: 'cuerpo-legendario', area: 'cuerpo', mineral: 'legendario', days: 90, title: 'Transformacion Fisica', description: '90 dias transformando tu cuerpo', badgeIcon: 'trophy', requires: 'cuerpo-diamante', check: (e) => sleep7orMore(e) && energy7orMore(e) },

  // === NEGOCIO ===
  { id: 'negocio-bronce', area: 'negocio', mineral: 'bronce', days: 7, title: 'Prospectador', description: '7 dias prospectando a diario', badgeIcon: 'target', check: hasProspect },
  { id: 'negocio-plata', area: 'negocio', mineral: 'plata', days: 14, title: 'Constructor', description: '14 dias de prospeccion + seguimiento', badgeIcon: 'building', requires: 'negocio-bronce', check: (e) => hasProspect(e) || hasFollowUp(e) || hasBizAction(e) },
  { id: 'negocio-oro', area: 'negocio', mineral: 'oro', days: 30, title: 'Cerrador', description: '30 dias haciendo crecer tu negocio', badgeIcon: 'briefcase', requires: 'negocio-plata', check: (e) => hasProspect(e) || hasFollowUp(e) || hasSale(e) || hasBizAction(e) },
  { id: 'negocio-diamante', area: 'negocio', mineral: 'diamante', days: 60, title: 'Sistema de Negocio', description: '60 dias de sistema funcionando', badgeIcon: 'cpu', requires: 'negocio-oro', check: (e) => hasProspect(e) || hasFollowUp(e) || hasSale(e) || hasBizAction(e) },
  { id: 'negocio-legendario', area: 'negocio', mineral: 'legendario', days: 90, title: 'Imperio', description: '90 dias construyendo tu imperio', badgeIcon: 'globe', requires: 'negocio-diamante', check: (e) => hasProspect(e) || hasFollowUp(e) || hasSale(e) || hasBizAction(e) },

  // === MENTE ===
  { id: 'mente-bronce', area: 'mente', mineral: 'bronce', days: 7, title: 'Aprendiz', description: '7 dias de autoeducacion', badgeIcon: 'brain', check: hasAutoeducation },
  { id: 'mente-plata', area: 'mente', mineral: 'plata', days: 14, title: 'Pensador', description: '14 dias de aprendizaje diario', badgeIcon: 'lightbulb', requires: 'mente-bronce', check: hasAutoeducation },
  { id: 'mente-oro', area: 'mente', mineral: 'oro', days: 30, title: 'Maestro', description: '30 dias de educacion continua', badgeIcon: 'graduation-cap', requires: 'mente-plata', check: hasAutoeducation },
  { id: 'mente-diamante', area: 'mente', mineral: 'diamante', days: 60, title: 'Certificado', description: '60 dias de formacion avanzada', badgeIcon: 'award', requires: 'mente-oro', check: hasAutoeducation },
  { id: 'mente-legendario', area: 'mente', mineral: 'legendario', days: 90, title: 'Autor', description: '90 dias de maestria intelectual', badgeIcon: 'book', requires: 'mente-diamante', check: hasAutoeducation },

  // === RELACIONES ===
  { id: 'relaciones-bronce', area: 'relaciones', mineral: 'bronce', days: 7, title: 'Presente', description: '7 dias con gratitud diaria', badgeIcon: 'heart', check: hasGratitude },
  { id: 'relaciones-plata', area: 'relaciones', mineral: 'plata', days: 14, title: 'Agradecido', description: '14 dias de gratitud consciente', badgeIcon: 'heart-handshake', requires: 'relaciones-bronce', check: hasGratitude },
  { id: 'relaciones-oro', area: 'relaciones', mineral: 'oro', days: 30, title: 'Mentor', description: '30 dias nutriendo relaciones', badgeIcon: 'users', requires: 'relaciones-plata', check: hasGratitude },
  { id: 'relaciones-diamante', area: 'relaciones', mineral: 'diamante', days: 60, title: 'Pacificador', description: '60 dias de relaciones profundas', badgeIcon: 'infinity', requires: 'relaciones-oro', check: hasGratitude },
  { id: 'relaciones-legendario', area: 'relaciones', mineral: 'legendario', days: 90, title: 'Fundador', description: '90 dias construyendo comunidad', badgeIcon: 'tent', requires: 'relaciones-diamante', check: hasGratitude },

  // === LEGADO ===
  { id: 'legado-bronce', area: 'legado', mineral: 'bronce', days: 7, title: 'Escriba', description: '7 dias de reflexion de legado', badgeIcon: 'pen', check: hasLegacyReflection },
  { id: 'legado-plata', area: 'legado', mineral: 'plata', days: 14, title: 'Visionario', description: '14 dias de vision de legado', badgeIcon: 'eye', requires: 'legado-bronce', check: hasLegacyReflection },
  { id: 'legado-oro', area: 'legado', mineral: 'oro', days: 30, title: 'Constructor de Legado', description: '30 dias forjando tu huella', badgeIcon: 'castle', requires: 'legado-plata', check: hasLegacyReflection },
  { id: 'legado-diamante', area: 'legado', mineral: 'diamante', days: 60, title: 'Testamento', description: '60 dias de legado intencional', badgeIcon: 'scroll-text', requires: 'legado-oro', check: hasLegacyReflection },
  { id: 'legado-legendario', area: 'legado', mineral: 'legendario', days: 90, title: 'Impacto Generacional', description: '90 dias creando impacto eterno', badgeIcon: 'tree-pine', requires: 'legado-diamante', check: hasLegacyReflection },
];

export const HIDDEN_CHALLENGES: ChallengeTemplate[] = [
  { id: 'oculto-trinidad', area: 'oculto', mineral: 'especial', days: 1, title: 'Trinidad', description: 'Oro en Fe + Identidad + Disciplina', badgeIcon: 'triangle', check: alwaysTrue },
  { id: 'oculto-imperio-integral', area: 'oculto', mineral: 'especial', days: 1, title: 'Imperio Integral', description: 'Oro en Negocio + Mente + Relaciones', badgeIcon: 'building-2', check: alwaysTrue },
  { id: 'oculto-equilibrio', area: 'oculto', mineral: 'especial', days: 1, title: 'Equilibrio Supremo', description: 'Oro en Cuerpo + Mente + Fe', badgeIcon: 'scale', check: alwaysTrue },
  { id: 'oculto-maestro-tiempo', area: 'oculto', mineral: 'especial', days: 1, title: 'Maestro del Tiempo', description: '365 dias de journaling total', badgeIcon: 'clock', check: alwaysTrue },
  { id: 'oculto-milagro', area: 'oculto', mineral: 'especial', days: 1, title: 'Milagro Financiero', description: 'Diamante en Negocio', badgeIcon: 'banknote', check: alwaysTrue },
  { id: 'oculto-guerrero', area: 'oculto', mineral: 'especial', days: 1, title: 'Guerrero Completo', description: 'Diamante en 3 areas', badgeIcon: 'swords', check: alwaysTrue },
  { id: 'oculto-sabio', area: 'oculto', mineral: 'especial', days: 1, title: 'Sabio', description: '100 versiculos aplicados', badgeIcon: 'scroll', check: alwaysTrue },
  { id: 'oculto-titan', area: 'oculto', mineral: 'especial', days: 1, title: 'Titan', description: 'Legendario en cualquier area', badgeIcon: 'mountain', check: alwaysTrue },
  { id: 'oculto-arquitecto', area: 'oculto', mineral: 'especial', days: 1, title: 'Arquitecto de Almas', description: 'Todas las areas en Plata', badgeIcon: 'compass', check: alwaysTrue },
  { id: 'oculto-elegido', area: 'oculto', mineral: 'especial', days: 1, title: 'El Elegido', description: 'Completar los 40 desafios base', badgeIcon: 'gem', check: alwaysTrue },
];

export const ALL_TEMPLATES = [...CHALLENGE_TEMPLATES, ...HIDDEN_CHALLENGES];

export function getTemplate(id: string): ChallengeTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
