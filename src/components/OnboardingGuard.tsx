import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserSettings } from '@/app/actions/user-settings';

export async function OnboardingGuard({ children }: { children: React.ReactNode }) {
  try {
    const h = await headers();
    const pathname = h.get('x-pathname') || '/';

    if (pathname === '/onboarding' || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return <>{children}</>;
    }

    const settings = await getUserSettings();
    if (!settings.onboardingCompleted) {
      redirect('/onboarding');
    }
  } catch {
    // Auth not available yet — middleware will handle redirect to login
  }

  return <>{children}</>;
}
