import { db } from './db';
import { users, userSettings, habits, dailyEntries, businessTransactions, personalTransactions } from './schema';
import { randomUUID } from 'crypto';
import { storeEntryEmbedding, buildEntryContent } from '../lib/rag';

async function runSimulationSeed() {
  console.log('🚀 Iniciando simulación de alta densidad para KAIRO...');

  const userId = randomUUID();
  const userEmail = 'simulador@irontech.com';
  const now = new Date().toISOString();

  // 1. Crear el Usuario de Élite
  await db.insert(users).values({
    id: userId,
    name: 'Joel Simulador',
    email: userEmail,
    password: '$2b$10$dummy_hash_for_simulation', // Hash bcrypt dummy
    role: 'user',
    currentLevel: 28,
    streakCurrent: 22,
    streakMax: 45,
    createdAt: now,
  });

  // 2. Activar todos los paneles en Settings
  await db.insert(userSettings).values({
    userId: userId,
    showBusinessPanel: 1,
    showFinancePanel: 1,
    showHabitsPanel: 1,
    showQuarterlyPanel: 1,
    showChallengesPanel: 1,
    onboardingCompleted: 1,
    aiAssistantEnabled: 1,
  });

  // 3. Crear Hábitos Core
  const habitList = [
    { id: randomUUID(), name: 'Devocional Matutino y Oración', habitType: 'pilar', domain: 'espiritual' },
    { id: randomUUID(), name: 'Prospectar 5 clientes (iRon Tech)', habitType: 'preciso', domain: 'trabajo' },
    { id: randomUUID(), name: 'Cerrar caja y flujo de caja diario', habitType: 'sembrar', domain: 'trabajo' },
    { id: randomUUID(), name: 'Entrenamiento de Fuerza', habitType: 'crecer', domain: 'cuerpo' },
    { id: randomUUID(), name: 'Lectura de Estrategia', habitType: 'sembrar', domain: 'mente' },
    { id: randomUUID(), name: 'Tiempo de calidad sin pantallas con la familia', habitType: 'pilar', domain: 'relaciones' },
  ];

  for (const h of habitList) {
    await db.insert(habits).values({
      id: h.id,
      userId,
      name: h.name,
      habitType: h.habitType,
      domain: h.domain,
      rescueAction: h.name,
      celebration: 'Hecho',
      isActive: 1,
      currentStrength: 0.85,
      createdAt: now,
    });
  }

  // 4. Generar Historial de 30 Días (Simulación narrativa)
  console.log('📅 Generando 30 días de registros diarios y finanzas...');

  const textosDevocionales = [
    'Reflexión sobre la paciencia y la sabiduría en los negocios. Proverbios 16:3.',
    'Dando gracias por la provisión y manteniendo un corazón humilde ante el éxito.',
    'Enfoque en la identidad de servicio. Liderar es servir a mis clientes de iPhones.',
    'Oración por claridad estratégica. Mantener la fe alta en momentos de incertidumbre.',
  ];

  const hitosNegocio = [
    'Gran cierre de venta de 2 iPhone 11 Pro Max. Buen margen.',
    'Día de mucho marketing en redes. Aplicando ganchos de Alex Hormozi en Reels.',
    'Negociando lote de iPhones 12 en excelente estado. Revisando costos a fondo.',
    'Seguimiento a prospectos antiguos. El servicio premium al cliente siempre paga.',
  ];

  for (let i = 30; i >= 0; i--) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const entryId = randomUUID();

    // Fluctuaciones realistas de ratings
    const sleep = Math.floor(Math.random() * 3) + 7;
    const energy = Math.floor(Math.random() * 3) + 7;
    const focus = Math.floor(Math.random() * 4) + 6;
    const stress = Math.floor(Math.random() * 4) + 2;

    const entryData = {
      id: entryId,
      userId,
      date: dateStr,
      time: '08:00',
      levelAtEntry: 28,
      sleepRating: sleep,
      energyRating: energy,
      focusRating: focus,
      stressRating: stress,
      gratitude1: 'Por el crecimiento de iRon Tech',
      gratitude2: 'Por salud y energía para emprender',
      gratitude3: 'Por las lecciones aprendidas hoy',
      chooseToBeIdentity: 'Un empresario estratega y lleno de fe',
      identityAction: 'Tomar decisiones basadas en datos y principios',
      dailyMicroAchievement: 'Llamadas de prospección completadas',
      devotionalNotes: textosDevocionales[i % textosDevocionales.length],
      mitSer: 'Mantener la paz mental',
      mitSerCompleted: 1,
      mitNegocio: 'Revisar costos del nuevo lote',
      mitNegocioCompleted: Math.random() > 0.2 ? 1 : 0,
      mitRelaciones: 'Cenar en familia sin celular',
      mitRelacionesCompleted: 1,
      whatWorked: hitosNegocio[i % hitosNegocio.length],
      whatDidNotWork: 'Me distraje un poco revisando métricas de anuncios al mediodía.',
      improvementIdea: 'Bloquear bloques de tiempo exclusivos para enfoque profundo.',
      mindsetStateRating: 8,
      mindsetEmotion1: 'Enfocado',
      mindsetEmotion2: 'Agradecido',
      createdAt: currentDate.toISOString(),
    };

    await db.insert(dailyEntries).values(entryData);

    // 5. Inyectar transacciones de Negocio realistas
    if (i % 2 === 0) {
      await db.insert(businessTransactions).values({
        id: randomUUID(),
        userId,
        amount: 450 + (i * 5),
        cost: 300,
        type: 'ingreso',
        description: `Venta iPhone 11 Pro Max - Cliente Día ${i}`,
        source: 'Instagram Organic',
        isSale: 1,
        date: dateStr,
        createdAt: currentDate.toISOString(),
      });
    } else if (i % 5 === 0) {
      await db.insert(businessTransactions).values({
        id: randomUUID(),
        userId,
        amount: 150,
        cost: 0,
        type: 'gasto',
        description: 'Anuncios de Meta Ads - Campaña Tráfico iRon Tech',
        source: 'Ads',
        isSale: 0,
        date: dateStr,
        createdAt: currentDate.toISOString(),
      });
    }

    // 6. Finanzas Personales
    await db.insert(personalTransactions).values({
      id: randomUUID(),
      userId,
      amount: Math.random() > 0.5 ? 25 : 12,
      type: 'gasto',
      category: 'Alimentación',
      account: 'Efectivo',
      description: 'Almuerzo de trabajo',
      date: dateStr,
      createdAt: currentDate.toISOString(),
    });

    // 7. HIDRATAR LA MEMORIA RAG
    const content = buildEntryContent(entryData);
    console.log(`🧠 Indexando memoria RAG para el día: ${dateStr}...`);
    await storeEntryEmbedding(userId, entryId, content);
  }

  console.log('\n✨ ¡Simulación completada con éxito!');
  console.log(`📧 Inicia sesión con el correo: ${userEmail}`);
  console.log('💡 Tip: Ve al chat y pregúntale a KAIRO: "¿Cómo han estado mis ventas de iPhones y mi enfoque espiritual en las últimas semanas?" y mira cómo extrae la data.');
}

runSimulationSeed().catch(console.error);
