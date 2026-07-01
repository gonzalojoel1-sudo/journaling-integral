'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del Formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('Todos los campos son obligatorios para el registro.');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Ocurrió un error en el registro.');
        }

        // Login automático tras registro exitoso
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          throw new Error('Error al iniciar sesión tras el registro.');
        }

        // window.location fuerza a NextAuth a recargar las cookies de sesión de forma instantánea y limpia
        window.location.href = '/';
      } else {
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
        }

        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl border border-stone-250 dark:border-stone-850 glass-panel shadow-soft space-y-6">
        
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
            Alineación Integral
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 mt-2">
            {isRegister ? 'Crea tu Cuenta Nueva' : 'Inicia Sesión en tu Diario'}
          </h2>
          <p className="text-xs text-stone-500">
            {isRegister ? 'Únete y empieza a registrar tu camino de fe y disciplina.' : 'Ingresa tus credenciales para reanudar tu progreso diario.'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase font-mono flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nombre Completo:
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Joel Pacheco"
                className="w-full bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase font-mono flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email corporativo o personal:
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej. joel@empresa.com"
              className="w-full bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase font-mono flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Contraseña de seguridad:
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-stone-100/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-lg leading-relaxed">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-400 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isRegister ? 'Registrar y Comenzar' : 'Acceder al Tablero'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Registro/Login */}
        <div className="text-center pt-2 border-t border-stone-200 dark:border-stone-850">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            {isRegister ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta aún? Regístrate gratis'}
          </button>
        </div>

      </div>
    </div>
  );
}