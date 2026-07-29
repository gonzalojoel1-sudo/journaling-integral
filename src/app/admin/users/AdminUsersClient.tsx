'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Calendar,
  Shield,
  Trash2,
} from 'lucide-react';
import { adminDeleteUser, adminSetRole } from '@/app/actions/admin';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/constants-domain';

interface UserStats {
  totalEntries: number;
  devotionalsCompleted: number;
  businessCompleted: number;
  habitsCount: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  currentLevel: number;
  streakCurrent: number;
  streakMax: number;
  createdAt: string;
  stats: UserStats;
}

interface AdminUsersClientProps {
  users: AdminUser[];
}

export function AdminUsersClient({ users: initialUsers }: AdminUsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    await adminDeleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    router.refresh();
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === ROLE_ADMIN ? ROLE_USER : ROLE_ADMIN;
    await adminSetRole(user.id, newRole);
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
    );
    router.refresh();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {users.map((user) => {
        const isAdmin = user.role === ROLE_ADMIN;

        return (
          <div
            key={user.id}
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 space-y-4"
          >
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-800/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                      {user.name}
                    </h3>
                    {isAdmin && (
                      <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRole(user)}
                  className={`text-[10px] font-bold font-mono uppercase px-2 py-1 rounded-lg transition-colors ${
                    isAdmin
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                  title={isAdmin ? 'Quitar admin' : 'Hacer admin'}
                >
                  {user.role}
                </button>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-900/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono">
                  Lvl {user.currentLevel}
                </span>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-100 dark:border-stone-800">
                <Flame className="h-4 w-4 text-amber-500" />
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">Racha</span>
                  <strong className="text-stone-800 dark:text-stone-200">{user.streakCurrent}d (Máx: {user.streakMax}d)</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-100 dark:border-stone-800">
                <Calendar className="h-4 w-4 text-stone-400" />
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">Registro</span>
                  <strong className="text-stone-800 dark:text-stone-200">{formatDate(user.createdAt)}</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
