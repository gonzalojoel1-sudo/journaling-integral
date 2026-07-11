import React from 'react';
import { Wallet } from 'lucide-react';
import { getPersonalMetricsRange } from '@/app/actions/personal-finance';

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function PersonalFinanceWidget() {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonth = `${todayStr.slice(0, 7)}-01`;

  const metrics = await getPersonalMetricsRange(firstOfMonth, todayStr);

  const liquidity = metrics.success ? (metrics.liquidity ?? 0) : 0;
  const monthlyExpenses = metrics.success ? (metrics.totalExpenses ?? 0) : 0;
  const breakdown = metrics.success ? (metrics.categoryBreakdown ?? {}) : {};

  const topExpenses = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-sky-500" />
          Capital Personal
        </h3>
        <span className="text-[9px] font-bold font-mono text-zinc-400 uppercase">
          Este mes
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Liquidez
            </span>
            <p className={`text-xl font-semibold tracking-tight mt-0.5 ${
              liquidity >= 0 ? 'text-zinc-800 dark:text-zinc-200' : 'text-rose-500'
            }`}>
              {formatCurrency(liquidity)}
            </p>
          </div>

          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Gastos del mes
            </span>
            <p className="text-sm font-semibold text-rose-400/80 mt-0.5">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>
        </div>

        {topExpenses.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1.5">
            {topExpenses.map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
                  {cat}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-400">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
