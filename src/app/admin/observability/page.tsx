import React from 'react';
import { redirect } from 'next/navigation';
import { getSystemTelemetry, TelemetryData } from '../../actions/admin';
import { logger } from '@/lib/logger';
import { getUserRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ObservabilityPage() {
  const role = await getUserRole();

  if (role !== 'admin') {
    redirect('/');
  }

  let telemetry: TelemetryData;
  try {
    telemetry = await getSystemTelemetry();
  } catch (error) {
    logger.error('observability_load_failed', {}, error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Error de Observabilidad</h1>
        <p className="mt-2 text-zinc-600">No se pudo cargar la telemetría del sistema.</p>
      </div>
    );
  }

  const ragCoverage =
    telemetry.totalEntries > 0
      ? ((telemetry.totalEmbeddings / telemetry.totalEntries) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Observabilidad del Sistema
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Telemetría del motor RAG y métricas de base de datos
        </p>
      </header>

      {/* ── Métricas Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Usuarios"
          value={telemetry.totalUsers}
          icon="👤"
        />
        <MetricCard
          title="Cobertura RAG"
          value={`${ragCoverage}%`}
          icon="📊"
          subtitle={`${telemetry.totalEmbeddings} / ${telemetry.totalEntries}`}
        />
        <MetricCard
          title="Vectores Activos"
          value={telemetry.totalEmbeddings}
          icon="🧬"
        />
      </div>

      {/* ── Tabla de Auditoría Semántica ── */}
      <section className="bg-[var(--surface-card)] rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Auditoría Semántica
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Últimos 10 embeddings generados por el sistema RAG
          </p>
        </div>

        {telemetry.recentEmbeddings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              No hay embeddings registrados aún. Las entradas del diario se indexarán automáticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800">
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">
                    Fecha
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">
                    ID Entrada
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">
                    Fragmento de Texto
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-[var(--text-secondary)]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {telemetry.recentEmbeddings.map((emb) => (
                  <tr
                    key={emb.id}
                    className="border-b border-stone-100 dark:border-stone-850 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
                  >
                    <td className="px-6 py-3 text-[var(--text-primary)] whitespace-nowrap">
                      {new Date(emb.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-[var(--text-secondary)] max-w-[120px] truncate">
                      {emb.entryId}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-primary)] max-w-[400px] truncate">
                      {emb.content.length > 80
                        ? emb.content.slice(0, 80) + '…'
                        : emb.content}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Indexado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Metric Card Component ──

function MetricCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-stone-200 dark:border-stone-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {title}
          </p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <span className="text-3xl opacity-60">{icon}</span>
      </div>
    </div>
  );
}