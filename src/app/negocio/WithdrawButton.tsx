'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { withdrawToPersonal } from '@/app/actions/personal-finance';

export function WithdrawButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (show) {
      inputRef.current?.focus();
    }
  }, [show]);

  const handleWithdraw = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    const result = await withdrawToPersonal(value);
    if (result.success) {
      setShow(false);
      setAmount('');
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-medium px-3 py-1.5 rounded-lg text-[10px] transition-colors"
      >
        <ArrowDownToLine className="h-3 w-3" />
        Retiro
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
              Retiro a Cuenta Personal
            </span>
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$ Monto a retirar"
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-emerald-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500 font-mono">
              Crea un gasto en el negocio y un ingreso en finanzas personales
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleWithdraw}
                disabled={saving || !amount}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                Confirmar Retiro
              </button>
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
