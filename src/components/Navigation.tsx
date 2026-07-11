'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
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

const DESKTOP_NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: LayoutDashboard },
  { label: 'Diario', href: '/journal', icon: BookOpen },
  { label: 'Historial', href: '/history', icon: CalendarDays },
  { label: 'Revisión', href: '/review', icon: ClipboardCheck },
  { label: 'Trimestre', href: '/quarterly', icon: Compass },
  { label: 'Desafios', href: '/challenges', icon: Trophy },
  { label: 'Hábitos', href: '/habits', icon: Activity },
  { label: 'Progreso', href: '/progress', icon: TrendingUp },
  { label: 'Usuarios (Admin)', href: '/admin/users', icon: ShieldAlert },
];

const MOBILE_NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: LayoutDashboard },
  { label: 'Diario', href: '/journal', icon: BookOpen },
  { label: 'Historial', href: '/history', icon: CalendarDays },
  { label: 'Revisión', href: '/review', icon: ClipboardCheck },
  { label: 'Trimestre', href: '/quarterly', icon: Compass },
  { label: 'Desafios', href: '/challenges', icon: Trophy },
  { label: 'Hábitos', href: '/habits', icon: Activity },
  { label: 'Progreso', href: '/progress', icon: TrendingUp },
  { label: 'Admin', href: '/admin/users', icon: ShieldAlert },
];

interface DesktopSidebarProps {
  pathname: string;
}

function DesktopSidebar({ pathname }: DesktopSidebarProps) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

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
        {DESKTOP_NAV_ITEMS.map((item) => {
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
        <AdminControls />
        
        {mounted && (status === 'authenticated' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        ) : status === 'unauthenticated' ? (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            Iniciar Sesión
          </Link>
        ) : null)}
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-850 text-stone-500 dark:text-stone-300 flex items-center justify-around px-2 pb-safe z-30 shadow-lg transition-colors">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1 truncate max-w-[64px]">
              {item.label}
            </span>
          </Link>
        );
      })}

      <div className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center shrink-0">
        <ThemeToggle />
      </div>
    </nav>
  );
}

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <DesktopSidebar pathname={pathname} />

      <MobileNav />
    </>
  );
}
