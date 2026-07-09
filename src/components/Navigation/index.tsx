'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from '../ThemeToggle';

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <div className="md:hidden fixed top-4 right-4 z-40 print:hidden animate-fade-in">
        <div className="glass-panel shadow-soft rounded-xl p-1">
          <ThemeToggle />
        </div>
      </div>

      <DesktopSidebar
        pathname={pathname}
        isAdmin={true}
        userName="Joel Pacheco"
        isLoggedIn={true}
      />

      <MobileNav />
    </>
  );
}
