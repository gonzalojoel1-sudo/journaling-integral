'use client';

import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { upsertBusinessSetting } from '@/app/actions/business';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Servicio', 'Producto', 'Curso', 'Mentoría'];

export function CreateFirstUnitGate() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Servicio');
  const [saleAmount, setSaleAmount] = useState('');
  const [cost, setCost] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    console.log('[GATE] Creating unit:', { name, category, saleAmount, cost, monthlyGoal, isRecurring });
    try {
      const result = await upsertBusinessSetting({
        name,
        defaultSaleAmount: Number(saleAmount) || 0,
        defaultSaleCost: Number(cost) || 0,
        category,
        monthlyGoal: Number(monthlyGoal) || 0,
        isRecurring: isRecurring ? 1 : 0,
        isActive: true,
      });
      console.log('[GATE] Result:', result);
      if (result?.success) {
        router.refresh();
        router.replace('/negocio');
      } else {
        console.error('[GATE] Server returned error:', result?.error);
        setSaving(false);
      }
    } catch (err) {
      console.error('[GATE] Client exception:', err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-lg w-full p-8 space-y-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-emerald-500/10 items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Crea tu primera unidad de negocio
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Define qué vendes para empezar a trackear tu negocio. Puedes agregar más después.
        </p>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 space-y-4 text-left">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sesión de Coaching, Curso de Marketing"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Precio de venta ($)</label>
              <input
                type="number"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Costo ($)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Meta mensual ($)</label>
            <input
              type="number"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              placeholder="Ingreso objetivo mensual"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600 w-4 h-4"
            />
            ¿Es recurrente? (ingresos mensuales o suscripciones)
          </label>

          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold px-6 py-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            {saving ? 'Creando...' : 'Crear mi primera unidad'}
          </button>
        </div>
      </div>
    </div>
  );
}
