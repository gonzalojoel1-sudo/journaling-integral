'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';

interface ChatAssistantProps {
  onClose: () => void;
}

export function ChatAssistant({ onClose }: ChatAssistantProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-violet-500/10 flex items-center justify-center">
            <MessageCircle className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Mentor Espiritual
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Comparte lo que llevas en el corazón. Estoy aqui para escucharte y guiarte.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-500 text-white rounded-br-md'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu mensaje..."
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-8 w-8 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 flex items-center justify-center text-white transition-colors shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
