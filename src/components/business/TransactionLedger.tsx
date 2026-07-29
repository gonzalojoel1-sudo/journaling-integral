'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  updateBusinessTransaction,
  deleteBusinessTransaction,
  createBusinessTransaction,
} from '@/app/actions/business';
import { todayStr, addDays } from '@/lib/dates';

interface Transaction {
  id: string;
  amount: number;
  cost: number;
  type: string;
  description: string | null;
  source: string;
  isSale: number;
  date: string;
}

interface TransactionLedgerProps {
  transactions: Transaction[];
}

type FilterPeriod = 'today' | 'week' | 'month' | 'sixMonths' | 'all';

const FILTERS: { key: FilterPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'sixMonths', label: 'Últimos 6 meses' },
  { key: 'all', label: 'Siempre' },
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d}/${m}`;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function filterTransactions(transactions: Transaction[], period: FilterPeriod): Transaction[] {
  if (period === 'all') return transactions;

  const today = todayStr();

  const cutoff = (days: number) => addDays(today, -days);

  if (period === 'today') {
    return transactions.filter((t) => t.date === today);
  }
  if (period === 'week') {
    return transactions.filter((t) => t.date >= cutoff(7));
  }
  if (period === 'month') {
    return transactions.filter((t) => t.date >= cutoff(30));
  }
  if (period === 'sixMonths') {
    return transactions.filter((t) => t.date >= cutoff(183));
  }
  return transactions;
}

interface EditFormData {
  amount: number;
  cost: number;
  type: string;
  description: string;
  source: string;
  isSale: boolean;
  date: string;
}

const emptyForm: EditFormData = {
  amount: 0,
  cost: 0,
  type: 'ingreso',
  description: '',
  source: 'General',
  isSale: false,
  date: todayStr(),
};

export function TransactionLedger({ transactions }: TransactionLedgerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(transactions.length <= 20);
  const [filter, setFilter] = useState<FilterPeriod>('month');

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filter),
    [transactions, filter],
  );

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({
      amount: tx.amount,
      cost: tx.cost,
      type: tx.type,
      description: tx.description || '',
      source: tx.source,
      isSale: tx.isSale === 1,
      date: tx.date,
    });
    setShowNew(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await updateBusinessTransaction(editingId, {
      ...editForm,
      isSale: editForm.isSale,
    });
    setEditingId(null);
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    await deleteBusinessTransaction(id);
    setSaving(false);
    router.refresh();
  };

  const handleCreate = async () => {
    setSaving(true);
    await createBusinessTransaction({
      amount: editForm.amount,
      cost: editForm.cost,
      type: editForm.type,
      description: editForm.description || undefined,
      source: editForm.source,
      isSale: editForm.isSale,
      date: editForm.date,
    });
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

  const editRow = (tx: Transaction) => {
    const marginAmount = tx.type === 'ingreso' ? tx.amount - tx.cost : null;
    const marginPct =
      marginAmount !== null && tx.amount > 0
        ? Math.round((marginAmount / tx.amount) * 100)
        : null;

    return (
      <tr key={tx.id} className="border-b border-zinc-100 dark:border-white/[0.03]">
        <td className="py-2.5 text-xs text-zinc-500 font-mono pr-4">
          <input
            type="date"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none w-28"
          />
        </td>
        <td className="py-2.5 pr-4">
          <input
            type="text"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Descripción"
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-300 outline-none w-full"
          />
        </td>
        <td className="py-2.5 pr-4">
          <input
            type="text"
            value={editForm.source}
            onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none w-20 font-mono"
          />
        </td>
        <td className="py-2.5 pr-4">
          <select
            value={editForm.type}
            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none font-mono uppercase"
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </td>
        <td className="py-2.5 pr-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-200 outline-none w-20 text-right font-mono"
            />
            <label className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
              <input
                type="checkbox"
                checked={editForm.isSale}
                onChange={(e) => setEditForm({ ...editForm, isSale: e.target.checked })}
                className="rounded"
              />
              Venta
            </label>
          </div>
        </td>
        <td className="py-2.5 pl-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600/40 flex items-center justify-center text-emerald-400 transition-colors"
            >
              <Save className="h-3 w-3" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
      <div
        className="flex items-center justify-between mb-4 cursor-pointer select-none"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            Ledger de Transacciones
          </span>
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            ({filteredTransactions.length} de {transactions.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isExpanded && (
            <>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilter(f.key);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-colors ${
                      filter === f.key
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openNew();
                }}
                className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-medium px-3 py-1.5 rounded-lg text-[10px] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Nueva
              </button>
            </>
          )}
          <button
            type="button"
            aria-label={isExpanded ? 'Colapsar ledger' : 'Expandir ledger'}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((v) => !v);
            }}
            className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {!isExpanded && (
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 text-center py-3">
          Click para expandir · {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transacción' : 'transacciones'} visibles con el filtro &quot;{FILTERS.find((f) => f.key === filter)?.label}&quot;
        </p>
      )}

      {isExpanded && (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/5">
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-4">
                Fecha
              </th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-4">
                Descripción
              </th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-4">
                Unidad
              </th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono pr-4">
                Tipo
              </th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono text-right pr-4">
                Monto
              </th>
              <th className="pb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono w-16" />
            </tr>
          </thead>
          <tbody>
            {showNew && editingId === null && (
              <tr className="border-b border-emerald-500/10 bg-emerald-50 dark:bg-emerald-500/[0.02]">
                <td className="py-2.5 pr-4">
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none w-28"
                  />
                </td>
                <td className="py-2.5 pr-4">
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Descripción"
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-300 outline-none w-full"
                  />
                </td>
                <td className="py-2.5 pr-4">
                  <input
                    type="text"
                    value={editForm.source}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    placeholder="General"
                    className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none w-20 font-mono"
                  />
                </td>
                <td className="py-2.5 pr-4">
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[10px] text-zinc-800 dark:text-zinc-300 outline-none font-mono uppercase"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </td>
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-200 outline-none w-20 text-right font-mono"
                    />
                    <label className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                      <input
                        type="checkbox"
                        checked={editForm.isSale}
                        onChange={(e) => setEditForm({ ...editForm, isSale: e.target.checked })}
                        className="rounded"
                      />
                      Venta
                    </label>
                  </div>
                </td>
                <td className="py-2.5 pl-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCreate}
                      disabled={saving}
                      className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600/40 flex items-center justify-center text-emerald-400 transition-colors"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setShowNew(false)}
              className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {filteredTransactions.map((tx) => {
              if (editingId === tx.id) return editRow(tx);

              const marginAmount = tx.type === 'ingreso' ? tx.amount - tx.cost : null;
              const marginPct =
                marginAmount !== null && tx.amount > 0
                  ? Math.round((marginAmount / tx.amount) * 100)
                  : null;

              return (
                <tr
                  key={tx.id}
                  className="border-b border-zinc-100 dark:border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="py-2.5 text-xs text-zinc-500 font-mono pr-4">
                    {formatDate(tx.date)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-800 dark:text-zinc-300">
                        {tx.description || '—'}
                      </span>
                      {marginPct !== null && tx.cost > 0 && (
                        <span className="text-[9px] font-mono text-zinc-500 mt-0.5">
                          Margen: {marginPct}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md">
                      {tx.source}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`text-[10px] font-semibold font-mono uppercase ${
                        tx.type === 'ingreso'
                          ? 'text-emerald-500/80'
                          : 'text-rose-500/80'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-right pr-4">
                    <span
                      className={`text-xs font-semibold font-mono ${
                        tx.type === 'ingreso'
                          ? 'text-zinc-900 dark:text-zinc-200'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'ingreso' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                    {tx.isSale === 1 && (
                      <span className="ml-1.5 text-[9px] font-mono text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Venta
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {isExpanded && filteredTransactions.length === 0 && (
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 text-center py-6">
          No hay transacciones en este periodo
        </p>
      )}
    </div>
  );
}
