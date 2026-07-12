'use client';

import { useEffect } from 'react';

export default function NegocioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Negocio Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
            />
          </svg>
        </div>
        <h2 className="text-[var(--text-primary)] text-lg font-semibold mb-2">
          Error en Negocio
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-5 leading-relaxed">
          No se pudieron cargar los datos de tu negocio. Intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-card-border)]
                     text-[var(--text-primary)] text-sm font-medium
                     hover:bg-[var(--surface-elevated)] hover:border-[var(--surface-elevated-border)]
                     transition-all duration-200"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
