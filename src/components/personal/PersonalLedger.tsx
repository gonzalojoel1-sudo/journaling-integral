'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createPersonalTransaction,
  updatePersonalTransaction,
  deletePersonalTransaction,
} from '@/app/actions/personal-finance';
import { todayStr } from '@/lib/dates';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  account: string;
  description: string | null;
  date: string;
}

interface PersonalLedgerProps {
  transactions: Transaction[];
  categories: string[];
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d}/${m}`;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface EditFormData {
  amount: number;
  type: string;
  category: string;
  account: string;
  description: string;
  date: string;
}

const emptyForm: EditFormData = {
  amount: 0,
  type: 'gasto',
  category: 'Supermercado',
  account: 'Efectivo',
  description: '',
  date: todayStr(),
};

const ACCOUNTS = ['Banco', 'Efectivo', 'Billetera Virtual'];

const INCOME_CATEGORIES = ['Sueldo', 'Retiro del Negocio', 'Rendimientos', 'Otros'];
const EXPENSE_CATEGORIES = [
  'Diezmo', 'Ahorro', 'Fondo de Emergencia', 'Gastos en mí',
  'Vivienda', 'Supermercado', 'Servicios', 'Ocio',
];

function getCategories(type: string): string[] {
  return type === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function PersonalLedger({ transactions }: PersonalLedgerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      account: tx.account,
      description: tx.description || '',
      date: tx.date,
    });
    setShowNew(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await updatePersonalTransaction(editingId, editForm);
    setEditingId(null);
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    await deletePersonalTransaction(id);
    setSaving(false);
    router.refresh();
  };

  const handleCreate = async () => {
    setSaving(true);
    await createPersonalTransaction(editForm);
    setShowNew(false);
    setEditForm(emptyForm);
    setSaving(false);
    router.refresh();
  };

  const openNew = () => {
    setShowNew(true);
    setEditingId(null);
    setEditForm({ ...emptyForm, date: todayStr() });
  };

  const renderEditRow = (isNew: boolean) => (
    <tr className={isNew ? 'border-b border-emerald-500/10 bg-emerald-50 dark:bg-emerald-500/[0.02]' : 'border-b border-zinc-100 dark:border-white/[0.03]'}>
      <td className="py-2.5 pr-2">
        <input type="date" value={editForm.date}
          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-1 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none w-24" />
      </td>
      <td className="py-2.5 pr-2">
        <input type="text" value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          placeholder="Descripción"
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-300 outline-none w-full" />
      </td>
      <td className="py-2.5 pr-2">
        <select value={editForm.category}
          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-1 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none font-mono">
          {getCategories(editForm.type).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="py-2.5 pr-2">
        <select value={editForm.account}
          onChange={(e) => setEditForm({ ...editForm, account: e.target.value })}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-1 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none font-mono">
          {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </td>
      <td className="py-2.5 pr-2">
        <select value={editForm.type}
          onChange={(e) => {
            const newType = e.target.value;
            const cats = getCategories(newType);
            setEditForm({ ...editForm, type: newType, category: cats[0] });
          }}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-1 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none font-mono uppercase">
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
        </select>
      </td>
      <td className="py-2.5 pr-2">
        <input type="number" value={editForm.amount}
          onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-200 outline-none w-20 text-right font-mono" />
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={isNew ? handleCreate : handleSaveEdit} disabled={saving}
            aria-label={isNew ? 'Guardar nuevo registro' : 'Guardar cambios'}
            className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600/40 flex items-center justify-center text-emerald-400 transition-colors">
            <Save className="h-3 w-3" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => { setEditingId(null); setShowNew(false); }}
            aria-label="Cancelar edición"
            className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors">
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          Ledger Personal
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{transactions.length} registros</span>
          <button onClick={openNew}
            className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-medium px-3 py-1.5 rounded-lg text-[10px] transition-colors">
            <Plus className="h-3 w-3" /> Nueva
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/5">
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-2">Fecha</th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-2">Descripción</th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-2">Categoría</th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-2">Cuenta</th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-2">Tipo</th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono text-right pr-2">Monto</th>
              <th className="pb-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {showNew && editingId === null && renderEditRow(true)}

            {transactions.map((tx) => {
              if (editingId === tx.id) return renderEditRow(false);

              return (
                <tr key={tx.id} className="border-b border-zinc-100 dark:border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                  <td className="py-2.5 text-xs text-zinc-500 font-mono pr-2">{formatDate(tx.date)}</td>
                  <td className="py-2.5 pr-2">
                    <span className="text-xs text-zinc-800 dark:text-zinc-300">{tx.description || '—'}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md">{tx.category}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{tx.account}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className={`text-[10px] font-semibold font-mono uppercase ${tx.type === 'ingreso' ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-right pr-2">
                    <span className={`text-xs font-semibold font-mono ${tx.type === 'ingreso' ? 'text-zinc-900 dark:text-zinc-200' : 'text-rose-400'}`}>
                      {tx.type === 'ingreso' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => handleEdit(tx)}
                        aria-label={`Editar transacción ${tx.description ?? tx.id}`}
                        className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDelete(tx.id)}
                        aria-label={`Eliminar transacción ${tx.description ?? tx.id}`}
                        className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
