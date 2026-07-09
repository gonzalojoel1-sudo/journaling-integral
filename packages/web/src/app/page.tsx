import React from 'react';
import Link from 'next/link';
import { serverFetch } from '@/lib/api-client';
import { 
  Flame, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Compass,
  CheckSquare,
  AlertTriangle,
  Target // Importación corregida de forma estricta
} from 'lucide-react';

export default async function DashboardPage() {
  const profileRes = await serverFetch('/api/auth/me');
  const user = profileRes.data;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error al cargar la información del usuario.</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const analyticsRes = await serverFetch('/api/journal/analytics');
  const entries = analyticsRes.data || [];

  // 1. Comprobar si ya completó el diario de hoy
  const todayEntry = entries.find((e: any) => e.date === todayStr) || null;

  // 2. RECUPERAR LA "PREPARACIÓN PARA MAÑANA" DE AYER
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const yesterdayEntry = entries.find((e: any) => e.date === yesterdayStr) || null;

  const antiReactivityTasks: string[] = yesterdayEntry?.prepTomorrowJson 
    ? JSON.parse(yesterdayEntry.prepTomorrowJson) 
    : [];

  // --- 3. NUEVO MOTOR DE INTEGRACIÓN: AUTOMATIZACIÓN DE DESTRABE SEMANAL ---
  const weeklyPlanRes = await serverFetch('/api/planning/weekly');
  const activeWeeklyPlan = weeklyPlanRes.data;

  let todayWeeklyDestrabeAction = '';
  let weeklyFocusText = '';

  if (activeWeeklyPlan) {
    weeklyFocusText = activeWeeklyPlan.focus;
    try {
      const parsedTasks = JSON.parse(activeWeeklyPlan.tasksJson);
      
      // Obtener el nombre del día actual en español
      const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const todayDayName = daysInSpanish[new Date().getDay()];

      // Buscar si el usuario planificó una tarea de destrabe para el día de hoy
      const foundTask = parsedTasks.find((t: any) => t.day === todayDayName);
      if (foundTask && foundTask.task.trim() !== '') {
        todayWeeklyDestrabeAction = foundTask.task;
      }
    } catch (e) {
      console.error('Error al parsear tareas semanales:', e);
    }
  }

  // 4. Versículo de anclaje diario
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const verseRes = await fetch(`${API}/api/bible/random?level=${user.currentLevel}`);
  const verse = await verseRes.json();

  // 5. Constancia últimos 30 días
  const completedDays = entries.length;

  const levelRequirements = {
    1: { target: 18, next: 'Nivel 2 (Dirección)' },
    2: { target: 25, next: 'Nivel 3 (Legado)' },
    3: { target: 30, next: 'Máximo nivel alcanzado' },
  };

  const currentRequirement = levelRequirements[user.currentLevel as 1 | 2 | 3] || { target: 18, next: 'Nivel 2' };
  const progressPercent = Math.min(Math.round((completedDays / currentRequirement.target) * 100), 100);

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* --- SECCIÓN DE BIENVENIDA --- */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
            {formattedDate}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            Bienvenido de vuelta, {user.name}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {user.currentLevel === 1 
              ? 'Enfoque de hoy: Interrumpir el piloto automático y crear orden consciente.'
              : user.currentLevel === 2
              ? 'Enfoque de hoy: Alinear tus prioridades y hábitos con la visión a 5 años.'
              : 'Enfoque de hoy: Medir el impacto generacional, legado y mayordomía integral.'}
          </p>
        </div>

        {/* Nivel actual */}
        <div className="flex items-center gap-3 bg-stone-100/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-850 rounded-2xl p-4 self-start md:self-auto shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono block">
              Nivel Actual
            </span>
            <p className="text-sm font-bold text-stone-850 dark:text-stone-200">
              Nivel {user.currentLevel}: {user.currentLevel === 1 ? 'Fundamentos' : user.currentLevel === 2 ? 'Dirección' : 'Legado'}
            </p>
          </div>
        </div>
      </header>

      {/* --- GRID DE ESTADÍSTICAS --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-stone-900/40 dark:to-stone-950/40 border border-amber-200/60 dark:border-stone-850 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase text-amber-800 dark:text-stone-400 tracking-wider font-mono">
                Racha Activa
              </p>
              <p className="text-4xl font-extrabold text-amber-900 dark:text-amber-500 mt-2">
                {user.streakCurrent} <span className="text-sm font-medium text-stone-500">días</span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-500 flex items-center justify-center">
              <Flame className="h-6 w-6 fill-current" />
            </div>
          </div>
          <div className="mt-4 text-xs text-amber-800/80 dark:text-stone-400">
            Racha máxima histórica: <span className="font-bold">{user.streakMax} días</span>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase text-stone-500 tracking-wider font-mono">
                Días Registrados (30 d)
              </p>
              <p className="text-4xl font-extrabold text-stone-800 dark:text-stone-200 mt-2">
                {completedDays} <span className="text-sm font-medium text-stone-500">de 30</span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-xs text-stone-500">
            Frecuencia mínima requerida para mantener estabilidad.
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              <span>Progreso de Nivel</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="text-xs text-stone-500 mt-4">
            {user.currentLevel < 3 ? (
              <span>Siguiente meta: <strong className="text-stone-800 dark:text-stone-300">{currentRequirement.target} registros</strong> para habilitar {currentRequirement.next}.</span>
            ) : (
              <span>Metodología completa habilitada. Sigue construyendo tu legado.</span>
            )}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN PRINCIPAL DE CONTROL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Tarjetas de Planificación Semanal y Antirreactividad */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* --- NUEVO MÓDULO INTELIGENTE: ENFOQUE SEMANAL Y ACCIÓN DE DESTRABE AUTOMATIZADA --- */}
          {activeWeeklyPlan && (
            <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-soft space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-stone-800 dark:text-stone-200">
                    Tu Planificación Semanal Activa
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">INTEGRACIÓN DE ENFOQUES DOMINICALES</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Enfoque Dominante Semanal */}
                <div className="p-4 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-850 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">Enfoque Dominante (80/20):</span>
                  <p className="font-bold text-stone-850 dark:text-stone-100">{weeklyFocusText || 'No definido aún.'}</p>
                </div>

                {/* Acción Automática de Destrabe de Hoy */}
                <div className="p-4 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-850 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 animate-pulse" /> Acción de Destrabe para Hoy:
                  </span>
                  <p className="font-bold text-stone-850 dark:text-stone-100">
                    {todayWeeklyDestrabeAction ? todayWeeklyDestrabeAction : 'No programaste ninguna acción de destrabe para hoy.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enfoque Anti-Reactividad Diario */}
          {antiReactivityTasks.length > 0 && (
            <div className="p-6 rounded-3xl border border-stone-200/60 dark:border-stone-850 bg-stone-50/5 dark:bg-stone-950/5 shadow-soft space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-stone-800 dark:text-stone-200">
                    Tu Enfoque Anti-Reactividad para Hoy
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">DISEÑADO POR TI ANOCHE PARA BLINDAR TU DÍA</p>
                </div>
              </div>
              <div className="space-y-2">
                {antiReactivityTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-stone-900/60 border border-stone-150 dark:border-stone-850 rounded-xl">
                    <span className="h-5 w-5 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-750 dark:text-stone-300">
                      {task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarjeta de Estado del Diario de Hoy */}
          <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 border border-stone-800 relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                Estatus Diario
              </span>
              
              {todayEntry ? (
                <div className="mt-6 space-y-4">
                  <h3 className="text-2xl font-bold">¡Diario de hoy completado con éxito!</h3>
                  <p className="text-sm text-stone-400">
                    Has tomado el control del día al registrar tus hábitos, oraciones y niveles de energía.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="bg-stone-800/60 border border-stone-700/50 px-3 py-2 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-stone-500 block font-mono">Energía</span>
                      <span className="text-lg font-bold text-emerald-400">{todayEntry.energyRating || '-'}/10</span>
                    </div>
                    <div className="bg-stone-800/60 border border-stone-700/50 px-3 py-2 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-stone-500 block font-mono">Enfoque</span>
                      <span className="text-lg font-bold text-emerald-400">{todayEntry.focusRating || '-'}/10</span>
                    </div>
                    <div className="bg-stone-800/60 border border-stone-700/50 px-3 py-2 rounded-xl text-center">
                      <span className="text-[10px] uppercase text-stone-500 block font-mono">Estrés</span>
                      <span className="text-lg font-bold text-amber-500">{todayEntry.stressRating || '-'}/10</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link 
                      href="/journal" 
                      className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Editar diario de hoy <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <h3 className="text-2xl font-bold">¿Cómo quieres gobernar tu día hoy?</h3>
                  <p className="text-sm text-stone-400">
                    Evita que la reactividad dirija tu jornada. Dedica {user.currentLevel === 1 ? '3-5' : user.currentLevel === 2 ? '15' : '20'} minutos para alinear tu identidad con tus acciones.
                  </p>
                  <div className="pt-4">
                    <Link 
                      href="/journal" 
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-950/50 text-sm cursor-pointer hover:opacity-90"
                    >
                      Iniciar Registro Diario <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Elemento de diseño de fondo */}
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/4">
              <BookOpen className="h-64 w-64 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Versículo de Anclaje Diario */}
        <div className="space-y-6">
          {verse && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[350px] shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
                  Anclaje Espiritual del Día
                </span>
                
                <blockquote className="mt-6 text-stone-800 dark:text-stone-200 italic font-semibold leading-relaxed font-serif text-sm">
                  "{verse.text}"
                </blockquote>
                
                <p className="mt-3 text-xs font-bold text-stone-500 dark:text-stone-400 text-right">
                  — {verse.reference}
                </p>
              </div>

              {verse.interpretation && (
                <div className="mt-8 border-t border-stone-150 dark:border-stone-850 pt-4 bg-stone-50 dark:bg-stone-950/20 p-4 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block font-mono mb-1">
                    Aplicación Práctica
                  </span>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {verse.interpretation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}