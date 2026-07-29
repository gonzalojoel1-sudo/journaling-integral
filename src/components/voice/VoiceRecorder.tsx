'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  label?: string;
  placeholder?: string;
}

const SpeechRecognition = (typeof window !== 'undefined')
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

export function VoiceRecorder({ onTranscriptionComplete, label, placeholder = 'Toca para dictar...' }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef('');

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Dictado por voz no soportado en este navegador. Usa Safari o Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalRef.current += (finalRef.current ? ' ' : '') + result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      setTranscript(finalRef.current);
      setInterim(interimText);
    };

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    setError(null);
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const displayedText = transcript + (interim ? ` ${interim}` : '');

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <div className="flex gap-2">
        {!isListening ? (
          <button
            onClick={startListening}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Mic className="w-4 h-4" />
            Grabar
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors animate-pulse"
          >
            <Square className="w-4 h-4" />
            Detener
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <textarea
        value={displayedText}
        onChange={(e) => { setTranscript(e.target.value); setInterim(''); }}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setError(null)}
      />
      {displayedText && (
        <button
          onClick={() => onTranscriptionComplete(displayedText)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Confirmar sección
        </button>
      )}
    </div>
  );
}
