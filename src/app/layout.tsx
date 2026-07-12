import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { MainWrapper } from '@/components/MainWrapper';
import { Providers } from './providers';
import { KairoChat } from '@/components/KairoChat';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Journaling Integral — Del Ser al Legado',
  description: 'Sistema integral de transformación diaria, planificación estratégica y disciplina espiritual.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Journaling" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0c0a09" />
      </head>
      <body className={`${inter.className} h-full antialiased text-stone-900 bg-stone-50 dark:text-stone-100 dark:bg-stone-950`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col md:flex-row">
            <Navigation />

            <MainWrapper>
              <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <OnboardingGuard>{children}</OnboardingGuard>
              </div>
            </MainWrapper>
          </div>

          <KairoChat />
        </Providers>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA Service Worker registrado con éxito:', reg.scope);
                  }, function(err) {
                    console.log('Error al registrar PWA Service Worker:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
