import React from 'react';
import Link from 'next/link';
import { db } from '../db/db';
import { dailyEntries, users } from '../db/schema';
import { getOrCreateUserProfile } from './actions/auth';
import { getRandomVerse } from './actions/bible';
import { getActiveWeeklyPlan } from './actions/weekly-planning';
import { getActiveChallenges, getBadges } from './actions/challenges';
import { getActiveHabits } from './actions/habits';
import { getDailyBusinessMetrics } from './actions/daily-journal';
import { getBusinessSettingsList } from './actions/business';
import { getUserSettings } from './actions/user-settings';
import { ALL_TEMPLATES } from '@/lib/challenge-templates';
import { getCurrentEscalon, getNextEscalon } from '@/lib/challenge-auto-activate';
import { eq, and } from 'drizzle-orm';
import {
  Flame,
  Award,
  ArrowRight,
  Zap,
  Brain,
  Moon,
  AlertTriangle,
  BookOpen,
  Trophy,
  Mic,
} from 'lucide-react';
import { PriorityChecklist } from './dashboard/PriorityChecklist';
import { HabitProgress } from './dashboard/HabitProgress';
import { BizCompactPanel } from './dashboard/BizCompactPanel';
import { PersonalFinanceWidget } from './dashboard/PersonalFinanceWidget';
import { CircleWidget } from '@/components/circles/CircleWidget';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profileRes = await getOrCreateUserProfile();
  const user = profileRes.user;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error al cargar la información del usuario.</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const todayEntry = await db.query.dailyEntries.findFirst({
    where: and(
      eq(dailyEntries.userId, user.id),
      eq(dailyEntries.date, todayStr)
    ),
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const yesterdayEntry = await db.query.dailyEntries.findFirst({
    where: and(
      eq(dailyEntries.userId, user.id),
      eq(dailyEntries.date, yesterdayStr)
    ),
  });

  const prepTomorrowTasks: string[] = yesterdayEntry?.prepTomorrowJson
    ? JSON.parse(yesterdayEntry.prepTomorrowJson)
    : [];

  const weeklyPlanRes = await getActiveWeeklyPlan();
  const activeWeeklyPlan = weeklyPlanRes.plan;

  let todayWeeklyDestrabeAction = '';
  let weeklyFocusText = '';

  if (activeWeeklyPlan) {
    weeklyFocusText = activeWeeklyPlan.focus;
    try {
      const parsedTasks = JSON.parse(activeWeeklyPlan.tasksJson);
      const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const todayDayName = daysInSpanish[new Date().getDay()];
      const foundTask = parsedTasks.find((t: any) => t.day === todayDayName);
      if (foundTask && foundTask.task.trim() !== '') {
        todayWeeklyDestrabeAction = foundTask.task;
      }
    } catch (e) {
      console.error('Error al parsear tareas semanales:', e);
    }
  }

  const verse = await getRandomVerse(user.currentLevel);

  const challengesRes = await getActiveChallenges();
  const activeChallenges = challengesRes.challenges || [];

  const badgesRes = await getBadges();
  const userBadges = badgesRes.badges || [];

  const habitsRes = await getActiveHabits();
  const habitsList = habitsRes.habits || [];

  const todayBizMetrics = await getDailyBusinessMetrics(todayStr);
  const bizUnitsRes = await getBusinessSettingsList();
  const bizUnits = Array.isArray(bizUnitsRes) ? bizUnitsRes : [];
  const todayIncome = todayBizMetrics.success ? (todayBizMetrics.totalIncome ?? 0) : 0;

  const userSettings = await getUserSettings();

  let parsedHabits: { id: string; name: string; habitType: string; completed?: boolean; currentStrength?: number; lastStrengthDate?: string | null; activeAction?: string | null; rescueAction?: string | null; celebration?: string | null }[] = [];
  let initialCompletedIds: string[] = [];

  if (habitsList.length > 0) {
    if (todayEntry?.dailyHabitsJson) {
      try {
        const savedHabits = JSON.parse(todayEntry.dailyHabitsJson);
        parsedHabits = savedHabits.map((h: any) => {
          const dbHabit = habitsList.find(dbh => dbh.id === h.habitId);
          return {
            id: h.habitId,
            name: h.name,
            habitType: h.habitType || h.type,
            completed: h.completed,
            currentStrength: dbHabit?.currentStrength ?? 0,
            lastStrengthDate: dbHabit?.lastStrengthDate ?? null,
            activeAction: dbHabit?.activeAction ?? null,
            rescueAction: dbHabit?.rescueAction ?? null,
            celebration: dbHabit?.celebration ?? null,
          };
        });
        initialCompletedIds = savedHabits
          .filter((h: any) => h.completed)
          .map((h: any) => h.habitId);
      } catch {
        parsedHabits = habitsList.map((h) => ({ id: h.id, name: h.name, habitType: h.habitType, currentStrength: h.currentStrength ?? 0, lastStrengthDate: h.lastStrengthDate ?? null, activeAction: h.activeAction ?? null, rescueAction: h.rescueAction ?? null, celebration: h.celebration ?? null }));
      }
    } else {
      parsedHabits = habitsList.map((h) => ({ id: h.id, name: h.name, habitType: h.habitType, currentStrength: h.currentStrength ?? 0, lastStrengthDate: h.lastStrengthDate ?? null, activeAction: h.activeAction ?? null, rescueAction: h.rescueAction ?? null, celebration: h.celebration ?? null }));
    }
  }

  const streak = user.streakCurrent || 0;
  const currentEscalon = getCurrentEscalon(streak);
  const nextEscalon = getNextEscalon(streak);

  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const now = new Date();
  const formattedDate = `${daysOfWeek[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]}`;

  const bizProspectDone = todayEntry?.bizProspectCompleted === 1;
  const bizFollowUpDone = todayEntry?.bizFollowUpCompleted === 1;
  const bizMktDone = todayEntry?.bizMktActionCompleted === 1;

  let bizProspectText = '';
  let bizFollowUpText = '';
  let bizMktText = '';
  if (todayEntry?.bizActionsSpecific) {
    try {
      const parsed = JSON.parse(todayEntry.bizActionsSpecific);
      bizProspectText = parsed.prospect || '';
      bizFollowUpText = parsed.followUp || '';
      bizMktText = parsed.mkt || '';
    } catch {}
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HEADER MINIMAL ── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
            {formattedDate}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Buenos días, {user.name}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/voice-journal"
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg text-xs"
          >
            <Mic className="w-4 h-4" />
            <span className="font-medium hidden sm:inline">Diario por Voz</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 leading-none">
                {user.streakCurrent}
              </p>
              <p className="text-[9px] font-mono text-zinc-400 uppercase">días</p>
            </div>
          </div>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 leading-none">
                {currentEscalon.name}
              </p>
              <p className="text-[9px] font-mono text-zinc-400 uppercase">
                {nextEscalon ? `${nextEscalon.days - streak}d → ${nextEscalon.name}` : '¡Completado!'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO: LISTA DE PRIORIDADES ── */}
      <section>
        <PriorityChecklist
          mitSer={todayEntry?.mitSer ?? null}
          mitSerCompleted={todayEntry?.mitSerCompleted === 1}
          mitNegocio={todayEntry?.mitNegocio ?? null}
          mitNegocioCompleted={todayEntry?.mitNegocioCompleted === 1}
          mitRelaciones={todayEntry?.mitRelaciones ?? null}
          mitRelacionesCompleted={todayEntry?.mitRelacionesCompleted === 1}
          weeklyDestrabeAction={todayWeeklyDestrabeAction}
          weeklyFocus={weeklyFocusText}
          prepTomorrowTasks={prepTomorrowTasks}
          hasEntryToday={!!todayEntry}
        />
      </section>

      {/* ── GRID DE ECOSISTEMA COMPACTO ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Panel Negocio 1-1-1 */}
        {userSettings?.showBusinessPanel && (
          <BizCompactPanel
            prospectDone={bizProspectDone}
            followUpDone={bizFollowUpDone}
            mktDone={bizMktDone}
            prospectText={bizProspectText}
            followUpText={bizFollowUpText}
            mktText={bizMktText}
            contacts={todayEntry?.bizContactsCount ?? 0}
            sales={todayEntry?.bizSalesCount ?? 0}
            income={todayIncome}
            hasEntry={!!todayEntry}
            businessUnits={bizUnits}
          />
        )}

        {/* Capital Personal */}
        {userSettings?.showFinancePanel && <PersonalFinanceWidget />}

        {/* Círculo de Confianza */}
        <section className="md:col-span-1">
          <CircleWidget />
        </section>

        {/* Hábitos EOR */}
        <HabitProgress habits={parsedHabits} initialCompletedIds={initialCompletedIds} />

        {/* Pulso Vital */}
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Pulso Vital
            </h3>
            {todayEntry && (
              <span className="text-[9px] font-bold font-mono text-zinc-400 uppercase">
                Hoy
              </span>
            )}
          </div>

          {todayEntry ? (
            <div className="grid grid-cols-2 gap-3">
              <VitalMetric
                icon={<Moon className="h-3.5 w-3.5" />}
                label="Sueño"
                value={todayEntry.sleepRating}
                color="sky"
              />
              <VitalMetric
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Energía"
                value={todayEntry.energyRating}
                color="emerald"
              />
              <VitalMetric
                icon={<Brain className="h-3.5 w-3.5" />}
                label="Enfoque"
                value={todayEntry.focusRating}
                color="cyan"
              />
              <VitalMetric
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="Estrés"
                value={todayEntry.stressRating}
                color="amber"
                inverted
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Registra tu diario para ver tu pulso vital
              </p>
            </div>
          )}
        </div>

        {/* Anclaje Espiritual */}
        <div className="surface-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Anclaje Espiritual
            </h3>
            {verse && (
              <span className="text-[9px] font-bold font-mono text-violet-500 dark:text-violet-400 uppercase">
                {verse.topic || 'Hoy'}
              </span>
            )}
          </div>

          {verse ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <blockquote className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed font-serif">
                  &ldquo;{verse.text}&rdquo;
                </blockquote>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 text-right mt-2 font-mono">
                  — {verse.reference}
                </p>
              </div>
              {verse.interpretation && (
                <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono mb-1">
                    Aplicación
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {verse.interpretation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                No hay versículo disponible hoy
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── GAMIFICACIÓN COMPACTA (Footer) ── */}
      <section className="surface-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Tu Progreso — Escalones */}
          <div className="bg-gradient-to-br from-amber-900/60 to-yellow-900/40 rounded-2xl p-5 border border-amber-700/30 flex-1 min-w-0">
            <h3 className="text-amber-300 font-semibold text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Tu Progreso
            </h3>
            <p className="text-white text-lg font-bold mt-2">
              {currentEscalon.name}
            </p>
            {nextEscalon ? (
              <p className="text-amber-400/80 text-xs mt-1">
                🎯 Te faltan {nextEscalon.days - streak} días para &quot;{nextEscalon.name}&quot;
              </p>
            ) : (
              <p className="text-yellow-400 text-xs mt-1">
                ✨ ¡Completaste todos los escalones!
              </p>
            )}
            <div className="mt-3 w-full bg-amber-950/50 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (streak / 365) * 100)}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:block h-10 w-px bg-zinc-200/50 dark:bg-zinc-800/50" />

          {/* Desafío Activo */}
          {activeChallenges.length > 0 && (() => {
            const ch = activeChallenges[0];
            const template = ALL_TEMPLATES.find((t) => t.id === ch.templateId);
            if (!template) return null;
            const chPercent = Math.round(((ch.currentDay - 1) / template.days) * 100);
            return (
              <div className="sm:w-56 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                    Desafío
                  </span>
                </div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {template.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1 flex-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${chPercent}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 shrink-0">
                    {ch.currentDay}/{template.days}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="hidden sm:block h-10 w-px bg-zinc-200/50 dark:bg-zinc-800/50" />

          {/* Insignias */}
          <div className="sm:w-40 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                Insignias
              </span>
            </div>
            <Link
              href="/progress"
              className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {userBadges.length} <span className="text-xs font-normal text-zinc-400">/ 50</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA DIARIO (si no hay entrada hoy) ── */}
      {!todayEntry && (
        <section className="surface-elevated p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              ¿Listo para gobernar tu día?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Dedica {user.currentLevel === 1 ? '3-5' : user.currentLevel === 2 ? '15' : '20'} minutos para alinear tu identidad con tus acciones.
            </p>
          </div>
          <Link
            href="/journal"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-sm shadow-emerald-600/20 shrink-0"
          >
            Iniciar Registro Diario <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

    </div>
  );
}

/* ── SUB-COMPONENTES INLINE (Server Components) ── */

function VitalMetric({
  icon,
  label,
  value,
  color,
  inverted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  color: 'sky' | 'emerald' | 'cyan' | 'amber';
  inverted?: boolean;
}) {
  const colorMap = {
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  };

  const c = colorMap[color];
  const isGood = value !== null && (inverted ? value <= 5 : value >= 7);

  return (
    <div className={`p-3 rounded-xl ${isGood ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : 'bg-zinc-100/50 dark:bg-zinc-800/30'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`h-5 w-5 rounded ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
          {label}
        </span>
      </div>
      <p className={`text-xl font-extrabold ${
        isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
      }`}>
        {value ?? '—'}
        <span className="text-xs font-medium text-zinc-400 ml-0.5">/10</span>
      </p>
    </div>
  );
}
