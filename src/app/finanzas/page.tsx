import React from 'react';
import { Wallet, TrendingDown, PiggyBank } from 'lucide-react';
import { getPersonalMetricsRange } from '../actions/personal-finance';
import { MetricCard } from '@/components/business/MetricCard';
import { PersonalLedger } from '@/components/personal/PersonalLedger';
import { DonutChart } from '@/components/personal/DonutChart';

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const INCOME_COLORS = ['#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#10b981', '#047857'];
const EXPENSE_COLORS = ['#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#9f1239'];

export default async function FinanzasPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const metrics = await getPersonalMetricsRange(thirtyDaysAgo, todayStr);

  const liquidity = metrics.success ? (metrics.liquidity ?? 0) : 0;
  const expenses = metrics.success ? (metrics.totalExpenses ?? 0) : 0;
  const savingsRate = metrics.success ? (metrics.savingsRate ?? 0) : 0;
  const transactions = metrics.success ? (metrics.transactions ?? []) : [];
  const totalIncome = metrics.success ? (metrics.totalIncome ?? 0) : 0;

  const incomeBreakdown = transactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const expenseBreakdown = transactions
    .filter((t) => t.type === 'gasto')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const categories = Object.keys(expenseBreakdown);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            Finanzas Personales
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Mi Capital
          </h1>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
          {thirtyDaysAgo.split('-').reverse().join('/')} — {todayStr.split('-').reverse().join('/')}
        </span>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Liquidez Total"
          value={formatCurrency(liquidity)}
          sub="Saldo disponible"
          accent={liquidity >= 0 ? 'positive' : 'negative'}
          icon={<Wallet className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Tasa de Quema"
          value={formatCurrency(expenses)}
          sub="Gastos 30 días"
          accent="negative"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Tasa de Ahorro"
          value={`${savingsRate}%`}
          sub="Ingresos - Gastos"
          accent={savingsRate > 20 ? 'positive' : 'neutral'}
          icon={<PiggyBank className="h-3.5 w-3.5" />}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChart
          data={incomeBreakdown}
          title="Ingresos por Categoría"
          colorScale={INCOME_COLORS}
        />
        <DonutChart
          data={expenseBreakdown}
          title="Gastos por Categoría"
          colorScale={EXPENSE_COLORS}
        />
      </section>

      <section>
        <PersonalLedger transactions={transactions} categories={categories} />
      </section>
    </div>
  );
}
