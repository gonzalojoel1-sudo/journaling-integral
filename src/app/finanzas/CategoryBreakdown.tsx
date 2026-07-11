'use client';

import React from 'react';

interface CategoryBreakdownProps {
  data: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Supermercado: 'bg-amber-500/70',
  Servicios: 'bg-sky-500/70',
  Inversiones: 'bg-emerald-500/70',
  Ocio: 'bg-violet-500/70',
  Transporte: 'bg-rose-500/70',
  Salud: 'bg-teal-500/70',
  Educación: 'bg-indigo-500/70',
  'Retiro Negocio': 'bg-zinc-400/70',
  Otros: 'bg-zinc-600/70',
};

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          Gastos por Categoría
        </span>
        <p className="text-xs text-zinc-600 mt-4 text-center">Sin datos aún</p>
      </div>
    );
  }

  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-4">
        Gastos por Categoría
      </span>

      <div className="space-y-2.5">
        {entries.map(([cat, amount]) => {
          const pct = Math.round((amount / total) * 100);
          return (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-400 w-24 shrink-0 truncate">
                {cat}
              </span>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${CATEGORY_COLORS[cat] || 'bg-zinc-500/70'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 w-16 text-right shrink-0">
                {formatCurrency(amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
