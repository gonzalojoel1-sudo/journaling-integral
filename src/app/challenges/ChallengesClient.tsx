'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { activateChallenge } from '../actions/challenges';
import {
  Trophy, Flame, ShieldCheck, Diamond, Crown, Sparkles,
  Hammer, Medal, Star, Sun, BookOpen, Bookmark, Scroll,
  Crosshair, Church, Moon, Zap, Dumbbell, Shield,
  Target, Building, Briefcase, Cpu, Globe, Brain,
  Lightbulb, GraduationCap, Award, Book, Heart,
  HeartHandshake, Users, Infinity, Tent, Pen, Eye,
  Castle, ScrollText, TreePine, Swords, Mountain,
  Compass, Gem, Clock, Banknote, Triangle, Loader2,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  flame: Flame, 'shield-check': ShieldCheck, trophy: Trophy, diamond: Diamond, crown: Crown,
  sparkles: Sparkles, hammer: Hammer, medal: Medal, star: Star, sun: Sun,
  'book-open': BookOpen, bookmark: Bookmark, scroll: Scroll, crosshair: Crosshair, church: Church,
  moon: Moon, zap: Zap, dumbbell: Dumbbell, shield: Shield,
  target: Target, building: Building, briefcase: Briefcase, cpu: Cpu, globe: Globe,
  brain: Brain, lightbulb: Lightbulb, 'graduation-cap': GraduationCap, award: Award, book: Book,
  heart: Heart, 'heart-handshake': HeartHandshake, users: Users, infinity: Infinity, tent: Tent,
  pen: Pen, eye: Eye, castle: Castle, 'scroll-text': ScrollText, 'tree-pine': TreePine,
  swords: Swords, mountain: Mountain, compass: Compass, gem: Gem, clock: Clock,
  banknote: Banknote, triangle: Triangle, 'building-2': Building,
};

const mineralColors: Record<string, string> = {
  bronce: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
  plata: 'text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
  oro: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800',
  diamante: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800',
  legendario: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800',
  especial: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/40 border-pink-300 dark:border-pink-800',
};

const areaLabels: Record<string, string> = {
  disciplina: 'Disciplina', identidad: 'Identidad', fe: 'Fe', cuerpo: 'Cuerpo',
  negocio: 'Negocio', mente: 'Mente', relaciones: 'Relaciones', legado: 'Legado',
  oculto: 'Oculto',
};

const areas = ['disciplina', 'identidad', 'fe', 'cuerpo', 'negocio', 'mente', 'relaciones', 'legado'];

interface Props {
  templates: any[];
  userChallenges: any[];
  badgeIds: Set<string>;
}

export function ChallengesClient({ templates, userChallenges, badgeIds }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('todas');

  const activeMap = new Map(userChallenges.map((c: any) => [c.templateId, c]));
  const completedIds = new Set(userChallenges.filter((c: any) => c.status === 'completed').map((c: any) => c.templateId));

  const handleActivate = async (templateId: string) => {
    setLoading(templateId);
    await activateChallenge(templateId);
    setLoading(null);
    router.refresh();
  };

  const filtered = filter === 'todas'
    ? templates
    : templates.filter((t: any) => t.area === filter);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('todas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'todas' ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Todas
        </button>
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setFilter(area)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === area ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            {areaLabels[area]}
          </button>
        ))}
      </div>

      {/* Grid de desafios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((template: any) => {
          const Icon = iconMap[template.badgeIcon] || Trophy;
          const isCompleted = badgeIds.has(template.id);
          const active = activeMap.get(template.id);
          const isActive = active && active.status === 'active';
          const isLocked = template.requires && !completedIds.has(template.requires) && !isCompleted;

          return (
            <div
              key={template.id}
              className={`relative p-5 rounded-2xl border transition-all ${
                isCompleted
                  ? `${mineralColors[template.mineral]} opacity-90`
                  : isActive
                  ? 'bg-white dark:bg-stone-900 border-emerald-500/50 shadow-md'
                  : isLocked
                  ? 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850 opacity-60'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-850 hover:border-emerald-500/30 shadow-sm'
              }`}
            >
              {/* Badge icono */}
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  isCompleted ? mineralColors[template.mineral] : 'bg-stone-100 dark:bg-stone-800'
                }`}>
                  <Icon className={`h-5 w-5 ${isCompleted ? '' : 'text-stone-400 dark:text-stone-500'}`} />
                </div>
                {isCompleted && (
                  <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    Completado
                  </span>
                )}
                {isActive && (
                  <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    Dia {active.currentDay}/{template.days}
                  </span>
                )}
                {isLocked && (
                  <span className="text-[10px] font-bold uppercase text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    Bloqueado
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">{template.title}</h3>
              <p className="text-xs text-stone-500 mb-1">{template.description}</p>
              <p className="text-[10px] font-bold uppercase text-stone-400 font-mono">
                {template.mineral} · {template.days} dias · {areaLabels[template.area]}
              </p>

              {/* Progress bar for active */}
              {isActive && (
                <div className="mt-3 w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${((active.currentDay - 1) / template.days) * 100}%` }}
                  />
                </div>
              )}

              {/* Activate button */}
              {!isCompleted && !isActive && !isLocked && (
                <button
                  onClick={() => handleActivate(template.id)}
                  disabled={loading === template.id}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-colors disabled:bg-stone-400 cursor-pointer"
                >
                  {loading === template.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>Activar Desafio</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
