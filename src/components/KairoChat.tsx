'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles } from 'lucide-react';
import { getUserSettings } from '@/app/actions/user-settings';
import { logger } from '@/lib/logger';

const ChatAssistant = dynamic(
  () => import('@/components/ChatAssistant').then((mod) => mod.ChatAssistant),
  { ssr: false },
);

const chatTransport = new DefaultChatTransport({
  api: '/api/chat',
  prepareSendMessagesRequest: ({ messages, ...rest }) => ({
    ...rest,
    body: {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      })),
    },
  }),
});

export function KairoChat() {
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
    onFinish: () => {
      setChatError(null);
    },
    onError: (err) => {
      logger.error('kairo_chat_error', {}, err);
      setChatError(err.message || 'Error de conexión');
    },
  });

  useEffect(() => {
    getUserSettings().then((s) => setEnabled(s?.aiAssistantEnabled ?? true));
  }, []);

  if (!enabled) return null;

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <>
      {/* FAB — dark premium glow */}
      <button
        onClick={() => {
          setShow((prev) => !prev);
          setChatError(null);
        }}
        aria-label={show ? 'Cerrar asistente Kairo' : 'Abrir asistente Kairo'}
        aria-expanded={show}
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
          show
            ? 'bg-zinc-800 dark:bg-zinc-700 text-zinc-400 shadow-lg shadow-zinc-900/20'
            : 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_28px_rgba(139,92,246,0.5)] hover:scale-105'
        }`}
        title="Kairo"
      >
        <Sparkles className={`h-5 w-5 transition-transform duration-300 ${show ? 'rotate-90' : ''}`} aria-hidden="true" />
      </button>

      {/* Chat panel — useChat state lives here, persists across routes */}
      {show && (
        <ChatAssistant
          onClose={() => setShow(false)}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={(text) => {
            sendMessage({ text });
            setInput('');
          }}
          isLoading={isLoading}
          chatError={chatError || error?.message || null}
        />
      )}
    </>
  );
}
