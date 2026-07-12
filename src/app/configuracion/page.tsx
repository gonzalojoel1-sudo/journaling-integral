import React from 'react';
import { Settings2 } from 'lucide-react';
import { getUserSettings } from '../actions/user-settings';
import { SettingsToggles } from './SettingsToggles';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const settings = await getUserSettings();

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 font-mono">
          Preferencias
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
          Configuración
        </h1>
      </header>

      <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 font-mono">
            Módulos Activos
          </span>
        </div>

        <SettingsToggles
          showBusinessPanel={settings?.showBusinessPanel ?? false}
          showFinancePanel={settings?.showFinancePanel ?? false}
          showHabitsPanel={settings?.showHabitsPanel ?? false}
          showQuarterlyPanel={settings?.showQuarterlyPanel ?? false}
          showChallengesPanel={settings?.showChallengesPanel ?? false}
          aiAssistantEnabled={settings?.aiAssistantEnabled ?? true}
        />
      </section>
    </div>
  );
}
