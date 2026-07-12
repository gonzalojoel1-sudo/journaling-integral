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

function getSpeechAPI(): MySpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function SmartDictationButton({ dailyHabits, onDataExtracted }: SmartDictationButtonProps) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const recognitionRef = useRef<MySpeechRecognition | null>(null);
  const SpeechAPI = useRef<MySpeechRecognitionConstructor | null>(null);

  useEffect(() => {
    setMounted(true);
    SpeechAPI.current = getSpeechAPI();
    console.log('Dictado: Inicializando...', {
      supported: !!SpeechAPI.current,
      hasWindow: typeof window !== 'undefined',
      SpeechRecognition: !!window.SpeechRecognition,
      webkitSpeechRecognition: !!window.webkitSpeechRecognition,
    });
  }, []);

  const sendToSmartEntry = useCallback(async (transcript: string) => {
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
        console.error('[DICTATION] API error:', res.status, errorBody);
        throw new Error(errorBody?.error || `API error (${res.status})`);
      }

      const json = await res.json();
      if (!json.success) {
        console.error('[DICTATION] Processing error:', json);
        throw new Error(json.error || 'Unknown error');
      }

      const rawData = json.data as ExtractedJournalData;
      if (rawData.habits?.completedNames?.length) {
        rawData.habits.completedNames = rawData.habits.completedNames.map(
          (name: string, i: number) => {
            if (i === 0 && dailyHabits.length === 1) return dailyHabits[0].name;
            return name;
          },
        );
      }

      onDataExtracted(rawData);
    } catch (err) {
      console.error('[DICTATION] Error:', err);
      setError('Error al procesar');
    } finally {
      setProcessing(false);
    }
  }, [dailyHabits, onDataExtracted]);

  const startListening = useCallback(() => {
    const api = SpeechAPI.current;
    if (!api) {
      console.error('Dictado ERROR: SpeechRecognition API not available');
      setError('Navegador no compatible');
      return;
    }

    setError(null);
    console.log('Dictado: Iniciando grabación...');

    const recognition = new api();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    let finalTranscript = '';

    recognition.onresult = (event: MySpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        }
      }
    };

    recognition.onerror = (event: Event) => {
      const err = event as MySpeechRecognitionErrorEvent;
      console.error('Dictado ERROR:', err.error, err.message || '');

      switch (err.error) {
        case 'not-allowed':
          setError('Permite el acceso al micrófono en tu navegador');
          break;
        case 'audio-capture':
          setError('No se encontró micrófono');
          break;
        case 'network':
          setError('Error de red en el reconocimiento');
          break;
        case 'no-speech':
          break;
        case 'aborted':
          break;
        default:
          setError('Error de micrófono');
      }

      setListening(false);
    };

    recognition.onend = async () => {
      console.log('Dictado: Grabación finalizada. Transcripción:', finalTranscript || '(vacía)');
      setListening(false);
      if (finalTranscript.trim()) {
        await sendToSmartEntry(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
      console.log('Dictado: Grabación activa');
    } catch (err: any) {
      console.error('Dictado ERROR al iniciar:', err?.message || err);
      setError('Error al iniciar grabación');
    }
  }, [sendToSmartEntry]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const handleClick = () => {
    if (processing) return;
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!mounted) {
    return (
      <div className="relative inline-flex">
        <div className="h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  const supported = !!SpeechAPI.current;

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
          ${!supported
            ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed'
            : listening
              ? 'border-zinc-300 dark:border-zinc-500 bg-zinc-200/60 dark:bg-zinc-800/40 shadow-[0_0_12px_rgba(161,161,170,0.5)] dark:shadow-[0_0_12px_rgba(212,212,216,0.3)] cursor-pointer'
              : processing
                ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 cursor-pointer'
                : 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer'
          }
          ${error ? 'border-red-300 dark:border-red-800' : ''}
        `}
        title={!supported ? 'Dictado no disponible' : listening ? 'Detener grabación' : 'Iniciar dictado por voz'}
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
