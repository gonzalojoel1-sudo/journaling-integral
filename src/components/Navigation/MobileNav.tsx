'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ThemeToggle';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Activity,
  TrendingUp,
  CalendarDays,
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
  { label: 'Admin', href: '/admin/users', icon: ShieldAlert },
];

interface MobileNavProps {
  isAdmin: boolean;
}

export function MobileNav({ isAdmin: _isAdmin }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-850 text-stone-500 dark:text-stone-300 flex items-center justify-around px-2 pb-safe z-30 shadow-lg transition-colors">
      {NAV_ITEMS.map((item) => {
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
