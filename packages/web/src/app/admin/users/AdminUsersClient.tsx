'use client';

import React from 'react';
import { 
  User, 
  Flame, 
  Calendar, 
  Activity, 
  BookOpen, 
  Briefcase, 
  Settings,
  Sparkles,
  Award
} from 'lucide-react';

interface UserStats {
  totalEntries: number;
  devotionalsCompleted: number;
  businessCompleted: number;
  habitsCount: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  streakCurrent: number;
  streakMax: number;
  createdAt: string;
  stats: UserStats;
}

interface AdminUsersClientProps {
  users: AdminUser[];
}

export function AdminUsersClient({ users }: AdminUsersClientProps) {
  
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Efectos estéticos */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      {/* Grid de Tarjetas de Usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {users.map((user) => {
          // Evaluación de Engagement (¿Qué usa y qué no?)
          const usesSpiritual = user.stats.devotionalsCompleted > 0;
          const usesBusiness = user.stats.businessCompleted > 0;
          const usesHabits = user.stats.habitsCount > 0;

          return (
            <div 
              key={user.id} 
              className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 bg-white/80 dark:bg-stone-900/70 backdrop-blur-md shadow-soft space-y-6 hover:shadow transition-all duration-300"
            >
              {/* Bloque Superior: Info Básica */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-stone-150 dark:border-stone-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-800/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-stone-850 dark:text-stone-100 truncate">{user.name}</h3>
                    <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Nivel Badge */}
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-900/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shrink-0">
                  Lvl {user.currentLevel}
                </span>
              </div>

              {/* Bloque Medio: Estadísticas de Registro y Racha */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-150 dark:border-stone-850/60">
                  <Flame className="h-4 w-4 text-amber-500 fill-current" />
                  <div>
                    <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">Racha Activa</span>
                    <strong className="text-stone-800 dark:text-stone-200">{user.streakCurrent} d (Máx: {user.streakMax}d)</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-150 dark:border-stone-850/60">
                  <Calendar className="h-4 w-4 text-stone-400" />
                  <div>
                    <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">Fecha Registro</span>
                    <strong className="text-stone-800 dark:text-stone-200">{formatDate(user.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* --- CONTROL DE MÉTRICAS (¿Qué usa y qué no?) --- */}
              <div className="p-4 rounded-2xl bg-stone-50/50 dark:bg-stone-950/30 border border-stone-200/60 dark:border-stone-850/60 space-y-3">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                  Auditoría de Engagement y Uso de Módulos
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-semibold">
                  
                  {/* Devocional */}
                  <div className="space-y-1">
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">Sección Devocional:</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${usesSpiritual ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>
                      <BookOpen className="h-3.5 w-3.5" /> 
                      {usesSpiritual ? `${user.stats.devotionalsCompleted} completados` : 'Inactivo / Omitido'}
                    </span>
                  </div>

                  {/* Negocio 1-1-1 */}
                  <div className="space-y-1">
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">Módulo Negocios 1-1-1:</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${usesBusiness ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400'}`}>
                      <Briefcase className="h-3.5 w-3.5" /> 
                      {usesBusiness ? `${user.stats.businessCompleted} completados` : 'Inactivo / Omitido'}
                    </span>
                  </div>

                  {/* Hábitos EOR */}
                  <div className="space-y-1">
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">Hábitos EOR (Catálogo):</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${usesHabits ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-400'}`}>
                      <Activity className="h-3.5 w-3.5" /> 
                      {usesHabits ? `${user.stats.habitsCount} activos` : 'Inactivo / Omitido'}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}