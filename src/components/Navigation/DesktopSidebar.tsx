'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '../ThemeToggle';
import { AdminControls } from './AdminControls';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Activity,
  TrendingUp,
  CalendarDays,
  LogOut,
  UserCheck,
  ClipboardCheck,
  ShieldAlert,
  Trophy,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: LayoutDashboard },
  { label: 'Diario', href: '/journal', icon: BookOpen },
  { label: 'Historial', href: '/history', icon: CalendarDays },
  { label: 'Revisión', href: '/review', icon: ClipboardCheck },
  { label: 'Trimestre', href: '/quarterly', icon: Compass },
  { label: 'Desafios', href: '/challenges', icon: Trophy },
  { label: 'Hábitos', href: '/habits', icon: Activity },
  { label: 'Progreso', href: '/progress', icon: TrendingUp },
];

interface DesktopSidebarProps {
  pathname: string;
  isAdmin: boolean;
  userName: string;
  isLoggedIn: boolean;
}

export function DesktopSidebar({ pathname, isAdmin, userName, isLoggedIn }: DesktopSidebarProps) {
  const dynamicNavItems = isAdmin
    ? [...NAV_ITEMS, { label: 'Usuarios (Admin)', href: '/admin/users', icon: ShieldAlert }]
    : NAV_ITEMS;

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-r border-stone-200 dark:border-stone-850 z-20 transition-colors">
      <div className="p-6 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            Journaling
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-mono">Del Ser al Legado</p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {dynamicNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-[12px]'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-850'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-200 dark:border-stone-850 bg-stone-100/60 dark:bg-stone-950/30">
        {isAdmin && <AdminControls />}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-800/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
              {userName ? userName.substring(0, 2).toUpperCase() : 'JP'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{userName || 'Joel Pacheco'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {isLoggedIn ? 'En Sesión' : 'Modo Demo'}
                </span>
              </div>
            </div>
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-350 text-stone-700 dark:text-stone-300 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Cerrar Sesión
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition-colors text-center shadow-sm"
            >
              <UserCheck className="h-3.5 w-3.5" /> Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
