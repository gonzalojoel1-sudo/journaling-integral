'use client';

import React, { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { upsertBusinessSetting, deleteBusinessSetting } from '@/app/actions/business';
import { useRouter } from 'next/navigation';

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

interface BusinessSettingsModalProps {
  settings: BusinessSetting[];
  onClose: () => void;
  initialShowNew?: boolean;
}

export function BusinessSettingsModal({ settings, onClose, initialShowNew = false }: BusinessSettingsModalProps) {
  const router = useRouter();
  const [items, setItems] = useState(settings);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCategory, setNewCategory] = useState('Servicio');
  const [newMonthlyGoal, setNewMonthlyGoal] = useState('');
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [showNew, setShowNew] = useState(initialShowNew);

  const handleSaveItem = async (item: BusinessSetting) => {
    setSaving(true);
    await upsertBusinessSetting({
      id: item.id,
      name: item.name,
      defaultSaleAmount: item.defaultSaleAmount,
      defaultSaleCost: item.defaultSaleCost,
      isActive: true,
      category: item.category,
      monthlyGoal: item.monthlyGoal,
      isRecurring: item.isRecurring ? 1 : 0,
    });
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    await deleteBusinessSetting(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSaving(false);
    router.refresh();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await upsertBusinessSetting({
      name: newName,
      defaultSaleAmount: Number(newAmount) || 0,
      defaultSaleCost: Number(newCost) || 0,
      isActive: true,
      category: newCategory,
      monthlyGoal: Number(newMonthlyGoal) || 0,
      isRecurring: newIsRecurring ? 1 : 0,
    });
    setNewName('');
    setNewAmount('');
    setNewCost('');
    setNewCategory('Servicio');
    setNewMonthlyGoal('');
    setNewIsRecurring(false);
    setShowNew(false);
    setSaving(false);
    router.refresh();
    onClose();
  };

  const handleUpdateField = (id: string, field: string, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            Unidades de Negocio
          </span>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateField(item.id, 'name', e.target.value)}
                  className="bg-transparent text-sm font-semibold text-zinc-900 dark:text-zinc-200 outline-none border-b border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 w-32"
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  Eliminar
                </button>
              </div>
              <select
                value={item.category}
                onChange={(e) => handleUpdateField(item.id, 'category', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              >
                <option value="Servicio">Servicio</option>
                <option value="Producto">Producto</option>
                <option value="Curso">Curso</option>
                <option value="Mentoría">Mentoría</option>
              </select>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-0.5">
                    Venta ($)
                  </span>
                  <input
                    type="number"
                    value={item.defaultSaleAmount}
                    onChange={(e) =>
                      handleUpdateField(item.id, 'defaultSaleAmount', Number(e.target.value))
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-0.5">
                    Costo ($)
                  </span>
                  <input
                    type="number"
                    value={item.defaultSaleCost}
                    onChange={(e) =>
                      handleUpdateField(item.id, 'defaultSaleCost', Number(e.target.value))
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-0.5">
                    Meta mensual ($)
                  </span>
                  <input
                    type="number"
                    value={item.monthlyGoal}
                    onChange={(e) =>
                      handleUpdateField(item.id, 'monthlyGoal', Number(e.target.value))
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>
                <div className="flex-1 flex items-end">
                  <label className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isRecurring === 1}
                      onChange={(e) =>
                        handleUpdateField(item.id, 'isRecurring', e.target.checked ? 1 : 0)
                      }
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    ¿Recurrente?
                  </label>
                </div>
              </div>
              <button
                onClick={() => handleSaveItem(item)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-600 text-zinc-800 dark:text-zinc-300 font-medium px-3 py-1.5 rounded-lg text-[10px] transition-colors"
              >
                <Save className="h-3 w-3" />
                Guardar
              </button>
            </div>
          ))}
        </div>

        {showNew && (
          <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-emerald-500/20 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del negocio"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-emerald-500/50"
            >
              <option value="Servicio">Servicio</option>
              <option value="Producto">Producto</option>
              <option value="Curso">Curso</option>
              <option value="Mentoría">Mentoría</option>
            </select>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Monto por venta"
                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Costo"
                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
            </div>
            <input
              type="number"
              value={newMonthlyGoal}
              onChange={(e) => setNewMonthlyGoal(e.target.value)}
              placeholder="Meta mensual ($)"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsRecurring}
                onChange={(e) => setNewIsRecurring(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              ¿Es recurrente? (ingresos mensuales/suscripciones)
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving || !newName.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 text-white font-medium px-3 py-2 rounded-lg text-xs transition-colors"
              >
                Crear
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!showNew && (
          <button
            onClick={() => setShowNew(true)}
            className="w-full flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-medium px-4 py-3 rounded-xl text-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva Unidad de Negocio
          </button>
        )}
      </div>
    </div>
  );
}
