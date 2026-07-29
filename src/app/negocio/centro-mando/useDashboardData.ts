'use client';

import { useMemo, useState } from 'react';
import type { UnitPerformance } from '@/components/business/UnitPerformanceBreakdown';

export type FilterPeriod = 'today' | 'week' | 'month' | 'sixMonths' | 'all';

export const FILTERS: { key: FilterPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'sixMonths', label: 'Últimos 6 meses' },
  { key: 'all', label: 'Siempre' },
];

export interface BusinessUnitSummary {
  id: string;
  name: string;
  defaultSaleAmount: number;
  defaultSaleCost: number;
  isActive: number;
  category?: string;
  isRecurring?: number;
  monthlyGoal?: number;
}

export interface TransactionSummary {
  id: string;
  amount: number;
  cost: number;
  type: string;
  description: string | null;
  source: string;
  isSale: number;
  date: string;
}

export interface DailyEntrySummary {
  id?: string;
  date: string;
  bizContactsCount?: number | null;
  bizIncome?: number | null;
  bizProspectCompleted?: number | null;
  bizFollowUpCompleted?: number | null;
  bizMktActionCompleted?: number | null;
}

export const SETTINGS_EMPTY_STATE: FilterPeriod = 'sixMonths';

export function rangeStart(period: FilterPeriod, today: Date): Date {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  if (period === 'today') return start;
  if (period === 'week') start.setDate(start.getDate() - 7);
  else if (period === 'month') start.setDate(start.getDate() - 30);
  else if (period === 'sixMonths') start.setDate(start.getDate() - 183);
  return start;
}

export interface DashboardData {
  filter: FilterPeriod;
  setFilter: (next: FilterPeriod) => void;
  todayStr: string;
  filterStartStr: string;
  activeLabel: string;
  rangeLabel: string;
  filteredTransactions: TransactionSummary[];
  filteredEntries: DailyEntrySummary[];
  totalIncome: number;
  totalExpenses: number;
  totalSales: number;
  totalContacts: number;
  netMargin: number;
  pipelineConversion: number;
  unitPerformance: UnitPerformance[];
}

export function useDashboardData(
  transactions: TransactionSummary[],
  entries: DailyEntrySummary[],
  settingsList: BusinessUnitSummary[],
  initialFilter: FilterPeriod = SETTINGS_EMPTY_STATE,
): DashboardData {
  const [filter, setFilter] = useState<FilterPeriod>(initialFilter);

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
        category: s.category,
        isRecurring: s.isRecurring,
        monthlyGoal: s.monthlyGoal,
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

  return {
    filter,
    setFilter,
    todayStr,
    filterStartStr,
    activeLabel,
    rangeLabel,
    filteredTransactions,
    filteredEntries,
    totalIncome,
    totalExpenses,
    totalSales,
    totalContacts,
    netMargin,
    pipelineConversion,
    unitPerformance,
  };
}

export function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
