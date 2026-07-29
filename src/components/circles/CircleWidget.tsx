'use client';

import { useEffect, useState } from 'react';
import { Users, Flame, Plus, Link as LinkIcon } from 'lucide-react';
import { createCircle, generateInvite, getCircleWidgetData, sendEncouragement } from '@/app/actions/circles';
import { safeJsonParse } from '@/lib/json';

interface MemberData {
  userId: string;
  name: string;
  streak: number;
  maxStreak: number;
  failedToday: boolean;
  lastEntryDate: string | null;
}

export function CircleWidget() {
  const [circle, setCircle] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [encouraged, setEncouraged] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
    const stored = localStorage.getItem('circle-encouraged');
    if (stored) {
      const parsed = safeJsonParse<string[]>(stored, []);
      setEncouraged(new Set(parsed));
    }
  }, []);

  async function loadData() {
    const res = await getCircleWidgetData();
    if (res.success) {
      setCircle(res.circle);
      setMembers(res.members || []);
    }
    setLoading(false);
  }

  async function handleCreate() {
    const res = await createCircle();
    if (res.success) loadData();
  }

  async function handleInvite() {
    if (!circle) return;
    const res = await generateInvite(circle.id);
    if (res.success && res.url) {
      await navigator.clipboard.writeText(res.url);
      alert('Link de invitación copiado al portapapeles.');
    }
  }

  async function handleEncourage(targetUserId: string) {
    if (encouraged.has(targetUserId)) return;
    await sendEncouragement(targetUserId);
    const next = new Set(encouraged);
    next.add(targetUserId);
    setEncouraged(next);
    localStorage.setItem('circle-encouraged', JSON.stringify([...next]));
  }

  if (loading) return <div className="animate-pulse h-24 bg-gray-800 rounded-2xl" />;

  if (!circle) {
    return (
      <button onClick={handleCreate}
        className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl p-4 border border-gray-700/50 w-full text-left transition-colors"
      >
        <Users className="w-5 h-5 text-blue-400" />
        <span className="text-sm text-gray-300">Crear mi Círculo de Confianza</span>
        <Plus className="w-4 h-4 text-gray-500 ml-auto" />
      </button>
    );
  }

  return (
    <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          {circle.name}
        </h3>
        <button onClick={handleInvite} aria-label="Invitar a mi círculo de confianza" className="text-gray-400 hover:text-white transition-colors" title="Invitar">
          <LinkIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${m.failedToday ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-gray-300 flex-1 truncate">{m.name}</span>
            <span className="text-gray-500 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {m.streak}
            </span>
            {m.failedToday && (
              <button
                onClick={() => handleEncourage(m.userId)}
                disabled={encouraged.has(m.userId)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                  encouraged.has(m.userId)
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {encouraged.has(m.userId) ? '👏 Enviado' : '👏 Ánimo'}
              </button>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-gray-500 text-xs text-center py-2">Invita a 2 personas para empezar</p>
      )}
    </div>
  );
}
