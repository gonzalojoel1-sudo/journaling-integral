'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <main
      className={`flex-1 min-h-screen pb-20 md:pb-0 flex flex-col ${
        status === 'authenticated' && !isLoginPage ? 'md:pl-64' : ''
      }`}
    >
      {children}
    </main>
  );
}
