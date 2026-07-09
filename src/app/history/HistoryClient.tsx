'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  Printer, 
  Activity, 
  Heart, 
  BookOpen, 
  Award,
  X 
} from 'lucide-react';

interface DailyEntry {
  id: string;
  date: string;
  time: string;
  levelAtEntry: number;
  sleepRating: number | null;
  energyRating: number | null;
  focusRating: number | null;
  stressRating: number | null;
  gratitude1: string | null;
  gratitude2: string | null;
  gratitude3: string | null;
  chooseToBeIdentity: string | null;
  identityAction: string | null;
  devotionalNotes: string | null;
  dailyMicroAchievement: string | null;
}

interface HistoryClientProps {
  initialEntries: DailyEntry[];
}

export function HistoryClient({ initialEntries }: HistoryClientProps) {
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  const handlePrintDevotional = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* --- LÍNEA DE TIEMPO LATERAL (Oculta en Impresión) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        
        {/* Feed de línea de tiempo */}
        <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {initialEntries.length > 0 ? (
            initialEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className={`w-full text-left p-4 rounded-2xl border transition-all-fresco glass-panel shadow-soft flex items-center justify-between cursor-pointer ${
                  selectedEntry?.id === entry.id
                    ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-50/10'
                    : 'border-stone-200 dark:border-stone-850 hover:border-stone-300 dark:hover:border-stone-800'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    <span className="text-xs font-bold font-mono text-stone-500">
                      {entry.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold truncate text-stone-800 dark:text-stone-200">
                    Elegí ser: {entry.chooseToBeIdentity || 'PRESENTE'}
                  </h4>
                  {entry.devotionalNotes && (
                    <p className="text-[11px] text-stone-400 truncate max-w-[200px]">
                      {entry.devotionalNotes}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-stone-400 shrink-0 ml-2" />
              </button>
            ))
          ) : (
            <p className="text-sm text-stone-500 text-center py-10 italic">Aún no tienes registros en tu bitácora de diario.</p>
          )}
        </div>

        {/* Detalle ampliado del día seleccionado */}
        <div className="lg:col-span-2">
          {selectedEntry ? (
            <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-850 glass-panel shadow-soft space-y-6">
              <div className="flex justify-between items-start gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    Detalle del Registro
                  </span>
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mt-1">
                    {formatDate(selectedEntry.date)}
                  </h3>
                </div>
                {selectedEntry.devotionalNotes && (
                  <button
                    type="button"
                    onClick={handlePrintDevotional}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" /> Exportar PDF
                  </button>
                )}
              </div>

              {/* Bloque: Devocional */}
              {selectedEntry.devotionalNotes ? (
                <div className="bg-stone-50 dark:bg-stone-950/40 p-5 rounded-2xl border border-stone-150 dark:border-stone-850/60 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Notas Devocionales de este día
                  </h4>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap font-serif">
                    {selectedEntry.devotionalNotes}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">No se registraron notas de devocional en este día.</p>
              )}

              {/* Bloque: Gratitud */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-150 dark:border-stone-850/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-500" /> Agradecimientos a Dios:
                  </h4>
                  <ul className="text-xs space-y-1.5 text-stone-700 dark:text-stone-300 list-disc pl-4">
                    {selectedEntry.gratitude1 && <li>{selectedEntry.gratitude1}</li>}
                    {selectedEntry.gratitude2 && <li>{selectedEntry.gratitude2}</li>}
                    {selectedEntry.gratitude3 && <li>{selectedEntry.gratitude3}</li>}
                  </ul>
                </div>

                <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-150 dark:border-stone-850/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" /> Energías Promediadas:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>Sueño: <span className="font-bold text-emerald-600">{selectedEntry.sleepRating || '—'}/10</span></div>
                    <div>Energía: <span className="font-bold text-emerald-600">{selectedEntry.energyRating || '—'}/10</span></div>
                    <div>Enfoque: <span className="font-bold text-emerald-600">{selectedEntry.focusRating || '—'}/10</span></div>
                    <div>Estrés: <span className="font-bold text-amber-500">{selectedEntry.stressRating || '—'}/10</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center text-xs text-stone-400 italic">
              Selecciona un día de la bitácora lateral para consultar los registros.
            </div>
          )}
        </div>
      </div>

      {/* --- ======================================================= --- */}
      {/* --- PLANTILLA DE IMPRESIÓN EXCLUSIVA DEL DEVOCIONAL (PDF)   --- */}
      {/* --- SÓLO VISIBLE DURANTE window.print()                     --- */}
      {/* --- ======================================================= --- */}
      {selectedEntry && selectedEntry.devotionalNotes && (
        <div className="hidden print:block text-stone-900 bg-white p-12 max-w-2xl mx-auto space-y-6 font-serif">
          <div className="border-b-2 border-stone-900 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight uppercase font-sans">Bitácora Devocional Personal</h1>
            <p className="text-xs font-mono text-stone-500 mt-1">Sosteniendo el Legado de Fe</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-sans block">Fecha del registro:</span>
            <h2 className="text-md font-bold text-stone-850 font-sans">{formatDate(selectedEntry.date)}</h2>
          </div>

          <div className="pt-4 border-t border-stone-200 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-sans block">Reflexiones y Anotaciones del Día:</span>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-800 font-serif">
              {selectedEntry.devotionalNotes}
            </p>
          </div>

          {selectedEntry.gratitude1 && (
            <div className="pt-6 border-t border-stone-100 space-y-3 font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Hoy agradezco por:</span>
              <ul className="text-xs text-stone-700 space-y-1.5 list-disc pl-5 italic">
                {selectedEntry.gratitude1 && <li>{selectedEntry.gratitude1}</li>}
                {selectedEntry.gratitude2 && <li>{selectedEntry.gratitude2}</li>}
                {selectedEntry.gratitude3 && <li>{selectedEntry.gratitude3}</li>}
              </ul>
            </div>
          )}

          <div className="border-t border-stone-300 pt-8 text-center text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest">
            — Yo soy la luz del mundo - Juan 8:12 —
          </div>
        </div>
      )}

    </div>
  );
}