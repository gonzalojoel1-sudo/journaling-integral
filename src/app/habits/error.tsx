'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function HabitsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('habits_route_error', { digest: error.digest }, error);
  }, [error, error.digest]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-red-600">Algo salió mal</h2>
      <p className="mt-2 text-zinc-600">No pudimos cargar tus hábitos.</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded"
      >
        Reintentar
      </button>
    </div>
  );
}