'use client';

import React, { useMemo, useState } from 'react';
import { Briefcase, TrendingDown, Percent, ArrowRightLeft } from 'lucide-react';
import { MetricCard } from '@/components/business/MetricCard';
import { UnitPerformanceBreakdown } from '@/components/business/UnitPerformanceBreakdown';
import type { UnitPerformance } from '@/components/business/UnitPerformanceBreakdown';
import { TransactionLedger } from '@/components/business/TransactionLedger';
import { BusinessSettings } from '@/app/negocio/BusinessSettings';
import { WithdrawButton } from '@/app/negocio/WithdrawButton';

export type FilterPeriod = 'today' | 'week' | 'month' | 'sixMonths' | 'all';

const FILTERS: { key: FilterPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'sixMonths', label: 'Últimos 6 meses' },
  { key: 'all', label: 'Siempre' },
];

interface BusinessUnit {
  id: string;
  name: string;
  defaultSaleAmount: number;
  defaultSaleCost: number;
  isActive: number;
}

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

interface DailyEntry {
  id?: string;
  date: string;
  bizContactsCount?: number | null;
  bizIncome?: number | null;
  bizProspectCompleted?: number | null;
  bizFollowUpCompleted?: number | null;
  bizMktActionCompleted?: number | null;
}

interface CentroMandoDashboardProps {
  transactions: Transaction[];
  entries: DailyEntry[];
  settingsList: BusinessUnit[];
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function rangeStart(period: FilterPeriod, today: Date): Date {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  if (period === 'today') return start;
  if (period === 'week') start.setDate(start.getDate() - 7);
  else if (period === 'month') start.setDate(start.getDate() - 30);
  else if (period === 'sixMonths') start.setDate(start.getDate() - 183);
  return start;
}

export function CentroMandoDashboard({
  transactions,
  entries,
  settingsList,
}: CentroMandoDashboardProps) {
  const [filter, setFilter] = useState<FilterPeriod>('sixMonths');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const filterStartStr = useMemo(
    () => rangeStart(filter, today).toISOString().split('T')[0],
    [filter, today],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.date >= filterStartStr && t.date <= todayStr);
  }, [transactions, filter, filterStartStr, todayStr]);

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.date >= filterStartStr && e.date <= todayStr);
  }, [entries, filter, filterStartStr, todayStr]);

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const totalSales = useMemo(
    () => filteredTransactions.filter((t) => t.isSale === 1).length,
    [filteredTransactions],
  );

  const totalContacts = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + (e.bizContactsCount ?? 0), 0),
    [filteredEntries],
  );

  const netMargin = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 100) / 100
    : 0;

  const pipelineConversion = totalContacts > 0
    ? Math.round((totalSales / totalContacts) * 100 * 100) / 100
    : 0;

  const unitPerformance: UnitPerformance[] = useMemo(() => {
    const validSources = new Set(settingsList.map((s) => s.name));
    const buckets = new Map<string, UnitPerformance>();

    settingsList.forEach((s) => {
      buckets.set(s.name, {
        id: s.id,
        name: s.name,
        income: 0,
        expenses: 0,
        net: 0,
        margin: 0,
        count: 0,
      });
    });

    filteredTransactions.forEach((t) => {
      const sourceName = validSources.has(t.source) ? t.source : 'Sin clasificar';
      const existing = buckets.get(sourceName);
      const initial = existing ?? {
        id: sourceName,
        name: sourceName,
        income: 0,
        expenses: 0,
        net: 0,
        margin: 0,
        count: 0,
      };
      const income = initial.income + (t.type === 'ingreso' ? t.amount : 0);
      const expenses = initial.expenses + (t.type === 'gasto' ? t.amount : 0);
      buckets.set(sourceName, {
        ...initial,
        income,
        expenses,
        net: income - expenses,
        margin: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
        count: initial.count + 1,
      });
    });

    return Array.from(buckets.values()).sort((a, b) => b.net - a.net);
  }, [filteredTransactions, settingsList]);

  const activeLabel = FILTERS.find((f) => f.key === filter)?.label ?? 'Todo';
  const rangeLabel =
    filter === 'all'
      ? 'Histórico completo'
      : `${filterStartStr.split('-').reverse().join('/')} — ${todayStr.split('-').reverse().join('/')}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            Panel Financiero
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Centro de Mando
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">
            {rangeLabel} · {activeLabel}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <BusinessSettings initialSettings={settingsList} />
          <WithdrawButton />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Efectivo Cobrado"
          value={formatCurrency(totalIncome)}
          sub={`${activeLabel} · ${filteredTransactions.length} movs.`}
          accent="neutral"
          icon={<Briefcase className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Tasa de Quema"
          value={formatCurrency(totalExpenses)}
          sub="Gastos registrados"
          accent="negative"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Margen Neto"
          value={`${netMargin}%`}
          sub={netMargin > 0 ? 'Rentabilidad positiva' : 'Margen negativo'}
          accent={netMargin > 0 ? 'positive' : 'negative'}
          icon={<Percent className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Conversión Pipeline"
          value={`${pipelineConversion}%`}
          sub={`${totalSales} ventas · ${totalContacts} contactos`}
          accent={pipelineConversion > 20 ? 'positive' : 'neutral'}
          icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
        />
      </section>

      <section>
        <UnitPerformanceBreakdown data={unitPerformance} periodLabel={activeLabel} />
      </section>

      <section>
        <TransactionLedger transactions={transactions} />
      </section>
    </div>
  );
}
