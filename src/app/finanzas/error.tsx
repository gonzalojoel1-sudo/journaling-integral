'use client';

import { useEffect } from 'react';

export default function FinanzasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Finanzas Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-[var(--text-primary)] text-lg font-semibold mb-2">
          Error en Finanzas
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-5 leading-relaxed">
          No se pudieron cargar tus datos financieros. Verifica tu conexión e intenta de nuevo.
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
