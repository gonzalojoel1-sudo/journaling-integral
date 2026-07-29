'use client';

import React from 'react';
import { Briefcase, TrendingDown, Percent, ArrowRightLeft } from 'lucide-react';
import { MetricCard } from '@/components/business/MetricCard';
import { formatCurrency } from './useDashboardData';

interface MetricsOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  netMargin: number;
  pipelineConversion: number;
  totalSales: number;
  totalContacts: number;
  activeLabel: string;
  filteredTransactionsCount: number;
}

export function MetricsOverview({
  totalIncome,
  totalExpenses,
  netMargin,
  pipelineConversion,
  totalSales,
  totalContacts,
  activeLabel,
  filteredTransactionsCount,
}: MetricsOverviewProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Efectivo Cobrado"
        value={formatCurrency(totalIncome)}
        sub={`${activeLabel} · ${filteredTransactionsCount} movs.`}
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
  );
}
