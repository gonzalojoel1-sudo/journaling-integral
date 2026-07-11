'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { updateUserSetting } from '@/app/actions/user-settings';

interface SettingsTogglesProps {
  showBusinessPanel: boolean;
  showFinancePanel: boolean;
  showHabitsPanel: boolean;
  showQuarterlyPanel: boolean;
  showChallengesPanel: boolean;
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function SettingsToggles({
  showBusinessPanel,
  showFinancePanel,
  showHabitsPanel,
  showQuarterlyPanel,
  showChallengesPanel,
}: SettingsTogglesProps) {
  const [business, setBusiness] = useState(showBusinessPanel);
  const [finance, setFinance] = useState(showFinancePanel);
  const [habits, setHabits] = useState(showHabitsPanel);
  const [quarterly, setQuarterly] = useState(showQuarterlyPanel);
  const [challenges, setChallenges] = useState(showChallengesPanel);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    business !== showBusinessPanel ||
    finance !== showFinancePanel ||
    habits !== showHabitsPanel ||
    quarterly !== showQuarterlyPanel ||
    challenges !== showChallengesPanel;

  const handleSaveAll = async () => {
    setSaving(true);

    const changes: Record<string, boolean> = {};
    if (business !== showBusinessPanel) changes.showBusinessPanel = business;
    if (finance !== showFinancePanel) changes.showFinancePanel = finance;
    if (habits !== showHabitsPanel) changes.showHabitsPanel = habits;
    if (quarterly !== showQuarterlyPanel) changes.showQuarterlyPanel = quarterly;
    if (challenges !== showChallengesPanel) changes.showChallengesPanel = challenges;

    for (const [field, value] of Object.entries(changes)) {
      await updateUserSetting(field, value);
    }

    window.location.reload();
  };

  const toggles = [
    { label: 'Negocios y Emprendimiento', desc: 'Panel 1-1-1, Centro de Mando, ventas', value: business, setter: setBusiness },
    { label: 'Finanzas Personales', desc: 'Mi Capital, donuts, ledger personal', value: finance, setter: setFinance },
    { label: 'Hábitos Diarios', desc: 'Gestor EOR, Habit Stacking, racha', value: habits, setter: setHabits },
    { label: 'Planificación Trimestral', desc: 'Visión 5 años, objetivos SMART, legado', value: quarterly, setter: setQuarterly },
    { label: 'Desafíos y Gamificación', desc: 'Insignias, niveles, retos de disciplina', value: challenges, setter: setChallenges },
  ];

  return (
    <div className="space-y-2">
      {toggles.map(({ label, desc, value, setter }) => (
        <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-white/5">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{label}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono mt-0.5">{desc}</p>
          </div>
          <ToggleSwitch enabled={value} onChange={setter} />
        </div>
      ))}

      {hasChanges && (
        <div className="pt-4">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar y Aplicar Cambios'}
          </button>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono text-center mt-2">
            Se recargará la página para aplicar los cambios
          </p>
        </div>
      )}
    </div>
  );
}
