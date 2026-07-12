'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-[var(--text-primary)] text-lg font-semibold mb-2">
          Algo salió mal
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-card-border)]
                     text-[var(--text-primary)] text-sm font-medium
                     hover:bg-[var(--surface-elevated)] hover:border-[var(--surface-elevated-border)]
                     transition-all duration-200 shadow-surface"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
