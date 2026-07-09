'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from '../ThemeToggle';
import { DEMO_USER_EMAIL } from '@/lib/constants';

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

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
