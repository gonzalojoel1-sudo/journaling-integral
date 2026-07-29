'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BusinessSettings } from '@/app/negocio/BusinessSettings';
import { WithdrawButton } from '@/app/negocio/WithdrawButton';
import { CreateFirstUnitGate } from '@/components/business/CreateFirstUnitGate';
import { BusinessSettingsModal } from '@/components/business/BusinessSettingsModal';
import {
  useDashboardData,
  FILTERS,
  type FilterPeriod,
  type BusinessUnitSummary,
  type TransactionSummary,
  type DailyEntrySummary,
} from './centro-mando/useDashboardData';
import { MetricsOverview } from './centro-mando/MetricsOverview';
import { UnitPerformanceTable } from './centro-mando/UnitPerformanceTable';
import { TransactionList } from './centro-mando/TransactionList';

interface CentroMandoDashboardProps {
  transactions: TransactionSummary[];
  entries: DailyEntrySummary[];
  settingsList: BusinessUnitSummary[];
}

export function CentroMandoDashboard({
  transactions,
  entries,
  settingsList,
}: CentroMandoDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    filter,
    setFilter,
    activeLabel,
    rangeLabel,
    filteredTransactions,
    totalIncome,
    totalExpenses,
    totalSales,
    totalContacts,
    netMargin,
    pipelineConversion,
    unitPerformance,
  } = useDashboardData(transactions, entries, settingsList);

  if (settingsList.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">Panel Financiero</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">Centro de Mando</h1>
          </div>
        </header>
        <CreateFirstUnitGate />
      </div>
    );
  }

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
                onClick={() => setFilter(f.key as FilterPeriod)}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              CREAR UNIDAD DE NEGOCIO
            </button>
            <BusinessSettings initialSettings={settingsList} />
          </div>
          <WithdrawButton />
        </div>
      </header>

      <MetricsOverview
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netMargin={netMargin}
        pipelineConversion={pipelineConversion}
        totalSales={totalSales}
        totalContacts={totalContacts}
        activeLabel={activeLabel}
        filteredTransactionsCount={filteredTransactions.length}
      />

      <section>
        <UnitPerformanceTable data={unitPerformance} periodLabel={activeLabel} />
      </section>

      <section>
        <TransactionList transactions={transactions} />
      </section>

      {showCreateModal && (
        <BusinessSettingsModal
          settings={settingsList}
          onClose={() => setShowCreateModal(false)}
          initialShowNew={true}
        />
      )}
    </div>
  );
}
