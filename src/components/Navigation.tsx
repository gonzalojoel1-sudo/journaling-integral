'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react'; 
import { ThemeToggle } from './ThemeToggle';
import { updateUserLevel } from '../app/actions/journal';
import { 
  LayoutDashboard, 
  BookOpen, 
  Compass, 
  Activity, 
  TrendingUp, 
  Settings2,
  Loader2,
  CalendarDays,
  LogOut,
  UserCheck,
  ClipboardCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: LayoutDashboard },
  { label: 'Diario', href: '/journal', icon: BookOpen },
  { label: 'Historial', href: '/history', icon: CalendarDays },
  { label: 'Revisión', href: '/review', icon: ClipboardCheck },
  { label: 'Trimestre', href: '/quarterly', icon: Compass },
  { label: 'Hábitos', href: '/habits', icon: Activity },
  { label: 'Progreso', href: '/progress', icon: TrendingUp },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession(); 
  const [isPending, startTransition] = useTransition();
  const [adminLevel, setAdminLevel] = useState<number>(1);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  const handleLevelChange = (level: number) => {
    setAdminLevel(level);
    startTransition(async () => {
      await updateUserLevel(level);
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* --- NAVEGACIÓN DESKTOP (SIDEBAR) --- */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-r border-stone-200 dark:border-stone-850 z-20 transition-colors">
        {/* Cabecera / Identidad */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              Journaling
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 font-mono">Del Ser al Legado</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Menú de Opciones */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
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

        {/* Controles de Administrador e Información de Usuario */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-850 bg-stone-100/60 dark:bg-stone-950/30">
          
          {session?.user?.email === 'joel@journalingintegral.demo' && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">Panel de Pruebas</span>
                <button 
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  title="Abrir selector de niveles"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              {showAdminPanel && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2.5 rounded-xl mb-4 space-y-2 shadow-sm">
                  <span className="text-[9px] font-bold text-stone-500 uppercase block font-mono">Simular Nivel:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleLevelChange(lvl)}
                        className={`py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          adminLevel === lvl 
                            ? 'bg-emerald-600 text-white shadow' 
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        {isPending && adminLevel === lvl ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          `Lvl ${lvl}`
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información del Usuario Dinámica */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-800/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'JP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">
                  {session?.user?.name || 'Joel Pacheco'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {session ? 'En Sesión' : 'Modo Demo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alternador dinámico de Login / Logout */}
            {session ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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

      {/* --- NAVEGACIÓN MÓVIL (BOTTOM BAR CON THEME TOGGLE INTEGRADO) --- */}
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
        
        {/* Integración del Botón de Modo Claro/Oscuro directamente en el extremo de la barra móvil */}
        <div className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center shrink-0">
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}