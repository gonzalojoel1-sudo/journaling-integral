'use client';

import React, { useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';

interface ChatAssistantProps {
  onClose: () => void;
  messages: Array<{ id: string; role: string; content: string }>;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  chatError: string | null;
}

export function ChatAssistant({
  onClose,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  chatError,
}: ChatAssistantProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-24 right-4 md:bottom-20 md:right-6 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-10rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Kairo
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
        {messages.length === 0 && !isLoading && (
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
          <div className="flex items-center gap-2 pl-1">
            <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
            <span className="text-[10px] text-zinc-400 font-mono">Escribiendo...</span>
          </div>
        )}

        {chatError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
            <p className="text-[10px] text-red-600 dark:text-red-400">{chatError}</p>
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
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
