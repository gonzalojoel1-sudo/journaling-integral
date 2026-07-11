'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';

const ChatAssistant = dynamic(
  () => import('@/components/ChatAssistant').then((mod) => mod.ChatAssistant),
  { ssr: false },
);

interface ChatTriggerProps {
  enabled: boolean;
}

export function ChatTrigger({ enabled }: ChatTriggerProps) {
  const [show, setShow] = useState(false);

  if (!enabled) return null;

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all z-40 ${
          show
            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
            : 'bg-violet-500 hover:bg-violet-600 text-white shadow-violet-500/25'
        }`}
        title="Mentor Espiritual"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {show && <ChatAssistant onClose={() => setShow(false)} />}
    </>
  );
}
