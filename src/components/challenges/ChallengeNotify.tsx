'use client';

import { useEffect, useState } from 'react';
import { X, Award } from 'lucide-react';

interface ChallengeNotifyProps {
  badgeUnlocked: string | null;
  badgeName?: string;
}

export function ChallengeNotify({ badgeUnlocked, badgeName }: ChallengeNotifyProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badgeUnlocked) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [badgeUnlocked]);

  if (!visible || !badgeUnlocked) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white px-5 py-4 rounded-xl shadow-2xl border border-yellow-400/30 max-w-xs">
        <div className="flex items-start gap-3">
          <Award className="w-8 h-8 text-yellow-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">🎉 Nuevo logro desbloqueado</p>
            <p className="text-yellow-200 text-xs mt-1">{badgeName || badgeUnlocked}</p>
          </div>
          <button onClick={() => setVisible(false)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
