'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceRecorder } from './VoiceRecorder';
import { submitVoiceEntry } from '@/app/actions/voice-entry';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

interface Section {
  key: string;
  label: string;
  prompt: string;
  value: string;
}

const SECTIONS: Section[] = [
  { key: 'gratitude1', label: 'Agradecimiento', prompt: 'Di 1–3 cosas por las que estás agradecido hoy.', value: '' },
  { key: 'whatWorked', label: 'Reflexión del día', prompt: '¿Cómo estuvo tu día? Cuenta lo más relevante.', value: '' },
  { key: 'whatDidNotWork', label: 'Mayor desafío', prompt: '¿Cuál fue tu mayor desafío hoy?', value: '' },
  { key: 'gratitude2', label: 'Aprendizaje', prompt: '¿Qué aprendiste hoy?', value: '' },
  { key: 'gratitude3', label: 'Intención', prompt: '¿Cuál es tu intención para mañana?', value: '' },
];

export function VoiceJournal() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const current = sections[currentStep];

  function handleTranscription(text: string) {
    setSections(prev => prev.map((s, i) =>
      i === currentStep ? { ...s, value: text } : s
    ));
  }

  function handleNext() {
    if (currentStep < sections.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }

  function handleEdit(value: string) {
    setSections(prev => prev.map((s, i) =>
      i === currentStep ? { ...s, value } : s
    ));
  }

  async function handleSubmit() {
    setLoading(true);
    const entryData: Record<string, any> = {};
    sections.forEach(s => {
      entryData[s.key] = s.value || '';
    });
    entryData.mood = 3;

    const res = await submitVoiceEntry(entryData);
    if (res.success) {
      setDone(true);
      setTimeout(() => router.push('/'), 2000);
    } else {
      console.error('Voice entry failed:', res.error);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-6xl mb-4">🎙️</div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">¡Entrada guardada!</h2>
        <p className="text-gray-400">Redirigiendo al inicio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-100">Diario por Voz</h1>
          <p className="text-sm text-gray-500">Sección {currentStep + 1} de {sections.length}</p>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
        />
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {sections.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentStep ? 'bg-blue-400 scale-125' :
              i < currentStep ? 'bg-green-500' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">{current.label}</h2>
        <p className="text-gray-400 text-sm mb-6">{current.prompt}</p>

        <VoiceRecorder
          onTranscriptionComplete={handleTranscription}
          placeholder="Tu respuesta aparecerá aquí..."
        />

        {current.value && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Respuesta:</p>
            <textarea
              value={current.value}
              onChange={(e) => handleEdit(e.target.value)}
              className="w-full bg-transparent text-gray-200 text-sm resize-none focus:outline-none"
              rows={2}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 rounded-lg transition-colors"
        >
          Anterior
        </button>

        {currentStep < sections.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!current.value}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !current.value}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Guardando...' : 'Guardar entrada'}
          </button>
        )}
      </div>
    </div>
  );
}
