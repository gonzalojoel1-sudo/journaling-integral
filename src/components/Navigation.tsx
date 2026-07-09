'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DesktopSidebar } from './Navigation/DesktopSidebar';
import { MobileNav } from './Navigation/MobileNav';
import { ThemeToggle } from './ThemeToggle';
import { DEMO_USER_EMAIL } from '@/lib/constants';

function DesktopSkeleton() {
  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-850 z-20" />
  );
}

function MobileSkeleton() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-850 z-30" />
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

      {mounted ? (
        <DesktopSidebar
          pathname={pathname}
          isAdmin={isAdmin}
          userName={userName}
          isLoggedIn={isLoggedIn}
        />
      ) : (
        <DesktopSkeleton />
      )}

      {mounted ? (
        <MobileNav isAdmin={isAdmin} />
      ) : (
        <MobileSkeleton />
      )}
    </>
  );
}
