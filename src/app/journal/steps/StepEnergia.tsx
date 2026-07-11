'use client';

import React from 'react';
import { Activity } from 'lucide-react';

interface StepEnergiaProps {
  sleepRating: number;
  setSleepRating: (v: number) => void;
  energyRating: number;
  setEnergyRating: (v: number) => void;
  focusRating: number;
  setFocusRating: (v: number) => void;
  stressRating: number;
  setStressRating: (v: number) => void;
  quickEnergyAction: string;
  setQuickEnergyAction: (v: string) => void;
}

export function StepEnergia({
  sleepRating,
  setSleepRating,
  energyRating,
  setEnergyRating,
  focusRating,
  setFocusRating,
  stressRating,
  setStressRating,
  quickEnergyAction,
  setQuickEnergyAction,
}: StepEnergiaProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SliderField
          label="Sueño / Descanso"
          value={sleepRating}
          onChange={setSleepRating}
          icon="😴"
        />
        <SliderField
          label="Energía Física"
          value={energyRating}
          onChange={setEnergyRating}
          icon="⚡"
        />
        <SliderField
          label="Enfoque Mental"
          value={focusRating}
          onChange={setFocusRating}
          icon="🧠"
        />
        <SliderField
          label="Estrés / Tensión"
          value={stressRating}
          onChange={setStressRating}
          icon="😰"
          inverted
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
          Acción rápida para mejorar energía:
        </label>
        <input
          type="text"
          value={quickEnergyAction}
          onChange={(e) => setQuickEnergyAction(e.target.value)}
          placeholder="Ej. Beber 500ml de agua, caminar 5 min"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>
    </div>
  );
}

export function getEnergiaSummary(
  sleep: number,
  energy: number,
  focus: number,
  stress: number
): string {
  return `😴 ${sleep} · ⚡ ${energy} · 🧠 ${focus} · 😰 ${stress}`;
}

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: string;
  inverted?: boolean;
}

function SliderField({ label, value, onChange, icon, inverted = false }: SliderFieldProps) {
  const isGood = inverted ? value <= 5 : value >= 7;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          {label}
        </span>
        <span className={`text-sm font-extrabold font-mono ${
          isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'
        }`}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
