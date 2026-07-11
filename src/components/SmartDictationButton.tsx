'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface DailyHabit {
  habitId: string;
  name: string;
  type: string;
  completed: boolean;
}

interface ExtractedJournalData {
  energy?: {
    sleepRating?: number | null;
    energyRating?: number | null;
    focusRating?: number | null;
    stressRating?: number | null;
    quickEnergyAction?: string | null;
  } | null;
  gratitude?: {
    items?: string[] | null;
    wisdomRequest?: string | null;
  } | null;
  identity?: {
    chooseToBe?: string | null;
    action?: string | null;
    microAchievement?: string | null;
  } | null;
  devotional?: {
    notes?: string | null;
  } | null;
  habits?: {
    completedNames?: string[];
  } | null;
  mit?: {
    ser?: string | null;
    serCompleted?: boolean | null;
    negocio?: string | null;
    negocioCompleted?: boolean | null;
    relaciones?: string | null;
    relacionesCompleted?: boolean | null;
  } | null;
  closure?: {
    whatWorked?: string | null;
    whatDidNotWork?: string | null;
    improvementIdea?: string | null;
    prepTomorrow?: string[] | null;
  } | null;
}

interface SmartDictationButtonProps {
  dailyHabits: DailyHabit[];
  onDataExtracted: (data: ExtractedJournalData) => void;
}

interface MySpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface MySpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface MySpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: MySpeechRecognitionEvent) => void) | null;
  onerror: ((event: MySpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface MySpeechRecognitionConstructor {
  new (): MySpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: MySpeechRecognitionConstructor;
    webkitSpeechRecognition?: MySpeechRecognitionConstructor;
  }
}

function fuzzyMatchHabit(habitName: string, completedNames: string[]): boolean {
  const lower = habitName.toLowerCase();
  return completedNames.some((name) => {
    const lowerName = name.toLowerCase();
    return lower.includes(lowerName) || lowerName.includes(lower);
  });
}

export function SmartDictationButton({ dailyHabits, onDataExtracted }: SmartDictationButtonProps) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const recognitionRef = useRef<MySpeechRecognition | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const supported = mounted ? !!SpeechRecognitionAPI : false;

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not available in this browser');
      return;
    }

    setError(null);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    let finalTranscript = '';

    recognition.onresult = (event: MySpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      void interim;
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as MySpeechRecognitionErrorEvent;
      if (errorEvent.error !== 'no-speech') {
        setError('Error de micrófono');
      }
      setListening(false);
    };

    recognition.onend = async () => {
      setListening(false);
      if (finalTranscript.trim()) {
        await sendToGemini(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [SpeechRecognitionAPI]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const sendToGemini = async (transcript: string) => {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/smart-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        let errorBody = null;
        try {
          errorBody = await res.json();
        } catch {}
        console.error('[DICTATION] API response not ok:', res.status, errorBody);
        throw new Error(errorBody?.error || `API error (${res.status})`);
      }

      const json = await res.json();

      if (!json.success) {
        console.error('[DICTATION] Gemini processing error:', json.error, json);
        throw new Error(json.error || 'Unknown error');
      }

      const rawData = json.data;

      if (rawData.habits?.completedNames?.length) {
        rawData.habits.completedNames = rawData.habits.completedNames.map(
          (name: string, i: number) => {
            if (i === 0 && dailyHabits.length === 1) {
              return dailyHabits[0].name;
            }
            return name;
          }
        );
      }

      onDataExtracted(rawData);
    } catch (err) {
      console.error('Smart dictation error:', err);
      setError('Error al procesar');
    } finally {
      setProcessing(false);
    }
  };

  const handleClick = () => {
    if (processing) return;
    if (!supported) {
      setError('Navegador no compatible');
      setTimeout(() => setError(null), 2000);
      return;
    }
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative inline-flex z-10">
      <button
        type="button"
        onClick={handleClick}
        disabled={processing || !supported}
        className={`
          relative h-9 w-9 rounded-xl flex items-center justify-center
          transition-all duration-300
          border
          ${!supported || !mounted
            ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed'
            : listening
              ? 'border-zinc-300 dark:border-zinc-500 bg-zinc-200/60 dark:bg-zinc-800/40 shadow-[0_0_12px_rgba(161,161,170,0.5)] dark:shadow-[0_0_12px_rgba(212,212,216,0.3)] cursor-pointer'
              : processing
                ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 cursor-pointer'
                : 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer'
          }
          ${error ? 'border-red-300 dark:border-red-800' : ''}
        `}
        title={!mounted ? 'Iniciar dictado por voz' : !supported ? 'Dictado no disponible' : listening ? 'Detener grabación' : 'Iniciar dictado por voz'}
      >
        {processing ? (
          <Loader2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400 animate-spin" />
        ) : listening ? (
          <MicOff className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
        ) : (
          <Mic className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
        )}

        {listening && (
          <span className="absolute inset-0 rounded-xl animate-pulse bg-zinc-300/20 dark:bg-zinc-400/10" />
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[9px] font-mono text-red-500 dark:text-red-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
