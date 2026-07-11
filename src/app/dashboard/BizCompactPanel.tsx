'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Briefcase, Minus, Plus, PlusCircle } from 'lucide-react';
import { autoSaveBizField, registerSale } from '../actions/business';

interface BusinessUnit {
  id: string;
  name: string;
  defaultSaleAmount: number;
  defaultSaleCost: number;
  isActive: number;
}

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
  date?: string;
  businessUnits: BusinessUnit[];
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
  date,
  businessUnits,
}: BizCompactPanelProps) {
  const todayStr = date || new Date().toISOString().split('T')[0];

  const [prospectDone, setProspectDone] = useState(initialProspect);
  const [followUpDone, setFollowUpDone] = useState(initialFollowUp);
  const [mktDone, setMktDone] = useState(initialMkt);
  const [prospectText, setProspectText] = useState(initialProspectText);
  const [followUpText, setFollowUpText] = useState(initialFollowUpText);
  const [mktText, setMktText] = useState(initialMktText);
  const [contacts, setContacts] = useState(initialContacts);
  const [sales, setSales] = useState(initialSales);
  const [selectedUnit, setSelectedUnit] = useState<string>(
    businessUnits.length > 0 ? businessUnits[0].id : '',
  );
  const [registering, setRegistering] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingActionsRef = useRef<Record<string, string | number>>({});

  const debouncedSave = useCallback((field: string, value: string | number) => {
    pendingActionsRef.current[field] = value;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const actions = { ...pendingActionsRef.current };
      pendingActionsRef.current = {};
      for (const [f, v] of Object.entries(actions)) {
        await autoSaveBizField(f, v, todayStr);
      }
    }, 500);
  }, [todayStr]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const toggleAction = (action: 'prospect' | 'followUp' | 'mkt') => {
    if (action === 'prospect') {
      const v = !prospectDone;
      setProspectDone(v);
      debouncedSave('bizProspectCompleted', v ? 1 : 0);
    } else if (action === 'followUp') {
      const v = !followUpDone;
      setFollowUpDone(v);
      debouncedSave('bizFollowUpCompleted', v ? 1 : 0);
    } else {
      const v = !mktDone;
      setMktDone(v);
      debouncedSave('bizMktActionCompleted', v ? 1 : 0);
    }
  };

  const updateText = (action: 'prospect' | 'followUp' | 'mkt', value: string) => {
    if (action === 'prospect') setProspectText(value);
    else if (action === 'followUp') setFollowUpText(value);
    else setMktText(value);

    const merged: Record<string, string> = {
      prospect: action === 'prospect' ? value : prospectText,
      followUp: action === 'followUp' ? value : followUpText,
      mkt: action === 'mkt' ? value : mktText,
    };

    debouncedSave('bizActionsSpecific', JSON.stringify(merged));
  };

  const handleRegisterSale = async () => {
    if (!selectedUnit) return;
    setRegistering(true);
    const result = await registerSale(selectedUnit, todayStr);
    if (result.success) {
      setSales((s) => s + 1);
    }
    setRegistering(false);
  };

  const activeUnit = businessUnits.find((u) => u.id === selectedUnit);

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Negocio 1-1-1
        </h3>
        <span className="text-[9px] font-bold font-mono text-zinc-400 uppercase">
          {hasEntry ? 'Hoy' : 'Nuevo'}
        </span>
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

      <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <BizCounter
            label="Contactos"
            value={contacts}
            onChange={(v) => {
              setContacts(v);
              debouncedSave('bizContactsCount', v);
            }}
          />
          <ReadOnlyMetric label="Ventas" value={sales} />
          <ReadOnlyMetric label="Ingresos" value={`$${initialIncome}`} />
        </div>

        {businessUnits.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 outline-none focus:border-emerald-500/50"
            >
              {businessUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                  {unit.defaultSaleAmount > 0
                    ? ` ($${unit.defaultSaleAmount}${unit.defaultSaleCost > 0 ? ` - $${unit.defaultSaleCost}` : ''})`
                    : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleRegisterSale}
              disabled={registering || !selectedUnit}
              className="shrink-0 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {activeUnit && activeUnit.defaultSaleAmount > 0 && (
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 text-center">
            Venta: ${activeUnit.defaultSaleAmount}
            {activeUnit.defaultSaleCost > 0 && ` · Costo: $${activeUnit.defaultSaleCost}`}
          </p>
        )}
      </div>
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-extrabold text-zinc-400 dark:text-zinc-500">
        {value}
      </p>
      <p className="text-[9px] font-mono text-zinc-400 uppercase">{label}</p>
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
