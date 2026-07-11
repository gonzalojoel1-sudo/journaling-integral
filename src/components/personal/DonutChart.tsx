'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: Record<string, number>;
  title: string;
  colorScale: string[];
}

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

export function DonutChart({ data, title, colorScale }: DonutChartProps) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          {title}
        </span>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-3">Sin datos</p>
      </div>
    );
  }

  const chartData = entries.map(([name, value]) => ({ name, value }));
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-2">
        {title}
      </span>

      <div className="flex items-center gap-4">
        <div className="w-36 h-36 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorScale[index % colorScale.length]}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">
              ${total.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {entries.slice(0, 6).map(([cat, amount], i) => (
            <div key={cat} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: colorScale[i % colorScale.length] }}
              />
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">
                {cat}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                ${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
