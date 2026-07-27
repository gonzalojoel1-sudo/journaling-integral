'use client';

import React from 'react';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

export interface UnitPerformance {
  id: string;
  name: string;
  income: number;
  expenses: number;
  net: number;
  margin: number;
  count: number;
}

interface UnitPerformanceBreakdownProps {
  data: UnitPerformance[];
  periodLabel: string;
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function UnitPerformanceBreakdown({ data, periodLabel }: UnitPerformanceBreakdownProps) {
  const maxNet = Math.max(...data.map((d) => Math.abs(d.net)), 1);
  const totalNet = data.reduce((sum, d) => sum + d.net, 0);
  const profitableCount = data.filter((d) => d.net > 0).length;
  const unitsWithActivity = data.filter((d) => d.count > 0).length;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            Desglose por Unidad de Negocio
          </span>
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
            {periodLabel} · {unitsWithActivity} unidades activas · {profitableCount} rentables
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">Ingreso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500/80" />
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">Gasto</span>
          </div>
        </div>
      </div>

      {unitsWithActivity === 0 ? (
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 text-center py-8">
          No hay transacciones en este periodo. Registra ventas/gastos para ver el desglose.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((unit) => {
            if (unit.count === 0) return null;
            const barWidth = Math.max(Math.abs((unit.net / maxNet) * 100), 4);
            const isPositive = unit.net > 0;
            const isZero = unit.net === 0;

            return (
              <div
                key={unit.id}
                className="flex items-center gap-3 group"
              >
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {unit.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-mono tabular-nums ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(unit.income)}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">·</span>
                      <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                        -{formatCurrency(unit.expenses)}
                      </span>
                    </div>
                  </div>

                  <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                        isZero
                          ? 'bg-zinc-300 dark:bg-zinc-700'
                          : isPositive
                            ? 'bg-emerald-500/70'
                            : 'bg-rose-500/70'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500/80" />
                      ) : isZero ? null : (
                        <TrendingDown className="h-3 w-3 text-rose-500/80" />
                      )}
                      <span
                        className={
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-rose-500 dark:text-rose-400 font-semibold'
                        }
                      >
                        {formatCurrency(unit.net)}
                      </span>
                      <span className="text-zinc-400">/ {unit.margin}% margen</span>
                    </div>
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {unit.count} {unit.count === 1 ? 'mov.' : 'movs.'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {unitsWithActivity > 1 && (
            <div className="pt-3 mt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Total neto
              </span>
              <span
                className={`text-sm font-extrabold tabular-nums ${
                  totalNet > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : totalNet < 0
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-zinc-500'
                }`}
              >
                {formatCurrency(totalNet)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
