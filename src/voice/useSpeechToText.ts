import { useCallback, useEffect, useRef, useState } from 'react';
import type { UiLocale } from '@/i18n/addItem';
import { scoreUtterance } from '@/voice/parseUtterance';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{
      isFinal?: boolean;
      0?: { transcript: string };
      length: number;
      [index: number]: { transcript: string } | boolean | undefined;
    }>;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function bestAlternative(result: { length: number; [index: number]: { transcript: string } | boolean | undefined }): string {
  let best = '';
  let bestScore = -1;
  for (let i = 0; i < result.length; i++) {
    const entry = result[i];
    const text = entry && typeof entry === 'object' ? entry.transcript : '';
    if (!text) continue;
    const score = scoreUtterance(text);
    if (score > bestScore) {
      bestScore = score;
      best = text;
    }
  }
  return best;
}

const SPEECH_LANG: Record<UiLocale, string[]> = {
  'en-IN': ['en-IN', 'en-US'],
  'hi-IN': ['hi-IN', 'en-IN'],
  'bn-IN': ['bn-IN', 'en-IN'],
  'kn-IN': ['kn-IN', 'en-IN'],
};

export function useSpeechToText(locale: UiLocale) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const finalTextRef = useRef('');
  const onTextRef = useRef<(text: string) => void>(() => undefined);

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const start = useCallback(
    (onText: (text: string) => void) => {
      const Ctor = recognitionCtor();
      if (!Ctor) {
        setError('Voice is not supported in this browser. Use Chrome.');
        return;
      }
      onTextRef.current = onText;
      finalTextRef.current = '';
      setTranscript('');
      setError('');
      listeningRef.current = true;
      setListening(true);

      const langs = SPEECH_LANG[locale];
      let langIndex = 0;

      const begin = () => {
        if (!listeningRef.current) return;
        const recognition = new Ctor();
        recognition.lang = langs[langIndex] ?? locale;
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 3;
        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = bestAlternative(event.results[i]);
            if (event.results[i].isFinal) {
              finalTextRef.current = `${finalTextRef.current} ${piece}`.replace(/\s+/g, ' ').trim();
            } else {
              interim += `${piece} `;
            }
          }
          const combined = `${finalTextRef.current} ${interim}`.replace(/\s+/g, ' ').trim();
          setTranscript(combined);
          if (combined) onTextRef.current(combined);
        };
        recognition.onerror = (event) => {
          const code = event.error;
          if (code === 'no-speech' || code === 'aborted') return;
          if (code === 'not-allowed') {
            setError('Microphone permission is blocked');
            listeningRef.current = false;
            setListening(false);
            return;
          }
          if (code === 'language-not-supported' && langIndex < langs.length - 1) {
            langIndex += 1;
            return;
          }
          setError(code === 'network' ? 'Voice needs an internet connection' : 'Could not hear that. Try again.');
        };
        recognition.onend = () => {
          if (listeningRef.current) {
            try {
              begin();
            } catch {
              setListening(false);
              listeningRef.current = false;
            }
          } else {
            setListening(false);
          }
        };
        recognitionRef.current = recognition;
        recognition.start();
      };

      begin();
    },
    [locale]
  );

  return { supported, listening, transcript, error, start, stop };
}
