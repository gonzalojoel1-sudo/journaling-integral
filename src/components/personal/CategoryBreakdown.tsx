'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryBreakdownProps {
  data: Record<string, number>;
}

const COLORS = [
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl">
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">{name}</span>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const entries = Object.entries(data)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          Gastos por Categoría
        </span>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4 text-center">Sin datos aún</p>
      </div>
    );
  }

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-2">
        Gastos por Categoría
      </span>

      <div className="flex items-center gap-6">
        <div className="w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5">
          {entries.slice(0, 6).map(([cat, amount]) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                {cat}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                ${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
