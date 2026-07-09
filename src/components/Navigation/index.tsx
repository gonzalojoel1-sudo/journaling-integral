'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from '../ThemeToggle';
import { DEMO_USER_EMAIL } from '@/lib/constants';

function NavSkeleton() {
  return (
    <>
      <div className="md:hidden fixed top-4 right-4 z-40 print:hidden animate-fade-in">
        <div className="glass-panel shadow-soft rounded-xl p-1 h-10 w-10" />
      </div>
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-850 z-20" />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-850 z-30" />
    </>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <NavSkeleton />;
  }

  const isAdmin = session?.user?.email === DEMO_USER_EMAIL;
  const userName = session?.user?.name || 'Joel Pacheco';
  const isLoggedIn = !!session;

  return (
    <>
      <div className="md:hidden fixed top-4 right-4 z-40 print:hidden animate-fade-in">
        <div className="glass-panel shadow-soft rounded-xl p-1">
          <ThemeToggle />
        </div>
      </div>

      <DesktopSidebar
        pathname={pathname}
        isAdmin={isAdmin}
        userName={userName}
        isLoggedIn={isLoggedIn}
      />

      <MobileNav isAdmin={isAdmin} />
    </>
  );
}
