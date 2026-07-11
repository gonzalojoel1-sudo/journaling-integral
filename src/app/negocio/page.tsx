import React from 'react';
import { Briefcase, TrendingDown, Percent, ArrowRightLeft } from 'lucide-react';
import { db } from '@/db/db';
import { dailyEntries, businessTransactions } from '@/db/schema';
import { getBusinessMetricsRange } from '../actions/daily-journal';
import { getBusinessSettingsList } from '../actions/business';
import { MetricCard } from '@/components/business/MetricCard';
import { WeeklyCorrelation } from '@/components/business/WeeklyCorrelation';
import { TransactionLedger } from '@/components/business/TransactionLedger';
import { BusinessSettings } from './BusinessSettings';
import { WithdrawButton } from './WithdrawButton';
import { getCurrentUserId } from '../actions/auth';
import { eq, and, gte, lte } from 'drizzle-orm';

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function NegocioPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const userId = await getCurrentUserId();

  const rangeMetrics = await getBusinessMetricsRange(thirtyDaysAgo, todayStr);
  const settingsList = await getBusinessSettingsList();

  const recentEntries = await db.query.dailyEntries.findMany({
    where: and(
      eq(dailyEntries.userId, userId),
      gte(dailyEntries.date, sevenDaysAgo),
      lte(dailyEntries.date, todayStr),
    ),
    orderBy: (entries, { asc }) => [asc(entries.date)],
  });

  const recentTxns = await db.query.businessTransactions.findMany({
    where: and(
      eq(businessTransactions.userId, userId),
      gte(businessTransactions.date, sevenDaysAgo),
      lte(businessTransactions.date, todayStr),
    ),
  });

  const correlationData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const entry = recentEntries.find((e) => e.date === date);
    const dayTxns = recentTxns.filter((t) => t.date === date);
    const cashCollected = dayTxns
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    correlationData.push({
      date,
      label: '',
      mitCompleted: entry
        ? entry.bizProspectCompleted === 1 &&
          entry.bizFollowUpCompleted === 1 &&
          entry.bizMktActionCompleted === 1
        : false,
      cashCollected,
    });
  }

  const cashCollected = rangeMetrics.success ? (rangeMetrics.totalIncome ?? 0) : 0;
  const cashBurn = rangeMetrics.success ? (rangeMetrics.totalExpenses ?? 0) : 0;
  const netMargin = rangeMetrics.success ? (rangeMetrics.netMargin ?? 0) : 0;
  const pipelineConversion = rangeMetrics.success ? (rangeMetrics.pipelineConversion ?? 0) : 0;

  const isMarginPositive = netMargin > 0;
  const formattedCash = formatCurrency(cashCollected);
  const formattedBurn = formatCurrency(cashBurn);
  const marginValue = `${netMargin}%`;
  const pipelineValue = `${pipelineConversion}%`;

  const transactions = rangeMetrics.success && rangeMetrics.transactions
    ? rangeMetrics.transactions
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            Panel Financiero
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Centro de Mando
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            {thirtyDaysAgo.split('-').reverse().join('/')} — {todayStr.split('-').reverse().join('/')}
          </span>
          <BusinessSettings initialSettings={settingsList} />
          <WithdrawButton />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Efectivo Cobrado"
          value={formattedCash}
          sub="Últimos 30 días"
          accent="neutral"
          icon={<Briefcase className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Tasa de Quema"
          value={formattedBurn}
          sub="Gastos registrados"
          accent="negative"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Margen Neto"
          value={marginValue}
          sub={isMarginPositive ? 'Rentabilidad positiva' : 'Margen negativo'}
          accent={isMarginPositive ? 'positive' : 'negative'}
          icon={<Percent className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Conversión Pipeline"
          value={pipelineValue}
          sub="Contactos → Ventas"
          accent={pipelineConversion > 20 ? 'positive' : 'neutral'}
          icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
        />
      </section>

      <section>
        <WeeklyCorrelation data={correlationData} />
      </section>

      <section>
        <TransactionLedger transactions={transactions} />
      </section>
    </div>
  );
}
