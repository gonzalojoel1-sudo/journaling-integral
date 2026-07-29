'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { BusinessSettingsModal } from '@/components/business/BusinessSettingsModal';

interface BusinessSetting {
  id: string;
  name: string;
  defaultSaleAmount: number;
  defaultSaleCost: number;
  isActive: number;
  category?: string;
  monthlyGoal?: number;
  isRecurring?: number;
}

interface BusinessSettingsProps {
  initialSettings: BusinessSetting[];
}

export function BusinessSettings({ initialSettings }: BusinessSettingsProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        onClick={() => setShow(true)}
        aria-label="Configuración de Negocios"
        className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        title="Configuración de Negocios"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>

      {show && (
        <BusinessSettingsModal
          settings={initialSettings}
          onClose={() => setShow(false)}
        />
      )}
    </>
  );
}
