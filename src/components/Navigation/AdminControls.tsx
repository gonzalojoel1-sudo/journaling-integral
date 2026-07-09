'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserLevel } from '../../app/actions/journal';
import { Settings2, Loader2 } from 'lucide-react';

export function AdminControls() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adminLevel, setAdminLevel] = useState<number>(1);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  const handleLevelChange = (level: number) => {
    setAdminLevel(level);
    startTransition(async () => {
      await updateUserLevel(level);
      router.refresh();
    });
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
          Panel de Pruebas
        </span>
        <button
          onClick={() => setShowAdminPanel(!showAdminPanel)}
          className="text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400"
          title="Abrir selector de niveles"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {showAdminPanel && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2.5 rounded-xl mb-4 space-y-2 shadow-sm">
          <span className="text-[9px] font-bold text-stone-500 uppercase block font-mono">
            Simular Nivel:
          </span>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleLevelChange(lvl)}
                className={`py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  adminLevel === lvl
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {isPending && adminLevel === lvl ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  `Lvl ${lvl}`
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
