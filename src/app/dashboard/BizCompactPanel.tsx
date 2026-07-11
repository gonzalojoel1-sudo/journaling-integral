'use client';

import React, { useState, useCallback } from 'react';
import { Briefcase, Minus, Plus } from 'lucide-react';

interface BizCompactPanelProps {
  prospectDone: boolean;
  followUpDone: boolean;
  mktDone: boolean;
  prospectText: string;
  followUpText: string;
  mktText: string;
  contacts: number;
  sales: number;
  income: number;
  hasEntry: boolean;
}

export function BizCompactPanel({
  prospectDone: initialProspect,
  followUpDone: initialFollowUp,
  mktDone: initialMkt,
  prospectText: initialProspectText,
  followUpText: initialFollowUpText,
  mktText: initialMktText,
  contacts: initialContacts,
  sales: initialSales,
  income: initialIncome,
  hasEntry,
}: BizCompactPanelProps) {
  const [prospectDone, setProspectDone] = useState(initialProspect);
  const [followUpDone, setFollowUpDone] = useState(initialFollowUp);
  const [mktDone, setMktDone] = useState(initialMkt);
  const [prospectText, setProspectText] = useState(initialProspectText);
  const [followUpText, setFollowUpText] = useState(initialFollowUpText);
  const [mktText, setMktText] = useState(initialMktText);
  const [contacts, setContacts] = useState(initialContacts);
  const [sales, setSales] = useState(initialSales);
  const [income, setIncome] = useState(initialIncome);

  const handleBizUpdate = useCallback(
    (field: string, value: boolean | number | string) => {
      console.log(`[BizUpdate] ${field}:`, value);
    },
    []
  );

  const toggleAction = (action: 'prospect' | 'followUp' | 'mkt') => {
    const setters = {
      prospect: () => {
        const v = !prospectDone;
        setProspectDone(v);
        handleBizUpdate('bizProspectCompleted', v);
      },
      followUp: () => {
        const v = !followUpDone;
        setFollowUpDone(v);
        handleBizUpdate('bizFollowUpCompleted', v);
      },
      mkt: () => {
        const v = !mktDone;
        setMktDone(v);
        handleBizUpdate('bizMktActionCompleted', v);
      },
    };
    setters[action]();
  };

  const updateText = (action: 'prospect' | 'followUp' | 'mkt', value: string) => {
    const setters = {
      prospect: () => {
        setProspectText(value);
        handleBizUpdate('bizActionsSpecific_prospect', value);
      },
      followUp: () => {
        setFollowUpText(value);
        handleBizUpdate('bizActionsSpecific_followUp', value);
      },
      mkt: () => {
        setMktText(value);
        handleBizUpdate('bizActionsSpecific_mkt', value);
      },
    };
    setters[action]();
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Negocio 1-1-1
        </h3>
        {hasEntry && (
          <span className="text-[9px] font-bold font-mono text-zinc-400 uppercase">
            Hoy
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <BizHybridItem
          label="Prospecto"
          placeholder="¿A quién vas a prospectar hoy?"
          checked={prospectDone}
          text={prospectText}
          onToggle={() => toggleAction('prospect')}
          onTextChange={(v) => updateText('prospect', v)}
        />
        <BizHybridItem
          label="Seguimiento"
          placeholder="¿A quién necesitas dar seguimiento?"
          checked={followUpDone}
          text={followUpText}
          onToggle={() => toggleAction('followUp')}
          onTextChange={(v) => updateText('followUp', v)}
        />
        <BizHybridItem
          label="Acción MKT"
          placeholder="¿Qué acción de marketing harás hoy?"
          checked={mktDone}
          text={mktText}
          onToggle={() => toggleAction('mkt')}
          onTextChange={(v) => updateText('mkt', v)}
        />
      </div>

      {hasEntry && (
        <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 grid grid-cols-3 gap-3">
          <BizCounter
            label="Contactos"
            value={contacts}
            onChange={(v) => {
              setContacts(v);
              handleBizUpdate('bizContactsCount', v);
            }}
          />
          <BizCounter
            label="Ventas"
            value={sales}
            onChange={(v) => {
              setSales(v);
              handleBizUpdate('bizSalesCount', v);
            }}
          />
          <BizCounter
            label="Ingresos"
            value={income}
            prefix="$"
            onChange={(v) => {
              setIncome(v);
              handleBizUpdate('bizIncome', v);
            }}
          />
        </div>
      )}

      {!hasEntry && (
        <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-wider">
            Registra en diario para ver métricas
          </p>
        </div>
      )}
    </div>
  );
}

function BizHybridItem({
  label,
  placeholder,
  checked,
  text,
  onToggle,
  onTextChange,
}: {
  label: string;
  placeholder: string;
  checked: boolean;
  text: string;
  onToggle: () => void;
  onTextChange: (v: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors group ${
        checked ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="priority-check"
      />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className={`text-[9px] font-bold uppercase tracking-wider font-mono shrink-0 ${
            checked
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-zinc-400 dark:text-zinc-500'
          }`}
        >
          {label}
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent border-none outline-none text-xs transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600 ${
            checked
              ? 'text-zinc-400 dark:text-zinc-500 line-through'
              : 'text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100'
          }`}
        />
      </div>
    </div>
  );
}

function BizCounter({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string;
  value: number;
  prefix?: string;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = Math.max(0, parseInt(draft, 10) || 0);
    onChange(parsed);
    setDraft(String(parsed));
    setEditing(false);
  };

  const increment = () => {
    const next = value + 1;
    onChange(next);
    setDraft(String(next));
  };

  const decrement = () => {
    const next = Math.max(0, value - 1);
    onChange(next);
    setDraft(String(next));
  };

  if (editing) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-0.5">
          {prefix && (
            <span className="text-sm font-extrabold text-zinc-400">{prefix}</span>
          )}
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(String(value));
                setEditing(false);
              }
            }}
            autoFocus
            min={0}
            className="w-16 text-center text-sm font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-1 py-0.5 outline-none focus:ring-2 focus:ring-emerald-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <p className="text-[9px] font-mono text-zinc-400 uppercase mt-0.5">
          {label}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center group relative">
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
      >
        {prefix}
        {value}
      </button>
      <div className="flex items-center justify-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={decrement}
          className="h-5 w-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={increment}
          className="h-5 w-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[9px] font-mono text-zinc-400 uppercase">{label}</p>
    </div>
  );
}
